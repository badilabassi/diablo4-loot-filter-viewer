import { EXAMPLE_FILTER } from '../filter/constants.ts'
import { parseFilterB64 } from '../filter/proto.ts'
import type { ParsedFilter } from '../filter/schemas.ts'
import { createTemporalStore } from './subscribe.ts'

interface FilterState {
  input: string
  filter: ParsedFilter | null
  error: string
}

const store = createTemporalStore<FilterState>(
  { input: '', filter: null, error: '' },
  (s) => ({ input: s.input, filter: s.filter, error: s.error }),
)

export const filterStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  setInput: (input: string) => {
    const s = store.getState()
    if (s.input !== input) store.setState({ ...s, input })
  },
  parseFilter: (raw?: string) => {
    const src = raw ?? store.getState().input
    try {
      store.mutate((s) => {
        s.filter = parseFilterB64(src)
        s.error = ''
      })
    } catch (e) {
      store.mutate((s) => {
        s.error = e instanceof Error ? e.message : String(e)
        s.filter = null
      })
    }
  },
  loadExample: () => {
    store.mutate((s) => {
      s.input = EXAMPLE_FILTER
    })
    filterStore.parseFilter(EXAMPLE_FILTER)
  },
  undo: store.undo,
  redo: store.redo,
  canUndo: store.canUndo,
  canRedo: store.canRedo,
}
