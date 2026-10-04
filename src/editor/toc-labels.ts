import type { TocEntry, TocKind } from '../data/toc-kinds.ts'
import { createStore } from './history.ts'

/** Picker labels by kind and id, e.g. labels.affix[123] = { id, label, sub }. */
export type TocLabels = Record<TocKind, Record<number, TocEntry>>

export const emptyLabels = (): TocLabels => ({ affix: {}, itemType: {}, item: {}, talismanSet: {} })

/**
 * Client-side cache of TOC labels the editor has seen. Replaces downloading the
 * whole TOC (plan D6): it's seeded from the /edit loader (labels for the filter
 * being edited) and grows with searchToc / resolveToc results.
 */
export const tocLabelStore = createStore<TocLabels>(emptyLabels())

/** Adds labels without dropping existing ones; notifies only when something is new. */
export function rememberLabels(kind: TocKind, entries: readonly TocEntry[]) {
  const current = tocLabelStore.getState()
  const missing = entries.filter((e) => !current[kind][e.id])
  if (missing.length === 0) return
  const merged = { ...current[kind] }
  for (const e of missing) merged[e.id] = e
  tocLabelStore.setState({ ...current, [kind]: merged })
}

export function rememberAllLabels(labels: TocLabels) {
  for (const kind of Object.keys(labels) as TocKind[])
    rememberLabels(kind, Object.values(labels[kind]))
}
