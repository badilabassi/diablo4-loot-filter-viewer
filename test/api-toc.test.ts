import * as assert from 'node:assert/strict'

import { afterAll, beforeAll, describe, it, vi } from 'vitest'

import { getToc } from '../src/routes/api/toc.ts'

describe('GET /api/toc (contract C3Δ)', () => {
  // getCachedTocData() revalidates against GitHub in the background; keep tests offline.
  beforeAll(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 503 })),
    )
  })
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('returns the TOC as JSON', async () => {
    const response = await getToc()
    assert.equal(response.status, 200)
    assert.match(response.headers.get('Content-Type') ?? '', /^application\/json/)
    const body = (await response.json()) as Record<string, unknown[]>
    for (const key of ['affixes', 'itemTypes', 'items', 'talismanSets']) {
      assert.ok(Array.isArray(body[key]) && body[key].length > 0, `${key} is a non-empty array`)
    }
  })

  it('caches briefly in browsers and for a month on the CDN, purgeable by tag', async () => {
    const { headers } = await getToc()
    assert.equal(headers.get('Cache-Control'), 'public, max-age=1800')
    assert.equal(
      headers.get('Vercel-CDN-Cache-Control'),
      'max-age=2592000, stale-while-revalidate=86400',
    )
    assert.equal(headers.get('Vercel-Cache-Tag'), 'toc')
  })

  it('never sets cookies (they disable CDN caching)', async () => {
    const { headers } = await getToc()
    assert.equal(headers.get('Set-Cookie'), null)
  })
})
