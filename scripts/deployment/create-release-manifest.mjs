import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  buildReleaseManifest,
  parseCliOptions,
  requireCliOption,
} from './retention-lib.mjs'

const options = parseCliOptions(process.argv.slice(2))
const outputPath = path.resolve(requireCliOption(options, '--output'))
const manifest = await buildReleaseManifest({
  assetDirectory: requireCliOption(options, '--asset-directory'),
  releaseId: requireCliOption(options, '--release-id'),
  commitSha: requireCliOption(options, '--commit-sha'),
  createdAt: requireCliOption(options, '--created-at'),
  sourceRef: requireCliOption(options, '--source-ref'),
  runId: requireCliOption(options, '--run-id'),
  runAttempt: requireCliOption(options, '--run-attempt'),
})

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log(
  `Created release manifest ${manifest.releaseId} with ${manifest.assets.length} assets at ${outputPath}`,
)
