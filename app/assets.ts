import { createAssetServer } from 'remix/assets'

const rootDir = process.cwd()

export const assetServer = createAssetServer({
  basePath: '/assets',
  rootDir,
  watch: process.env.NODE_ENV !== 'production',
  allowFiles: [
    'app/assets/**',
    'app/actions/**',
    'app/ui/**',
    'app/state/**',
    'app/filter/**',
  ],
  allowPackages: ['remix', 'motion', 'zod', '@vercel/analytics', '@vercel/speed-insights'],
  denyFiles: ['app/**/*.server.*'],
  sourceMaps: process.env.NODE_ENV === 'development' ? 'external' : undefined,
  scripts: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
    },
  },
})
