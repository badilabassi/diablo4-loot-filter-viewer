// Register the TS/TSX loader (must be imported from the function entry so Vercel traces it).
import 'remix/node-tsx'

// Side-effect imports for the full dependency tree (generated at build time).
import './trace-deps.js'

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Linux native bindings for @remix-run/assets (optional on local macOS/Windows).
const linuxNativePackages = [
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

for (const pkg of linuxNativePackages) {
  try {
    require.resolve(pkg)
  } catch {
    // Not installed on this platform.
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
