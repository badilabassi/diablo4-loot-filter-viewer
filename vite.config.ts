import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // 3001 while the Remix app still owns 3000 during the migration.
  server: { port: 3001 },
  plugins: [
    tanstackStart({ rsc: { enabled: true } }),
    rsc(),
    // Nitro auto-detects a root server.ts as a catch-all server entry that runs
    // before the renderer. The root server.ts is still the Remix server until the
    // migration's cleanup phase, so disable that detection explicitly.
    nitro({
      serverEntry: false,
      // Plan D10. Vercel serves public/ files with max-age=0. Fonts avoid that by
      // being fingerprinted Vite assets (immutable); the favicon can't be, since
      // browsers request it by name, so give it a moderate cache.
      routeRules: {
        '/favicon.svg': {
          headers: { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' },
        },
      },
    }),
    // Must come after the Start plugin.
    viteReact(),
  ],
})
