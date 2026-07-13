import { createHash } from 'node:crypto'
import { lstat, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

export const MANIFEST_SCHEMA_VERSION = 1

const RELEASE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/i
const ASSET_KEY_PATTERN = /^assets\/[A-Za-z0-9][A-Za-z0-9._/-]*$/
const SHA256_PATTERN = /^[0-9a-f]{64}$/

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertPlainObject(value, label) {
  assert(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    `${label} must be an object`,
  )
}

function normalizeTimestamp(value, label) {
  assert(typeof value === 'string' && value.length > 0, `${label} is required`)

  const timestamp = Date.parse(value)
  assert(Number.isFinite(timestamp), `${label} must be an ISO-8601 timestamp`)

  return new Date(timestamp).toISOString()
}

function validateReleaseId(releaseId) {
  assert(
    typeof releaseId === 'string' && RELEASE_ID_PATTERN.test(releaseId),
    'releaseId must contain only letters, numbers, dots, underscores, or hyphens',
  )
}

export function validateAssetKey(key) {
  assert(typeof key === 'string', 'asset key must be a string')
  assert(ASSET_KEY_PATTERN.test(key), `unsafe asset key: ${key}`)

  const segments = key.split('/')
  assert(!segments.includes('.') && !segments.includes('..'), `unsafe asset key: ${key}`)
  assert(!key.includes('//') && !key.includes('\\'), `unsafe asset key: ${key}`)

  return key
}

function validateAssetList(assets, kind) {
  assert(Array.isArray(assets), 'manifest assets must be an array')
  assert(assets.length > 0, 'manifest must contain at least one asset')

  const seenKeys = new Set()

  for (const [index, asset] of assets.entries()) {
    assertPlainObject(asset, `assets[${index}]`)
    validateAssetKey(asset.key)
    assert(!seenKeys.has(asset.key), `duplicate manifest asset: ${asset.key}`)
    seenKeys.add(asset.key)

    assert(
      Number.isSafeInteger(asset.size) && asset.size >= 0,
      `invalid asset size for ${asset.key}`,
    )

    if (kind === 'release') {
      assert(
        typeof asset.sha256 === 'string' && SHA256_PATTERN.test(asset.sha256),
        `invalid SHA-256 for ${asset.key}`,
      )
    } else {
      normalizeTimestamp(asset.lastModified, `lastModified for ${asset.key}`)
    }
  }
}

export function validateManifest(manifest) {
  assertPlainObject(manifest, 'manifest')
  assert(
    manifest.schemaVersion === MANIFEST_SCHEMA_VERSION,
    `unsupported manifest schema version: ${manifest.schemaVersion}`,
  )
  assert(
    manifest.kind === 'release' || manifest.kind === 'bootstrap',
    `unsupported manifest kind: ${manifest.kind}`,
  )

  validateReleaseId(manifest.releaseId)
  normalizeTimestamp(manifest.createdAt, 'createdAt')

  if (manifest.kind === 'release') {
    assert(
      typeof manifest.commitSha === 'string' && COMMIT_SHA_PATTERN.test(manifest.commitSha),
      'release manifest commitSha must be a full 40-character Git SHA',
    )
    assert(manifest.releaseId === manifest.commitSha, 'releaseId must equal commitSha')
    assert(typeof manifest.sourceRef === 'string' && manifest.sourceRef.length > 0, 'sourceRef is required')
    assert(typeof manifest.runId === 'string' && /^\d+$/.test(manifest.runId), 'runId must be numeric')
    assert(
      typeof manifest.runAttempt === 'string' && /^\d+$/.test(manifest.runAttempt),
      'runAttempt must be numeric',
    )
  }

  validateAssetList(manifest.assets, manifest.kind)

  return manifest
}

async function collectAssetFiles(assetDirectory) {
  const root = path.resolve(assetDirectory)
  const rootStats = await lstat(root)
  assert(rootStats.isDirectory(), `asset directory does not exist: ${root}`)

  const files = []

  async function walk(currentDirectory) {
    const entries = await readdir(currentDirectory, { withFileTypes: true })

    for (const entry of entries) {
      const absolutePath = path.join(currentDirectory, entry.name)
      const relativePath = path.relative(root, absolutePath).split(path.sep).join('/')

      if (entry.isSymbolicLink()) {
        throw new Error(`symbolic links are not allowed in deployment assets: ${relativePath}`)
      }

      if (entry.isDirectory()) {
        await walk(absolutePath)
      } else if (entry.isFile()) {
        files.push({ absolutePath, relativePath })
      } else {
        throw new Error(`unsupported deployment asset type: ${relativePath}`)
      }
    }
  }

  await walk(root)
  files.sort((left, right) => left.relativePath.localeCompare(right.relativePath))

  assert(files.length > 0, `asset directory is empty: ${root}`)
  return files
}

export async function buildReleaseManifest({
  assetDirectory,
  releaseId,
  commitSha,
  createdAt,
  sourceRef,
  runId,
  runAttempt,
}) {
  const files = await collectAssetFiles(assetDirectory)
  const assets = []

  for (const file of files) {
    const content = await readFile(file.absolutePath)
    const key = validateAssetKey(`assets/${file.relativePath}`)

    assets.push({
      key,
      size: content.byteLength,
      sha256: createHash('sha256').update(content).digest('hex'),
    })
  }

  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    kind: 'release',
    releaseId,
    commitSha,
    createdAt: normalizeTimestamp(createdAt, 'createdAt'),
    sourceRef,
    runId: String(runId),
    runAttempt: String(runAttempt),
    assets,
  }

  return validateManifest(manifest)
}

