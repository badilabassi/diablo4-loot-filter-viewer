import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['scripts/vercel-handler.ts'],
  outfile: 'api/bundle.js',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  packages: 'external',
  jsx: 'automatic',
  jsxImportSource: 'remix/ui',
  logLevel: 'info',
})
