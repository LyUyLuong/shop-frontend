import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  buildBootstrapManifest,
  buildReleaseManifest,
  planAssetRetention,
  validateAssetKey,
} from './retention-lib.mjs'

const SHA_A = 'a'.repeat(40)
const SHA_B = 'b'.repeat(40)
const SHA_C = 'c'.repeat(40)

function releaseManifest(releaseId, createdAt, assetKeys) {
  return {
    schemaVersion: 1,
    kind: 'release',
    releaseId,
    commitSha: releaseId,
    createdAt,
    sourceRef: 'refs/heads/main',
    runId: '123',
    runAttempt: '1',
    assets: assetKeys.map((key, index) => ({
      key,
      size: 100 + index,
      sha256: String(index + 1).padStart(64, '0'),
    })),
  }
}

function inventory(objects) {
  return {
    Contents: objects.map(([Key, LastModified], index) => ({
      Key,
      Size: 100 + index,
      LastModified,
    })),
  }
}

test('buildReleaseManifest inventories and hashes every nested asset', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'shop-release-manifest-'))

  try {
    const assetDirectory = path.join(temporaryDirectory, 'assets')
    await mkdir(path.join(assetDirectory, 'chunks'), { recursive: true })
    await writeFile(path.join(assetDirectory, 'app.js'), 'console.log("shop")\n')
    await writeFile(path.join(assetDirectory, 'chunks', 'admin.css'), '.admin {}\n')

    const manifest = await buildReleaseManifest({
      assetDirectory,
      releaseId: SHA_A,
      commitSha: SHA_A,
      createdAt: '2026-07-13T00:00:00Z',
      sourceRef: 'refs/heads/main',
      runId: '10',
      runAttempt: '2',
    })

    assert.deepEqual(
      manifest.assets.map((asset) => asset.key),
      ['assets/app.js', 'assets/chunks/admin.css'],
    )
    assert.match(manifest.assets[0].sha256, /^[0-9a-f]{64}$/)
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
})

test('buildBootstrapManifest protects every asset found before the first managed release', () => {
  const manifest = buildBootstrapManifest({
    inventory: inventory([
      ['assets/legacy.js', '2026-07-01T00:00:00Z'],
      ['assets/legacy.css', '2026-07-01T00:00:00Z'],
    ]),
    releaseId: 'bootstrap-20260713T000000Z-10',
    createdAt: '2026-07-13T00:00:00Z',
  })

  assert.equal(manifest.kind, 'bootstrap')
  assert.deepEqual(
    manifest.assets.map((asset) => asset.key),
    ['assets/legacy.css', 'assets/legacy.js'],
  )
})

test('retention protects current and recent releases while selecting only old assets', () => {
  const plan = planAssetRetention({
    manifests: [
      releaseManifest(SHA_A, '2026-07-10T00:00:00Z', ['assets/a.js']),
      releaseManifest(SHA_B, '2026-07-11T00:00:00Z', ['assets/b.js']),
      releaseManifest(SHA_C, '2026-07-12T00:00:00Z', ['assets/c.js']),
    ],
    inventory: inventory([
      ['assets/a.js', '2026-07-01T00:00:00Z'],
      ['assets/b.js', '2026-07-11T00:00:00Z'],
      ['assets/c.js', '2026-07-12T00:00:00Z'],
      ['assets/orphan-old.js', '2026-07-01T00:00:00Z'],
      ['assets/orphan-new.js', '2026-07-12T12:00:00Z'],
    ]),
    currentReleaseId: SHA_C,
    keepReleaseCount: 2,
    minimumAgeHours: 168,
    maximumDeleteCount: 10,
    now: '2026-07-13T00:00:00Z',
  })

  assert.deepEqual(
    plan.manifests.protected.map((manifest) => manifest.releaseId),
    [SHA_C, SHA_B],
  )
  assert.deepEqual(
    plan.candidates.map((asset) => asset.key),
    ['assets/a.js', 'assets/orphan-old.js'],
  )
  assert.deepEqual(
    plan.deferred.map((asset) => asset.key),
    ['assets/orphan-new.js'],
  )
  assert.equal(plan.safeToApply, true)
})

test('retention refuses a plan that exceeds the deletion guard', () => {
  const plan = planAssetRetention({
    manifests: [releaseManifest(SHA_A, '2026-07-12T00:00:00Z', ['assets/current.js'])],
    inventory: inventory([
      ['assets/current.js', '2026-07-12T00:00:00Z'],
      ['assets/old-a.js', '2026-07-01T00:00:00Z'],
      ['assets/old-b.js', '2026-07-01T00:00:00Z'],
    ]),
    currentReleaseId: SHA_A,
    keepReleaseCount: 1,
    minimumAgeHours: 1,
    maximumDeleteCount: 1,
    now: '2026-07-13T00:00:00Z',
  })

  assert.equal(plan.safeToApply, false)
  assert.match(plan.safetyErrors[0], /exceeds maximumDeleteCount/)
})

test('retention refuses cleanup when a protected asset is missing', () => {
  const plan = planAssetRetention({
    manifests: [releaseManifest(SHA_A, '2026-07-12T00:00:00Z', ['assets/current.js'])],
    inventory: { Contents: [] },
    currentReleaseId: SHA_A,
    keepReleaseCount: 1,
    minimumAgeHours: 1,
    maximumDeleteCount: 10,
    now: '2026-07-13T00:00:00Z',
  })

  assert.equal(plan.safeToApply, false)
  assert.deepEqual(plan.safetyErrors, [
    'protected asset is missing from S3 inventory: assets/current.js',
  ])
})

test('asset validation rejects traversal and non-asset prefixes', () => {
  assert.throws(() => validateAssetKey('../index.html'), /unsafe asset key/)
  assert.throws(() => validateAssetKey('index.html'), /unsafe asset key/)
  assert.throws(() => validateAssetKey('assets/../index.html'), /unsafe asset key/)
})
