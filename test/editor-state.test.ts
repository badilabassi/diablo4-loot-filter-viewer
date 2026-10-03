// @vitest-environment jsdom
import * as assert from 'node:assert/strict'

import { beforeEach, describe, it, vi } from 'vitest'

import type { TocLabels } from '../src/editor/toc-labels.ts'
import { EXAMPLE_FILTER } from '../src/filter/constants.ts'
import { parseFilterB64, serializeFilter } from '../src/filter/proto.ts'

const noLabels = (): TocLabels => ({ affix: {}, itemType: {}, item: {}, talismanSet: {} })

// bootstrapEditor remembers the last loaded code in module state, so each test
// gets fresh module instances.
async function fresh() {
  vi.resetModules()
  const state = await import('../src/editor/editor-state.tsx')
  const store = await import('../src/editor/editor-store.ts')
  const labels = await import('../src/editor/toc-labels.ts')
  return { ...state, ...store, ...labels }
}

describe('bootstrapEditor', () => {
  let m: Awaited<ReturnType<typeof fresh>>
  beforeEach(async () => {
    m = await fresh()
  })

  it('loads the filter from ?code into the editor', () => {
    m.bootstrapEditor(EXAMPLE_FILTER, parseFilterB64(EXAMPLE_FILTER), noLabels())
    assert.equal(m.editorStore.getState().filter.rules.length, 16)
  })

  it('does nothing without a code or a parsed filter (keeps the current work)', () => {
    m.editorStore.setFilterName('Work in progress')
    m.bootstrapEditor(undefined, null, noLabels())
    m.bootstrapEditor('garbage', null, noLabels())
    assert.equal(m.editorStore.getState().filter.name, 'Work in progress')
  })

  it('loads each code once: re-renders with the same code keep edits', () => {
    m.bootstrapEditor(EXAMPLE_FILTER, parseFilterB64(EXAMPLE_FILTER), noLabels())
    m.editorStore.setFilterName('Edited')
    m.bootstrapEditor(EXAMPLE_FILTER, parseFilterB64(EXAMPLE_FILTER), noLabels())
    assert.equal(m.editorStore.getState().filter.name, 'Edited')
  })

  it('keeps edits and undo history across Edit → View → Edit (bug #1)', () => {
    m.bootstrapEditor(EXAMPLE_FILTER, parseFilterB64(EXAMPLE_FILTER), noLabels())
    m.editorStore.removeRule(0)
    // The View link carries the edited filter; coming back, /edit?code=<edited>.
    const edited = serializeFilter(m.editorStore.getState().filter)
    m.bootstrapEditor(edited, parseFilterB64(edited), noLabels())
    assert.equal(m.editorStore.getState().filter.rules.length, 15)
    assert.equal(m.editorStore.canUndo(), true, 'undo history survives the round trip')
  })

  it('replaces the editor when a different filter arrives', () => {
    m.bootstrapEditor(EXAMPLE_FILTER, parseFilterB64(EXAMPLE_FILTER), noLabels())
    const other = serializeFilter({ name: 'Other', rules: [{ name: 'Only', type: 0, enabled: true, conditions: [] }] })
    m.bootstrapEditor(other, parseFilterB64(other), noLabels())
    assert.equal(m.editorStore.getState().filter.name, 'Other')
    assert.equal(m.editorStore.canUndo(), false)
  })

  it('remembers the loader’s labels for the pickers', () => {
    const labels = noLabels()
    labels.affix[7] = { id: 7, label: 'Maximum Life', sub: 'defense' }
    m.bootstrapEditor(undefined, null, labels)
    assert.equal(m.tocLabelStore.getState().affix[7]?.label, 'Maximum Life')
  })
})

describe('selectionAfterMove', async () => {
  const { selectionAfterMove } = await import('../src/editor/editor.tsx')

  it('follows the moved rule', () => {
    assert.equal(selectionAfterMove(2, 2, 3), 3)
    assert.equal(selectionAfterMove(2, 2, 0), 0)
  })

  it('shifts rules the move passes over', () => {
    assert.equal(selectionAfterMove(3, 1, 4), 2)
    assert.equal(selectionAfterMove(1, 4, 0), 2)
  })

  it('leaves unaffected rules alone', () => {
    assert.equal(selectionAfterMove(5, 1, 2), 5)
    assert.equal(selectionAfterMove(0, 3, 4), 0)
  })
})
