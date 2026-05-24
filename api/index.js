import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// @remix-run/assets pulls in lightningcss + oxc native bindings at runtime.
// Vercel's bundler does not trace optional platform packages unless we resolve them here.
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
    // Different bindings are installed on macOS/Windows dev machines.
  }
}

export { default } from './bundle.js'
