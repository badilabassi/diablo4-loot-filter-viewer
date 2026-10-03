import { defineConfig } from 'vitest/config'

// Deliberately separate from vite.config.ts so unit tests don't load the
// Start/RSC/Nitro plugins.
export default defineConfig({
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
