// @vitest-environment jsdom
import * as assert from 'node:assert/strict'

import { act, render } from '@testing-library/react'
import { describe, it } from 'vitest'

import { createTemporalStore } from '../src/editor/history.ts'
import { useStore } from '../src/editor/use-store.ts'

describe('useStore', () => {
  it('renders the selected value and re-renders on store changes', () => {
    const store = createTemporalStore({ count: 0 }, (s) => ({ count: s.count }))
    function Count() {
      return <output>{useStore(store, (s) => s.count)}</output>
    }
    const view = render(<Count />)
    assert.equal(view.container.textContent, '0')
    act(() => store.mutate((s) => { s.count = 3 }))
    assert.equal(view.container.textContent, '3')
    act(() => store.undo())
    assert.equal(view.container.textContent, '0')
  })

  it('works with derived booleans such as canUndo()', () => {
    const store = createTemporalStore({ count: 0 }, (s) => ({ count: s.count }))
    function UndoState() {
      return <output>{String(useStore(store, () => store.canUndo()))}</output>
    }
    const view = render(<UndoState />)
    assert.equal(view.container.textContent, 'false')
    act(() => store.mutate((s) => { s.count = 1 }))
    assert.equal(view.container.textContent, 'true')
  })

  it('unsubscribes on unmount', () => {
    const store = createTemporalStore({ count: 0 }, (s) => ({ count: s.count }))
    let listeners = 0
    const counted = {
      getState: store.getState,
      subscribe: (l: () => void) => {
        listeners++
        const off = store.subscribe(l)
        return () => { listeners--; off() }
      },
    }
    function Count() {
      return <output>{useStore(counted, (s) => s.count)}</output>
    }
    const view = render(<Count />)
    assert.equal(listeners, 1)
    view.unmount()
    assert.equal(listeners, 0)
  })
})
