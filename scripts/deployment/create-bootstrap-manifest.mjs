import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  buildBootstrapManifest,
  parseCliOptions,
  requireCliOption,
} from './retention-lib.mjs'

const options = parseCliOptions(process.argv.slice(2))
const inventoryPath = path.resolve(requireCliOption(options, '--inventory'))
const outputPath = path.resolve(requireCliOption(options, '--output'))
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'))
const manifest = buildBootstrapManifest({
  inventory,
  releaseId: requireCliOption(options, '--release-id'),
  createdAt: requireCliOption(options, '--created-at'),
})

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log(
  `Created bootstrap manifest ${manifest.releaseId} with ${manifest.assets.length} assets at ${outputPath}`,
)
