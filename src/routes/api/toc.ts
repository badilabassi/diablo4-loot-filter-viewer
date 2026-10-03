import { createFileRoute } from '@tanstack/react-router'

// Spike probe (c): the real seed, bundled into the server output (plan D5) rather
// than read from public/ at runtime. Phase 2 replaces this with the cached loader.
import seed from '../../../public/data/toc.json'

export const Route = createFileRoute('/api/toc')({
  server: {
    handlers: {
      GET: () =>
        Response.json(seed, {
          headers: {
            // Plan D4: browsers 30 min; Vercel CDN one month; purge by tag.
            'Cache-Control': 'public, max-age=1800',
            'Vercel-CDN-Cache-Control': 'max-age=2592000, stale-while-revalidate=86400',
            'Vercel-Cache-Tag': 'toc',
          },
        }),
    },
  },
})