function readInventoryAssets(inventory) {
  assertPlainObject(inventory, 'S3 inventory')

  const contents = inventory.Contents ?? []
  assert(Array.isArray(contents), 'S3 inventory Contents must be an array')

  const assets = []
  const seenKeys = new Set()

  for (const [index, object] of contents.entries()) {
    assertPlainObject(object, `S3 inventory Contents[${index}]`)
    const key = validateAssetKey(object.Key)
    assert(!seenKeys.has(key), `duplicate S3 inventory key: ${key}`)
    seenKeys.add(key)

    assert(
      Number.isSafeInteger(object.Size) && object.Size >= 0,
      `invalid S3 object size for ${key}`,
    )

    assets.push({
      key,
      size: object.Size,
      lastModified: normalizeTimestamp(object.LastModified, `LastModified for ${key}`),
    })
  }

  assets.sort((left, right) => left.key.localeCompare(right.key))
  return assets
}

export function buildBootstrapManifest({ inventory, releaseId, createdAt }) {
  const assets = readInventoryAssets(inventory)
  assert(assets.length > 0, 'bootstrap manifest requires at least one existing asset')

  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    kind: 'bootstrap',
    releaseId,
    createdAt: normalizeTimestamp(createdAt, 'createdAt'),
    assets,
  }

  return validateManifest(manifest)
}

function validatePositiveInteger(value, label, minimum = 1) {
  assert(Number.isSafeInteger(value) && value >= minimum, `${label} must be at least ${minimum}`)
  return value
}

