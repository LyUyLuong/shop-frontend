import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  parseCliOptions,
  requireCliOption,
  validateManifest,
} from './retention-lib.mjs'

const options = parseCliOptions(process.argv.slice(2))
const manifestPath = path.resolve(requireCliOption(options, '--manifest'))
const expectedReleaseId = requireCliOption(options, '--expected-release-id')
const manifest = validateManifest(JSON.parse(await readFile(manifestPath, 'utf8')))

if (manifest.kind !== 'release') {
  throw new Error(`expected release manifest, received kind=${manifest.kind}`)
}

if (manifest.releaseId !== expectedReleaseId) {
  throw new Error(
    `release manifest mismatch: expected ${expectedReleaseId}, received ${manifest.releaseId}`,
  )
}

console.log(`Validated release manifest ${manifest.releaseId} with ${manifest.assets.length} assets`)
