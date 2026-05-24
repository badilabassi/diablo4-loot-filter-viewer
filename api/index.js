// Register the TS/TSX loader (must be imported from the function entry so Vercel traces it).
import 'remix/node-tsx'

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Trace runtime packages for Vercel's file bundler.
const tracedPackages = [
  'remix/node-tsx',
  '@remix-run/node-tsx',
  '@oxc-project/runtime',
  '@remix-run/assets',
  'lightningcss',
  'oxc-parser',
  'oxc-transform',
  'oxc-minify',
  'oxc-resolver',
  'get-tsconfig',
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

for (const pkg of tracedPackages) {
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
