import type { ParsedFilter } from '../filter/schemas.ts'
import type { TocAffix, TocData, TocItem, TocItemType, TocTalismanSet } from '../filter/toc-types.ts'
import { type FilterNames, referencedIds } from '../viewer/names.ts'
import { getCachedTocData } from './toc-cache.server.ts'

/** The four TOC lists the editor's pickers search. */
export type TocKind = 'affix' | 'itemType' | 'item' | 'talismanSet'
export const TOC_KINDS = ['affix', 'itemType', 'item', 'talismanSet'] as const satisfies readonly TocKind[]

/** What a picker shows for one entry. `sub` is the affix category. */
export interface TocEntry {
  id: number
  label: string
  sub?: string
}

/** Same cap as the editor's picker had when it searched client-side. */
export const SEARCH_LIMIT = 80

export interface TocIndex {
  data: TocData
  affixById: Map<number, TocAffix>
  itemTypeById: Map<number, TocItemType>
  itemById: Map<number, TocItem>
  talismanSetById: Map<number, TocTalismanSet>
  entries: Record<TocKind, TocEntry[]>
  entryById: Record<TocKind, Map<number, TocEntry>>
}

// Keyed by the TocData object, so the index is rebuilt exactly when
// getCachedTocData() swaps in refreshed data.
const indexes = new WeakMap<TocData, TocIndex>()

export function buildTocIndex(data: TocData): TocIndex {
  const existing = indexes.get(data)
  if (existing) return existing
  const index: TocIndex = {
    data,
    affixById: new Map(data.affixes.map((a) => [a.id, a])),
    itemTypeById: new Map(data.itemTypes.map((t) => [t.id, t])),
    itemById: new Map(data.items.map((i) => [i.id, i])),
    talismanSetById: new Map(data.talismanSets.map((s) => [s.id, s])),
    entries: {
      affix: data.affixes.map((a) => ({ id: a.id, label: a.name, sub: a.cat })),
      itemType: data.itemTypes.map((t) => ({ id: t.id, label: t.name })),
      item: data.items.map((i) => ({ id: i.id, label: i.name })),
      talismanSet: data.talismanSets.map((s) => ({ id: s.id, label: s.name })),
    },
    entryById: {} as TocIndex['entryById'],
  }
  for (const kind of TOC_KINDS) index.entryById[kind] = new Map(index.entries[kind].map((e) => [e.id, e]))
  indexes.set(data, index)
  return index
}

/** The index over the current cached TOC data. */
export async function getTocIndex(): Promise<TocIndex> {
  return buildTocIndex(await getCachedTocData())
}

/**
 * Case-insensitive substring search over one list, in index order, skipping ids
 * already selected and capped at SEARCH_LIMIT. An empty query lists the first
 * entries. Matches the editor picker's previous client-side behavior.
 */
export function searchTocEntries(
  index: TocIndex,
  kind: TocKind,
  query: string,
  exclude: readonly number[] = [],
): TocEntry[] {
  const skip = new Set(exclude)
  const q = query.toLowerCase()
  const out: TocEntry[] = []
  for (const entry of index.entries[kind]) {
    if (skip.has(entry.id)) continue
    if (q && !entry.label.toLowerCase().includes(q)) continue
    out.push(entry)
    if (out.length === SEARCH_LIMIT) break
  }
  return out
}

/** Entries for the given ids, in the given order. Unknown ids are omitted. */
export function resolveTocEntries(index: TocIndex, kind: TocKind, ids: readonly number[]): TocEntry[] {
  return ids.flatMap((id) => {
    const entry = index.entryById[kind].get(id)
    return entry ? [entry] : []
  })
}

/** The names a filter references, for rendering it on the server (see FilterNames). */
export function namesForFilter(index: TocIndex, filter: ParsedFilter): FilterNames {
  const ids = referencedIds(filter)
  const names: FilterNames = { affixes: {}, itemTypes: {}, items: {}, talismanSets: {} }
  for (const id of ids.affixes) {
    const a = index.affixById.get(id)
    if (a) names.affixes[id] = { name: a.name, cat: a.cat, raw: a.raw }
  }
  for (const id of ids.itemTypes) {
    const t = index.itemTypeById.get(id)
    if (t) names.itemTypes[id] = t.name
  }
  for (const id of ids.items) {
    const i = index.itemById.get(id)
    if (i) names.items[id] = i.name
  }
  for (const id of ids.talismanSets) {
    const s = index.talismanSetById.get(id)
    if (s) names.talismanSets[id] = s.name
  }
  return names
}
