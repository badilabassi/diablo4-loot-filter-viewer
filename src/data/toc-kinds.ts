/** Shared by server (toc-index.server.ts) and client (editor pickers) code. */

/** The four TOC lists the editor's pickers search. */
export type TocKind = 'affix' | 'itemType' | 'item' | 'talismanSet'
export const TOC_KINDS = ['affix', 'itemType', 'item', 'talismanSet'] as const satisfies readonly TocKind[]

/** What a picker shows for one entry. `sub` is the affix category. */
export interface TocEntry {
  id: number
  label: string
  sub?: string
}
