import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildTocData, fetchCommitHash, D4C_REPO } from './toc.ts'
import type { TocData } from '../filter/toc-types.ts'

/** How often to re-check GitHub for a new commit (default: 30 min). */
const CHECK_INTERVAL = 30 * 60 * 1000

/** Server-process-level cache — survives across requests within one deployment. */
let cache: { data: TocData; checkedAt: number } | null = null

async function loadFromFilesystem(): Promise<TocData | null> {
  try {
    const raw = await readFile(join(process.cwd(), 'public', 'data', 'toc.json'), 'utf-8')
    const { parseTocData } = await import('../filter/toc-schemas.ts')
    return parseTocData(JSON.parse(raw))
  } catch {
    return null
  }
}

/**
 * Checks whether the D4Companion repo has a new commit and rebuilds the cache
 * if so. Runs fire-and-forget so callers are never blocked.
 */
async function revalidateInBackground(current: TocData): Promise<void> {
  try {
    const { owner, repo, branch } = D4C_REPO
    const latestHash = await fetchCommitHash(owner, repo, branch)
    if (latestHash && current.commitHash === latestHash) return
    const fresh = await buildTocData()
    if (latestHash) fresh.commitHash = latestHash
    cache = { data: fresh, checkedAt: Date.now() }
  } catch {
    // Background revalidation failures are non-fatal — stale data stays cached.
  }
}

/**
 * Returns TocData using a stale-while-revalidate strategy.
 * Safe to call from any server-side context (API routes, middleware, etc.).
 *
 *  1. In-memory cache fresh  → return immediately, zero I/O.
 *  2. Stale or cold cache    → return stale/seed data immediately,
 *                              revalidate upstream in the background.
 *  3. No data at all         → block once to fetch from D4Companion (cold start).
 */
export async function getCachedTocData(): Promise<TocData> {
  const now = Date.now()

  if (cache && now - cache.checkedAt < CHECK_INTERVAL) {
    return cache.data
  }

  const current = cache?.data ?? (await loadFromFilesystem())
  if (current) {
    cache = { data: current, checkedAt: now }
    void revalidateInBackground(current)
    return current
  }

  // No data at all — must block once to fetch from D4Companion.
  const { owner, repo, branch } = D4C_REPO
  const commitHash = await fetchCommitHash(owner, repo, branch)
  const fresh = await buildTocData()
  if (commitHash) fresh.commitHash = commitHash
  cache = { data: fresh, checkedAt: Date.now() }
  return fresh
}
