import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  buildMaxrollItemNames,
  fetchCommitHash,
  fetchCoreTOC,
  fetchMaxrollData,
  fetchMaxrollEtag,
  processCoreTOC,
  REPOS,
} from './toc.ts'
import type { TocData } from '../filter/toc-types.ts'

/** How often to re-check GitHub for a new commit (default: 30 min). */
const CHECK_INTERVAL = 30 * 60 * 1000;

/** Server-process-level cache — survives across requests within one deployment. */
let cache: { data: TocData; checkedAt: number } | null = null;

async function loadFromFilesystem(): Promise<TocData | null> {
  try {
    const raw = await readFile(join(process.cwd(), "public", "data", "toc.json"), "utf-8");
    const { parseTocData } = await import('../filter/toc-schemas.ts')
    return parseTocData(JSON.parse(raw))
  } catch {
    return null;
  }
}

/**
 * Fetches the latest commit SHA for the first REPO that responds.
 * Uses the Git refs API — minimal payload, no auth required.
 */
async function getLatestCommitHash(): Promise<string | null> {
  for (const { owner, repo, branch } of REPOS) {
    const hash = await fetchCommitHash(owner, repo, branch);
    if (hash) return hash;
  }
  return null;
}

/**
 * Checks both upstream sources in parallel.
 * Returns early as soon as we know staleness — lightweight HEAD for Maxroll,
 * Git refs API for GitHub.
 */
async function checkUpstream(): Promise<{ commitHash: string | null; maxrollEtag: string | null }> {
  const [commitHash, maxrollEtag] = await Promise.all([getLatestCommitHash(), fetchMaxrollEtag()]);
  return { commitHash, maxrollEtag };
}

async function buildFresh(commitHash: string | null, maxrollEtag: string | null): Promise<TocData> {
  const [raw, maxrollData] = await Promise.allSettled([fetchCoreTOC(), fetchMaxrollData()]);
  if (raw.status === "rejected") throw new Error(`CoreTOC fetch failed: ${raw.reason}`);

  let itemNameOverrides: ReturnType<typeof buildMaxrollItemNames> | undefined;
  if (maxrollData.status === "fulfilled") {
    itemNameOverrides = buildMaxrollItemNames(maxrollData.value);
  }

  const data = processCoreTOC(raw.value, itemNameOverrides);
  if (commitHash) data.commitHash = commitHash;
  if (maxrollEtag) data.maxrollEtag = maxrollEtag;
  return data;
}

/**
 * Performs the upstream staleness check and rebuilds the cache if either
 * source has changed. Runs fire-and-forget so callers are never blocked.
 */
async function revalidateInBackground(current: TocData): Promise<void> {
  try {
    const { commitHash: latestCommit, maxrollEtag: latestEtag } = await checkUpstream();
    const commitUnchanged = !latestCommit || current.commitHash === latestCommit;
    const maxrollUnchanged = !latestEtag || current.maxrollEtag === latestEtag;
    if (!commitUnchanged || !maxrollUnchanged) {
      const fresh = await buildFresh(latestCommit, latestEtag);
      cache = { data: fresh, checkedAt: Date.now() };
    }
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
 *  3. No data at all         → block once to fetch from GitHub (cold start).
 */
export async function getCachedTocData(): Promise<TocData> {
  const now = Date.now();

  if (cache && now - cache.checkedAt < CHECK_INTERVAL) {
    return cache.data;
  }

  const current = cache?.data ?? (await loadFromFilesystem());
  if (current) {
    cache = { data: current, checkedAt: now };
    revalidateInBackground(current);
    return current;
  }

  // No data at all — must block once to fetch from GitHub.
  const { commitHash: latestCommit, maxrollEtag: latestEtag } = await checkUpstream();
  const fresh = await buildFresh(latestCommit, latestEtag);
  cache = { data: fresh, checkedAt: now };
  return fresh;
}