#!/usr/bin/env node
/**
 * Seed script: fetches D4Companion Affixes + Uniques data, writes src/data/toc-seed.json,
 * which the server bundles as the TOC cache's starting data.
 *
 * Usage:  pnpm seed [output-path]
 * Re-run after game patches to refresh affix / item / item-type name data, then
 * deploy (or purge the CDN cache with `vercel cache invalidate --tag toc`).
 * The optional output path writes elsewhere, e.g. to inspect fresh data without
 * touching the committed seed.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTocData, fetchCommitHash, D4C_REPO, D4C_AFFIXES_URL, D4C_UNIQUES_URL } from '../src/data/toc.server.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = process.argv[2] ? resolve(process.argv[2]) : join(ROOT, 'src', 'data', 'toc-seed.json')
const OUT_DIR = dirname(OUT)

const { owner, repo, branch } = D4C_REPO
console.log(`Repo: ${owner}/${repo}@${branch}`)
console.log(`  ${D4C_AFFIXES_URL}`)
console.log(`  ${D4C_UNIQUES_URL}`)

console.log('Fetching D4Companion data + commit hash...')
const [data, commitHash] = await Promise.all([
  buildTocData(),
  fetchCommitHash(owner, repo, branch),
])

if (commitHash) {
  data.commitHash = commitHash
  console.log(`  Commit hash: ${commitHash.slice(0, 12)}`)
} else {
  console.warn('  Commit hash unavailable — cache invalidation by hash disabled')
}

console.log(`  ${data.affixes.length} affixes`)
console.log(`  ${data.itemTypes.length} item types`)
console.log(`  ${data.items.length} items`)

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
const json = JSON.stringify(data)
writeFileSync(OUT, json)
console.log(`Written: ${OUT}  (${Math.round(json.length / 1024)} KB)`)
console.log(`Timestamp: ${new Date(data.ts).toISOString()}`)
