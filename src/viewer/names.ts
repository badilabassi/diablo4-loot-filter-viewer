import type { ParsedFilter } from '../filter/schemas.ts'
import type { TocAffix } from '../filter/toc-types.ts'

/**
 * The TOC names one filter references, resolved on the server. Viewer components
 * take this instead of the whole 518 KB index, so it stays small and
 * serializable: rendering works the same as RSC or as plain SSR + hydration
 * (plan D2). Ids missing from the index are simply absent.
 */
export interface FilterNames {
  affixes: Record<number, Pick<TocAffix, 'name' | 'cat' | 'raw'>>
  itemTypes: Record<number, string>
  items: Record<number, string>
  talismanSets: Record<number, string>
}

/** The distinct ids of each kind a filter references. */
export function referencedIds(filter: ParsedFilter) {
  const affixes = new Set<number>()
  const itemTypes = new Set<number>()
  const items = new Set<number>()
  const talismanSets = new Set<number>()
  for (const rule of filter.rules) {
    for (const c of rule.conditions) {
      for (const id of c.affixIds) affixes.add(id)
      for (const id of c.optionalAffixIds) affixes.add(id)
      for (const id of c.subtypeIds) itemTypes.add(id)
      for (const id of c.itemIds) items.add(id)
      for (const id of c.talismanSetIds) talismanSets.add(id)
    }
  }
  return { affixes, itemTypes, items, talismanSets }
}
