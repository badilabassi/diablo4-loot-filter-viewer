import * as assert from 'node:assert/strict'

import { beforeEach, describe, it } from 'vitest'

import { editorStore, loadFilterIntoEditor } from '../src/editor/editor-store.ts'
import { createTemporalStore } from '../src/editor/history.ts'
import type { ParsedFilter } from '../src/filter/schemas.ts'

const FILTER: ParsedFilter = {
  name: 'Fixture',
  rules: [
    { name: 'A', type: 0, enabled: true, conditions: [] },
    { name: 'B', type: 0, enabled: true, conditions: [] },
  ],
}

const ruleNames = () => editorStore.getState().filter.rules.map((r) => r.name)

describe('createTemporalStore', () => {
  const make = () => createTemporalStore({ n: 0, label: 'x' }, (s) => ({ n: s.n }))

  it('undo restores the previous snapshot and redo re-applies it', () => {
    const s = make()
    s.mutate((d) => {
      d.n = 1
    })
    s.mutate((d) => {
      d.n = 2
    })
    s.undo()
    assert.equal(s.getState().n, 1)
    s.redo()
    assert.equal(s.getState().n, 2)
  })

  it('only restores the partialized fields', () => {
    const s = make()
    s.mutate((d) => {
      d.n = 1
    })
    s.setState({ ...s.getState(), label: 'changed without history' })
    s.undo()
    assert.deepEqual(s.getState(), { n: 0, label: 'changed without history' })
  })

  it('a new mutation clears the redo stack', () => {
    const s = make()
    s.mutate((d) => {
      d.n = 1
    })
    s.undo()
    assert.equal(s.canRedo(), true)
    s.mutate((d) => {
      d.n = 5
    })
    assert.equal(s.canRedo(), false)
  })

  it('keeps at most 50 undo steps', () => {
    const s = make()
    for (let i = 1; i <= 60; i++)
      s.mutate((d) => {
        d.n = i
      })
    let steps = 0
    while (s.canUndo()) {
      s.undo()
      steps++
    }
    assert.equal(steps, 50)
    assert.equal(s.getState().n, 10)
  })

  it('undo/redo with empty history are no-ops', () => {
    const s = make()
    s.undo()
    s.redo()
    assert.deepEqual(s.getState(), { n: 0, label: 'x' })
  })

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const s = make()
    let calls = 0
    const unsubscribe = s.subscribe(() => {
      calls++
    })
    s.mutate((d) => {
      d.n = 1
    })
    unsubscribe()
    s.mutate((d) => {
      d.n = 2
    })
    assert.equal(calls, 1)
  })
})

describe('editorStore', () => {
  beforeEach(() => loadFilterIntoEditor(FILTER))

  it('loadFilterIntoEditor replaces the filter and clears history', () => {
    editorStore.addRule()
    assert.equal(editorStore.canUndo(), true)
    loadFilterIntoEditor(FILTER)
    assert.deepEqual(ruleNames(), ['A', 'B'])
    assert.equal(editorStore.canUndo(), false)
    assert.equal(editorStore.canRedo(), false)
  })

  it('loadFilterIntoEditor stores a copy, not the caller’s object', () => {
    const source = structuredClone(FILTER)
    loadFilterIntoEditor(source)
    source.rules[0]!.name = 'mutated outside'
    assert.deepEqual(ruleNames(), ['A', 'B'])
  })

  it('rule edits are undoable and redoable', () => {
    editorStore.moveRule(0, 1)
    assert.deepEqual(ruleNames(), ['B', 'A'])
    editorStore.duplicateRule(0)
    assert.deepEqual(ruleNames(), ['B', 'B (copy)', 'A'])
    editorStore.undo()
    assert.deepEqual(ruleNames(), ['B', 'A'])
    editorStore.undo()
    assert.deepEqual(ruleNames(), ['A', 'B'])
    editorStore.redo()
    assert.deepEqual(ruleNames(), ['B', 'A'])
  })

  it('updateCondition patches only the targeted condition', () => {
    editorStore.addCondition(0)
    editorStore.addCondition(0)
    editorStore.updateCondition(0, 1, { minPower: 800 })
    const conds = editorStore.getState().filter.rules[0]!.conditions
    assert.equal(conds.length, 2)
    assert.equal(conds[0]!.minPower, undefined)
    assert.equal(conds[1]!.minPower, 800)
  })
})
