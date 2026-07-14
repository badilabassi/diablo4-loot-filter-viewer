import { parseTocData } from '../filter/toc-schemas.ts'
import type { TocAffix, TocData, TocItem, TocItemType, TocTalismanSet } from '../filter/toc-types.ts'
import { createStore } from './subscribe.ts'

export type { TocData }

interface TocIndexState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  data: TocData | null
  error: string
  affixById: Map<number, TocAffix>
  itemTypeById: Map<number, TocItemType>
  itemById: Map<number, TocItem>
  talismanSetById: Map<number, TocTalismanSet>
}

const store = createStore<TocIndexState>({
  status: 'idle',
  data: null,
  error: '',
  affixById: new Map(),
  itemTypeById: new Map(),
  itemById: new Map(),
  talismanSetById: new Map(),
})

let loadPromise: Promise<void> | null = null

function indexData(data: TocData) {
  const affixById = new Map<number, TocAffix>()
  const itemTypeById = new Map<number, TocItemType>()
  const itemById = new Map<number, TocItem>()
  const talismanSetById = new Map<number, TocTalismanSet>()
  for (const a of data.affixes) affixById.set(a.id, a)
  for (const it of data.itemTypes) itemTypeById.set(it.id, it)
  for (const it of data.items) itemById.set(it.id, it)
  for (const ts of data.talismanSets) talismanSetById.set(ts.id, ts)
  store.setState({
    status: 'ready',
    data,
    error: '',
    affixById,
    itemTypeById,
    itemById,
    talismanSetById,
  })
}

export const tocStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  getAffix: (id: number) => store.getState().affixById.get(id),
  getItemType: (id: number) => store.getState().itemTypeById.get(id),
  getItem: (id: number) => store.getState().itemById.get(id),
  getTalismanSet: (id: number) => store.getState().talismanSetById.get(id),
  ensureLoaded: () => {
    const { status } = store.getState()
    if (status === 'ready' || status === 'loading') return loadPromise
    store.setState({ ...store.getState(), status: 'loading' })
    loadPromise = fetch('/api/toc')
      .then(async (res) => {
        if (!res.ok) throw new Error(`TOC fetch failed: ${res.status}`)
        const json: unknown = await res.json()
        return parseTocData(json)
      })
      .then(indexData)
      .catch((e) => {
        store.setState({
          ...store.getState(),
          status: 'error',
          error: e instanceof Error ? e.message : String(e),
        })
      })
    return loadPromise
  },
}
