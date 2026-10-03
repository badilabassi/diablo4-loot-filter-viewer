import * as assert from 'node:assert/strict'

import { describe, it } from 'vitest'

import { buildTocIndex } from '../src/data/toc-index.server.ts'
import seed from '../src/data/toc-seed.json' with { type: 'json' }
import { EXAMPLE_FILTER } from '../src/filter/constants.ts'
import { parseTocData } from '../src/filter/toc-schemas.ts'
import { referencedIds } from '../src/viewer/names.ts'
import { buildViewerModel } from '../src/viewer/viewer-model.server.ts'

const index = buildTocIndex(parseTocData(seed))
const NOW = index.data.ts + 3 * 24 * 60 * 60 * 1000

describe('buildViewerModel', () => {
  it('shows nothing (and a plain /edit link) without a code', () => {
    const m = buildViewerModel(undefined, index, NOW)
    assert.equal(m.filter, null)
    assert.equal(m.error, null)
    assert.equal(m.editHref, '/edit')
    assert.deepEqual(m.names, { affixes: {}, itemTypes: {}, items: {}, talismanSets: {} })
  })

  it('treats a blank code like no code', () => {
    assert.equal(buildViewerModel('   \n', index, NOW).filter, null)
    assert.equal(buildViewerModel('   \n', index, NOW).error, null)
  })

  it('parses the example and resolves every name it references on the server', () => {
    const m = buildViewerModel(EXAMPLE_FILTER, index, NOW)
    assert.ok(m.filter)
    assert.equal(m.filter.rules.length, 16)
    assert.equal(m.error, null)
    const ids = referencedIds(m.filter)
    assert.equal(Object.keys(m.names.affixes).length, ids.affixes.size)
    for (const id of ids.affixes) assert.ok(m.names.affixes[id], `affix ${id} resolved`)
  })

  it('links to the editor with the code, URL-encoded (contract C6Δ)', () => {
    const m = buildViewerModel(`  ${EXAMPLE_FILTER}\n`, index, NOW)
    assert.equal(m.editHref, `/edit?code=${encodeURIComponent(EXAMPLE_FILTER)}`)
    assert.equal(decodeURIComponent(m.editHref.split('code=')[1]!), EXAMPLE_FILTER)
  })

  it('reports a parse error and links to a blank editor for an invalid code', () => {
    const m = buildViewerModel('not-a-filter', index, NOW)
    assert.equal(m.filter, null)
    assert.equal(typeof m.error, 'string')
    assert.ok(m.error)
    assert.equal(m.editHref, '/edit')
  })

  it('reports index size and age computed on the server', () => {
    const m = buildViewerModel(undefined, index, NOW)
    assert.equal(m.status.affixes, index.data.affixes.length)
    assert.equal(m.status.items, index.data.items.length)
    assert.equal(m.age, '3d ago')
  })
})
