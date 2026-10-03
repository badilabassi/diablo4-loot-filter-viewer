import { createAssetServer } from 'remix/assets'

const rootDir = process.cwd()

export const assetServer = createAssetServer({
  basePath: '/assets',
  rootDir,
  watch: process.env.NODE_ENV !== 'production',
  // Defaults (app → /app, node_modules → /npm) plus src/, where modules shared
  // with the TanStack Start app live during the migration.
  mounts: { app: 'app', src: 'src', npm: 'node_modules' },
  allowFiles: [
    'app/assets/**',
    'app/actions/**',
    'app/ui/**',
    'app/state/**',
    'src/filter/**',
    'src/editor/**',
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