export function planAssetRetention({
  manifests,
  inventory,
  currentReleaseId,
  keepReleaseCount,
  minimumAgeHours,
  maximumDeleteCount,
  now,
}) {
  assert(Array.isArray(manifests), 'manifests must be an array')
  assert(manifests.length > 0, 'at least one deployment manifest is required')
  validateReleaseId(currentReleaseId)
  validatePositiveInteger(keepReleaseCount, 'keepReleaseCount')
  validatePositiveInteger(minimumAgeHours, 'minimumAgeHours', 0)
  validatePositiveInteger(maximumDeleteCount, 'maximumDeleteCount')

  const nowIso = normalizeTimestamp(now, 'now')
  const nowMilliseconds = Date.parse(nowIso)
  const validatedManifests = manifests.map((manifest) => validateManifest(manifest))
  const manifestsById = new Map()

  for (const manifest of validatedManifests) {
    assert(!manifestsById.has(manifest.releaseId), `duplicate releaseId: ${manifest.releaseId}`)
    manifestsById.set(manifest.releaseId, manifest)
  }

  const currentManifest = manifestsById.get(currentReleaseId)
  assert(currentManifest, `current release manifest was not found: ${currentReleaseId}`)
  assert(currentManifest.kind === 'release', 'current release manifest must have kind=release')

  const newestFirst = [...validatedManifests].sort((left, right) => {
    const timeDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt)
    return timeDifference || right.releaseId.localeCompare(left.releaseId)
  })

  const protectedManifestIds = new Set([currentReleaseId])

  for (const manifest of newestFirst) {
    if (protectedManifestIds.size >= keepReleaseCount) {
      break
    }
    protectedManifestIds.add(manifest.releaseId)
  }

  const protectedManifests = newestFirst.filter((manifest) =>
    protectedManifestIds.has(manifest.releaseId),
  )
  const protectedAssetKeys = new Set(
    protectedManifests.flatMap((manifest) => manifest.assets.map((asset) => asset.key)),
  )
  const inventoryAssets = readInventoryAssets(inventory)
  const inventoryByKey = new Map(inventoryAssets.map((asset) => [asset.key, asset]))
  const safetyErrors = []

  for (const key of protectedAssetKeys) {
    if (!inventoryByKey.has(key)) {
      safetyErrors.push(`protected asset is missing from S3 inventory: ${key}`)
    }
  }

  const candidates = []
  const deferred = []

  for (const asset of inventoryAssets) {
    if (protectedAssetKeys.has(asset.key)) {
      continue
    }

    const ageHours = Math.max(
      0,
      (nowMilliseconds - Date.parse(asset.lastModified)) / (60 * 60 * 1000),
    )
    const plannedAsset = {
      ...asset,
      ageHours: Number(ageHours.toFixed(2)),
    }

    if (ageHours >= minimumAgeHours) {
      candidates.push(plannedAsset)
    } else {
      deferred.push(plannedAsset)
    }
  }

  if (candidates.length > maximumDeleteCount) {
    safetyErrors.push(
      `candidate count ${candidates.length} exceeds maximumDeleteCount ${maximumDeleteCount}`,
    )
  }

  candidates.sort((left, right) => left.key.localeCompare(right.key))
  deferred.sort((left, right) => left.key.localeCompare(right.key))

  const summarizeManifest = (manifest) => ({
    releaseId: manifest.releaseId,
    kind: manifest.kind,
    createdAt: manifest.createdAt,
    assetCount: manifest.assets.length,
  })

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    generatedAt: nowIso,
    currentReleaseId,
    configuration: {
      keepReleaseCount,
      minimumAgeHours,
      maximumDeleteCount,
    },
    inventory: {
      assetCount: inventoryAssets.length,
      totalBytes: inventoryAssets.reduce((total, asset) => total + asset.size, 0),
    },
    manifests: {
      discoveredCount: validatedManifests.length,
      protected: protectedManifests.map(summarizeManifest),
      unprotected: newestFirst
        .filter((manifest) => !protectedManifestIds.has(manifest.releaseId))
        .map(summarizeManifest),
    },
    protectedAssets: [...protectedAssetKeys].sort().map((key) => ({ key })),
    candidates,
    deferred,
    safetyErrors,
    safeToApply: safetyErrors.length === 0,
  }
}

export function parseCliOptions(argumentsList) {
  const options = new Map()

  for (let index = 0; index < argumentsList.length; index += 2) {
    const name = argumentsList[index]
    const value = argumentsList[index + 1]

    assert(name?.startsWith('--'), `invalid option: ${name ?? '<missing>'}`)
    assert(value !== undefined && !value.startsWith('--'), `missing value for ${name}`)
    assert(!options.has(name), `duplicate option: ${name}`)
    options.set(name, value)
  }

  return options
}

export function requireCliOption(options, name) {
  const value = options.get(name)
  assert(value !== undefined && value.length > 0, `missing required option: ${name}`)
  return value
}

export function parseIntegerOption(options, name, minimum = 0) {
  const rawValue = requireCliOption(options, name)
  assert(/^\d+$/.test(rawValue), `${name} must be an integer`)

  const value = Number(rawValue)
  assert(Number.isSafeInteger(value) && value >= minimum, `${name} must be at least ${minimum}`)
  return value
}
