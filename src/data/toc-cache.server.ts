import { buildTocData, fetchCommitHash, D4C_REPO } from './toc.server.ts'
import type { TocData } from '../filter/toc-types.ts'
// Bundled into the server build rather than read from public/ at runtime: under
// Nitro on Vercel, public/ is served by the CDN and isn't on the function's
// filesystem. Regenerate with `pnpm seed`.
import seed from './toc-seed.json' with { type: 'json' }

/** How often to re-check GitHub for a new commit (default: 30 min). */
const CHECK_INTERVAL = 30 * 60 * 1000

interface CacheHolder {
  cache: { data: TocData; checkedAt: number } | null
}

/**
 * Server-process-level cache — survives across requests within one deployment.
 *
 * Kept on globalThis rather than in a module variable: with RSC enabled, server
 * functions run in a separate (react-server) build environment from server
 * routes, so this module is bundled and instantiated twice. A module-level
 * variable would give each copy its own cache (two seed parses, two background
 * revalidations, possibly different data served). Both copies share this one.
 */
const holder: CacheHolder = ((globalThis as Record<symbol, CacheHolder | undefined>)[
  Symbol.for('d4-filter-viewer.toc-cache')
] ??= { cache: null })

async function loadSeed(): Promise<TocData | null> {
  try {
    const { parseTocData } = await import('../filter/toc-schemas.ts')
    return parseTocData(seed)
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
    holder.cache = { data: fresh, checkedAt: Date.now() }
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

  if (holder.cache && now - holder.cache.checkedAt < CHECK_INTERVAL) {
    return holder.cache.data
  }

  const current = holder.cache?.data ?? (await loadSeed())
  if (current) {
    holder.cache = { data: current, checkedAt: now }
    void revalidateInBackground(current)
    return current
  }

  // No data at all — must block once to fetch from D4Companion.
  const { owner, repo, branch } = D4C_REPO
  const commitHash = await fetchCommitHash(owner, repo, branch)
  const fresh = await buildTocData()
  if (commitHash) fresh.commitHash = commitHash
  holder.cache = { data: fresh, checkedAt: Date.now() }
  return fresh
}
