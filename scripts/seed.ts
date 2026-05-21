#!/usr/bin/env tsx
/**
 * Seed script: fetches CoreTOC.dat.json + Maxroll game data, writes public/data/toc.json.
 *
 * Usage:  pnpm seed
 * Re-run after game patches to refresh affix / item-type / item name data.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildMaxrollItemNames,
  fetchCommitHash,
  fetchCoreTOC,
  fetchMaxrollData,
  fetchMaxrollEtag,
  processCoreTOC,
  REPOS,
} from '../src/lib/toc.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'data')
const OUT = join(OUT_DIR, 'toc.json')

const repos = REPOS.map(({ owner, repo, branch }) => `${owner}/${repo}@${branch}`).join(', ')
console.log(`Repos: ${repos}`)

// Fetch CoreTOC, Maxroll data, commit hash, and Maxroll ETag in parallel
console.log('Fetching CoreTOC.dat.json + Maxroll game data + upstream hashes...')
const [raw, maxrollData, commitHash, maxrollEtag] = await Promise.allSettled([
  fetchCoreTOC(),
  fetchMaxrollData(),
  (async () => {
    for (const { owner, repo, branch } of REPOS) {
      const hash = await fetchCommitHash(owner, repo, branch)
      if (hash) return hash
    }
    return null
  })(),
  fetchMaxrollEtag(),
])

if (raw.status === 'rejected') throw new Error(`CoreTOC fetch failed: ${raw.reason}`)

let itemNameOverrides: Map<number, string> | undefined
if (maxrollData.status === 'fulfilled') {
  itemNameOverrides = buildMaxrollItemNames(maxrollData.value)
  console.log(`  Maxroll: ${itemNameOverrides.size} item names`)
} else {
  console.warn(`  Maxroll fetch failed (using fallback names): ${maxrollData.reason}`)
}

console.log('Processing...')
const data = processCoreTOC(raw.value, itemNameOverrides)
if (commitHash.status === 'fulfilled' && commitHash.value) {
  data.commitHash = commitHash.value
  console.log(`  Commit hash: ${commitHash.value.slice(0, 12)}`)
} else {
  console.warn('  Commit hash unavailable — cache invalidation by hash disabled')
}
if (maxrollEtag.status === 'fulfilled' && maxrollEtag.value) {
  data.maxrollEtag = maxrollEtag.value
  console.log(`  Maxroll ETag: ${maxrollEtag.value}`)
} else {
  console.warn('  Maxroll ETag unavailable — Maxroll cache invalidation disabled')
}
console.log(`  ${data.affixes.length} affixes`)
console.log(`  ${data.itemTypes.length} item types`)
console.log(`  ${data.items.length} items`)

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
const json = JSON.stringify(data)
writeFileSync(OUT, json)
console.log(`Written: ${OUT}  (${Math.round(json.length / 1024)} KB)`)
console.log(`Timestamp: ${new Date(data.ts).toISOString()}`)
