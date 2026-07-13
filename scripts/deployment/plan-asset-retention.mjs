import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  parseCliOptions,
  parseIntegerOption,
  planAssetRetention,
  requireCliOption,
} from './retention-lib.mjs'

const options = parseCliOptions(process.argv.slice(2))
const manifestDirectory = path.resolve(requireCliOption(options, '--manifest-directory'))
const inventoryPath = path.resolve(requireCliOption(options, '--inventory'))
const outputPath = path.resolve(requireCliOption(options, '--output'))
const manifestFiles = (await readdir(manifestDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  .map((entry) => path.join(manifestDirectory, entry.name))
  .sort()

const manifests = await Promise.all(
  manifestFiles.map(async (manifestPath) => JSON.parse(await readFile(manifestPath, 'utf8'))),
)
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'))
const plan = planAssetRetention({
  manifests,
  inventory,
  currentReleaseId: requireCliOption(options, '--current-release-id'),
  keepReleaseCount: parseIntegerOption(options, '--keep-releases', 1),
  minimumAgeHours: parseIntegerOption(options, '--minimum-age-hours', 0),
  maximumDeleteCount: parseIntegerOption(options, '--maximum-delete-count', 1),
  now: requireCliOption(options, '--now'),
})

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8')

console.log(
  [
    `Retention plan written to ${outputPath}`,
    `manifests=${plan.manifests.discoveredCount}`,
    `protectedAssets=${plan.protectedAssets.length}`,
    `candidates=${plan.candidates.length}`,
    `deferred=${plan.deferred.length}`,
    `safeToApply=${plan.safeToApply}`,
  ].join(' '),
)

for (const safetyError of plan.safetyErrors) {
  console.error(`Retention safety error: ${safetyError}`)
}
