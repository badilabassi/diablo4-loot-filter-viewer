// @vitest-environment jsdom
import * as assert from 'node:assert/strict'

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { ConditionEditor } from '../src/editor/condition-editor.tsx'
import { EditorStateProvider } from '../src/editor/editor-state.tsx'
import { editorStore, loadFilterIntoEditor } from '../src/editor/editor-store.ts'
import { MultiPicker } from '../src/editor/multi-picker.tsx'
import { RuleEditor } from '../src/editor/rule-editor.tsx'
import { emptyLabels, rememberLabels } from '../src/editor/toc-labels.ts'
import type { ParsedFilter } from '../src/filter/schemas.ts'

// Server functions can't run in vitest; stub them.
const searchToc = vi.fn(async () => [{ id: 42, label: 'Attack Speed', sub: 'offense' }])
const resolveToc = vi.fn(async () => [])
vi.mock('../src/data/toc.functions.ts', () => ({
  searchToc: (...args: unknown[]) => searchToc(...(args as [])),
  resolveToc: (...args: unknown[]) => resolveToc(...(args as [])),
}))

const cond = { filterType: 7, subtypeIds: [], affixIds: [7, 255], itemIds: [], talismanSetIds: [], optionalAffixIds: [] }
const FILTER: ParsedFilter = {
  name: 'Fixture',
  rules: [
    { name: 'A', type: 0, enabled: true, conditions: [{ ...cond }] },
    { name: 'B', type: 0, enabled: true, conditions: [] },
  ],
}

function wrap(node: ReactNode) {
  return render(<EditorStateProvider initial={{ filter: FILTER, labels: emptyLabels() }}>{node}</EditorStateProvider>)
}

beforeEach(() => {
  loadFilterIntoEditor(FILTER)
  searchToc.mockClear()
  resolveToc.mockClear()
})
afterEach(cleanup)

describe('RuleEditor', () => {
  it('moves the rule and reports the move so the parent keeps it selected (bug #2)', () => {
    const moves: Array<[number, number]> = []
    wrap(<RuleEditor index={0} total={2} onMove={(from, to) => moves.push([from, to])} />)
    fireEvent.click(screen.getByRole('button', { name: 'Move rule down' }))
    assert.deepEqual(moves, [[0, 1]])
    assert.deepEqual(editorStore.getState().filter.rules.map((r) => r.name), ['B', 'A'])
  })

  it('writes name and enabled edits to the store', () => {
    wrap(<RuleEditor index={1} total={2} onMove={() => {}} />)
    const name = screen.getByDisplayValue('B')
    fireEvent.change(name, { target: { value: 'Renamed' } })
    assert.equal(editorStore.getState().filter.rules[1]!.name, 'Renamed')
    fireEvent.click(screen.getByRole('checkbox'))
    assert.equal(editorStore.getState().filter.rules[1]!.enabled, false)
  })
})

describe('ConditionEditor', () => {
  it('resets the condition’s fields when its type changes, as the Remix editor did', () => {
    wrap(<ConditionEditor ruleIndex={0} condIndex={0} />)
    fireEvent.change(screen.getByLabelText('Condition type'), { target: { value: '1' } })
    const c = editorStore.getState().filter.rules[0]!.conditions[0]!
    assert.equal(c.filterType, 1)
    assert.equal(c.qualityFlags, 16)
    assert.deepEqual(c.affixIds, [])
  })
})

describe('MultiPicker', () => {
  const picker = () => <MultiPicker ruleIndex={0} condIndex={0} field="affixIds" kind="affix" placeholder="Add affix" />

  it('labels known ids and falls back to the hex id for unknown ones', () => {
    rememberLabels('affix', [{ id: 7, label: 'Maximum Life', sub: 'defense' }])
    wrap(picker())
    assert.ok(screen.getByText('Maximum Life'))
    assert.ok(screen.getByText('0xFF'))
  })

  it('asks the server only for the labels it is missing', async () => {
    rememberLabels('affix', [{ id: 7, label: 'Maximum Life' }])
    wrap(picker())
    await act(async () => {})
    assert.deepEqual(resolveToc.mock.calls.at(-1), [{ data: { kind: 'affix', ids: [255] } }])
  })

  it('searches on open excluding selected ids, and picking adds the id', async () => {
    wrap(picker())
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add affix' }))
    })
    assert.deepEqual(searchToc.mock.calls[0], [{ data: { kind: 'affix', query: '', exclude: [7, 255] } }])
    fireEvent.click(await screen.findByRole('option', { name: /Attack Speed/ }))
    assert.deepEqual(editorStore.getState().filter.rules[0]!.conditions[0]!.affixIds, [7, 255, 42])
  })
})

describe('ConditionEditor defaults (diablofilter.com decoder semantics)', () => {
  it('a new Greater Affix Check means "at least" (field 6 = 1)', () => {
    wrap(<ConditionEditor ruleIndex={0} condIndex={0} />)
    fireEvent.change(screen.getByLabelText('Condition type'), { target: { value: '4' } })
    const c = editorStore.getState().filter.rules[0]!.conditions[0]!
    assert.equal(c.field6, 1)
    assert.equal((screen.getByLabelText('At least or fewer than') as HTMLSelectElement).value, 'atLeast')
  })

  it('switching the direction to "fewer than" clears the flag', () => {
    wrap(<ConditionEditor ruleIndex={0} condIndex={0} />)
    fireEvent.change(screen.getByLabelText('Condition type'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('At least or fewer than'), { target: { value: 'fewerThan' } })
    assert.equal(editorStore.getState().filter.rules[0]!.conditions[0]!.field6, 0)
  })

  it('a new Item Properties condition defaults to Ancestral and toggles bits', () => {
    wrap(<ConditionEditor ruleIndex={0} condIndex={0} />)
    fireEvent.change(screen.getByLabelText('Condition type'), { target: { value: '2' } })
    assert.equal(editorStore.getState().filter.rules[0]!.conditions[0]!.itemProperties, 4)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mythic' }))
    assert.equal(editorStore.getState().filter.rules[0]!.conditions[0]!.itemProperties, 36)
  })
})
