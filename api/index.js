import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Packages @remix-run/assets resolves at runtime (Vercel's tracer skips many of these).
const assetRuntimePackages = [
  '@oxc-project/runtime',
  '@remix-run/assets',
  '@remix-run/file-storage',
  '@remix-run/headers',
  '@remix-run/mime',
  '@remix-run/route-pattern',
  'es-module-lexer',
  'get-tsconfig',
  'lightningcss',
  'magic-string',
  'oxc-minify',
  'oxc-parser',
  'oxc-resolver',
  'oxc-transform',
  'picomatch',
  'source-map-js',
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

export { default } from './bundle.js'
