import type { TocIndex } from '../data/toc-index.server.ts'
import { namesForFilter } from '../data/toc-index.server.ts'
import { parseFilterB64 } from '../filter/proto.ts'
import type { ParsedFilter } from '../filter/schemas.ts'
import type { FilterNames } from './names.ts'
import { type IndexStatus, seededAge } from './status-bar.tsx'

export const NO_NAMES: FilterNames = { affixes: {}, itemTypes: {}, items: {}, talismanSets: {} }

export function editHrefFor(code: string | undefined): string {
  return code ? `/edit?code=${encodeURIComponent(code)}` : '/edit'
}

export interface ViewerModel {
  filter: ParsedFilter | null
  /** Parse error for the alert banner, or null. */
  error: string | null
  names: FilterNames
  /** Opens this filter in the editor; plain /edit when nothing parsed (plan C6Δ). */
  editHref: string
  status: IndexStatus
  age: string
}

/**
 * Everything the viewer shows for a filter code, computed on the server. Kept
 * free of server-function and RSC APIs so it can be unit tested directly.
 */
export function buildViewerModel(
  rawCode: string | undefined,
  index: TocIndex,
  now: number,
): ViewerModel {
  const code = rawCode?.trim() || undefined
  let filter: ParsedFilter | null = null
  let error: string | null = null
  if (code) {
    try {
      filter = parseFilterB64(code)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }
  return {
    filter,
    error,
    names: filter ? namesForFilter(index, filter) : NO_NAMES,
    editHref: editHrefFor(filter ? code : undefined),
    status: {
      affixes: index.data.affixes.length,
      items: index.data.items.length,
      ts: index.data.ts,
    },
    age: seededAge(index.data.ts, now),
  }
}
