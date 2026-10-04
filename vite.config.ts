import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tanstackStart({ rsc: { enabled: true } }),
    rsc(),
    nitro({
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
    // React Compiler, native (Rust) via oxc-transform-react; experimental in
    // @vitejs/plugin-react 6. It only compiles client-environment code, so server
    // components and SSR output are untouched. logDiagnostics surfaces components
    // the compiler skips (e.g. Rules of React violations) as build warnings.
    viteReact({ compiler: { logDiagnostics: true } }),
  ],
})
