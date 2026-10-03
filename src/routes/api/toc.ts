import { createFileRoute } from '@tanstack/react-router'

import { getCachedTocData } from '../../data/toc-cache.server.ts'

/**
 * Plan D4: cache server-side as much as possible. Browsers keep the index for
 * 30 minutes; Vercel's CDN keeps it for a month (it consumes and strips the
 * Vercel-CDN-Cache-Control header). After a game patch, refresh with
 * `vercel cache invalidate --tag toc` or a deploy. Never set cookies here: any
 * Set-Cookie disables CDN caching.
 */
export const TOC_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=1800',
  'Vercel-CDN-Cache-Control': 'max-age=2592000, stale-while-revalidate=86400',
  'Vercel-Cache-Tag': 'toc',
} as const

export async function getToc(): Promise<Response> {
  return Response.json(await getCachedTocData(), { headers: TOC_CACHE_HEADERS })
}

export const Route = createFileRoute('/api/toc')({
  server: {
    handlers: {
      GET: getToc,
    },
  },
})
