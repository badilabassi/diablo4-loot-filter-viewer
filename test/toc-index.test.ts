import * as assert from 'node:assert/strict'

import { afterAll, beforeAll, describe, it, vi } from 'vitest'

import {
  SEARCH_LIMIT,
  buildTocIndex,
  getTocIndex,
  resolveTocEntries,
  searchTocEntries,
} from '../src/data/toc-index.server.ts'
import type { TocData } from '../src/filter/toc-types.ts'

const DATA: TocData = {
  affixes: [
    { id: 1, name: 'Critical Strike Chance', cat: 'offense', raw: 'CritChance' },
    { id: 2, name: 'Maximum Life', cat: 'defense', raw: 'Life' },
    { id: 3, name: 'Critical Strike Damage', cat: 'offense', raw: 'CritDamage' },
  ],
  itemTypes: [{ id: 10, name: 'Helm' }],
  items: [{ id: 20, name: 'Harlequin Crest' }],
  talismanSets: [{ id: 30, name: 'Set of the Wolf' }],
  ts: 0,
}

describe('buildTocIndex', () => {
  it('indexes every list by id', () => {
    const index = buildTocIndex(DATA)
    assert.equal(index.affixById.get(2)?.name, 'Maximum Life')
    assert.equal(index.itemTypeById.get(10)?.name, 'Helm')
    assert.equal(index.itemById.get(20)?.name, 'Harlequin Crest')
    assert.equal(index.talismanSetById.get(30)?.name, 'Set of the Wolf')
  })

  it('is memoized per data object and rebuilt for new data', () => {
    assert.equal(buildTocIndex(DATA), buildTocIndex(DATA))
    assert.notEqual(buildTocIndex(DATA), buildTocIndex({ ...DATA }))
  })
})

describe('searchTocEntries', () => {
  const index = buildTocIndex(DATA)

  it('matches substrings case-insensitively, in index order, with the affix category', () => {
    assert.deepEqual(searchTocEntries(index, 'affix', 'CRIT'), [
      { id: 1, label: 'Critical Strike Chance', sub: 'offense' },
      { id: 3, label: 'Critical Strike Damage', sub: 'offense' },
    ])
  })

  it('skips excluded (already selected) ids', () => {
    assert.deepEqual(searchTocEntries(index, 'affix', 'crit', [1]).map((e) => e.id), [3])
  })

  it('lists entries for an empty query', () => {
    assert.deepEqual(searchTocEntries(index, 'affix', '').map((e) => e.id), [1, 2, 3])
  })

  it('searches the requested kind only', () => {
    assert.deepEqual(searchTocEntries(index, 'item', 'crest'), [{ id: 20, label: 'Harlequin Crest' }])
    assert.deepEqual(searchTocEntries(index, 'itemType', 'crest'), [])
  })
})

describe('resolveTocEntries', () => {
  it('returns entries in the requested order and omits unknown ids', () => {
    const index = buildTocIndex(DATA)
    assert.deepEqual(resolveTocEntries(index, 'affix', [3, 999, 1]).map((e) => e.id), [3, 1])
  })
})

describe('getTocIndex (bundled seed)', () => {
  // getCachedTocData() revalidates against GitHub in the background; keep tests offline.
  beforeAll(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })))
  })
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('loads the bundled seed without network access', async () => {
    const index = await getTocIndex()
    assert.ok(index.data.affixes.length > 4000)
    assert.ok(index.data.items.length > 1000)
  })

  it('caps search results at the picker limit', async () => {
    const index = await getTocIndex()
    assert.equal(SEARCH_LIMIT, 80)
    assert.equal(searchTocEntries(index, 'affix', '').length, SEARCH_LIMIT)
  })
})
