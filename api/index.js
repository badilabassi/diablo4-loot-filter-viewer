import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Trace native + asset-server packages for Vercel's file bundler.
const assetRuntimePackages = [
  '@oxc-project/runtime',
  '@remix-run/assets',
  'lightningcss',
  'oxc-parser',
  'oxc-transform',
  'oxc-minify',
  'oxc-resolver',
  'lightningcss-linux-x64-gnu',
  'lightningcss-linux-arm64-gnu',
  '@oxc-parser/binding-linux-x64-gnu',
  '@oxc-parser/binding-linux-arm64-gnu',
  '@oxc-transform/binding-linux-x64-gnu',
  '@oxc-transform/binding-linux-arm64-gnu',
  '@oxc-minify/binding-linux-x64-gnu',
  '@oxc-minify/binding-linux-arm64-gnu',
  '@oxc-resolver/binding-linux-x64-gnu',
  '@oxc-resolver/binding-linux-arm64-gnu',
]

for (const pkg of assetRuntimePackages) {
  try {
    require.resolve(pkg)
  } catch {
    // Platform-specific bindings differ on local dev machines.
  }
}

/** Load app sources at runtime so each clientEntry(import.meta.url) stays a real file path. */
let routerPromise

function getRouter() {
  routerPromise ??= import('../app/router.ts').then((module) => module.router)
  return routerPromise
}

export default {
  async fetch(request) {
    try {
      return await (await getRouter()).fetch(request)
    } catch (error) {
      if (!(request.signal.aborted && error === request.signal.reason)) {
        console.error(error)
      }
      return new Response('Internal Server Error', { status: 500 })
    }
  },
}
