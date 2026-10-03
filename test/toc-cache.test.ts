import * as assert from 'node:assert/strict'

import { afterAll, beforeAll, describe, it, vi } from 'vitest'

describe('getCachedTocData', () => {
  // getCachedTocData() revalidates against GitHub in the background; keep tests offline.
  beforeAll(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })))
  })
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('shares one cache across separate instances of the module', async () => {
    // With RSC on, server routes and server functions run in different build
    // environments, each with its own instance of this module. Simulate that by
    // importing two fresh instances.
    vi.resetModules()
    const first = await import('../src/data/toc-cache.server.ts')
    vi.resetModules()
    const second = await import('../src/data/toc-cache.server.ts')
    assert.notEqual(first.getCachedTocData, second.getCachedTocData, 'two module instances')
    assert.equal(await first.getCachedTocData(), await second.getCachedTocData(), 'same cached data object')
  })

  it('serves the cached data without re-parsing while fresh', async () => {
    const { getCachedTocData } = await import('../src/data/toc-cache.server.ts')
    assert.equal(await getCachedTocData(), await getCachedTocData())
  })
})
