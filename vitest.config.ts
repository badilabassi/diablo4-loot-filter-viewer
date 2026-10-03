import { defineConfig } from 'vitest/config'

// Unit tests for the TanStack Start app. Deliberately separate from vite.config.ts
// so tests don't load the Start/RSC/Nitro plugins. test/remix/ holds the Remix
// app's route tests, which run under `remix test` until the cleanup phase.
export default defineConfig({
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: ['test/remix/**', 'node_modules/**'],
    environment: 'node',
  },
})
