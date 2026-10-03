import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getTocIndex, resolveTocEntries } from '../data/toc-index.server.ts'
import { TOC_KINDS } from '../data/toc-kinds.ts'
import { parseFilterB64 } from '../filter/proto.ts'
import type { ParsedFilter } from '../filter/schemas.ts'
import { referencedIds } from '../viewer/names.ts'
import { type TocLabels, emptyLabels } from './toc-labels.ts'

/**
 * Initial editor state for /edit?code=… (plan C2Δ): the parsed filter plus the
 * picker labels for every id it references, so the server can render the editor
 * and the client never downloads the whole TOC (plan D6).
 */
export const getEditor = createServerFn({ method: 'GET' })
  .validator(z.object({ code: z.string().max(64 * 1024).optional() }))
  .handler(async ({ data }) => {
    const code = data.code?.trim() || undefined
    let filter: ParsedFilter | null = null
    let error: string | null = null
    if (code) {
      try {
        filter = parseFilterB64(code)
      } catch {
        // Same message the Remix editor's Import showed.
        error = 'Invalid filter code — could not parse.'
      }
    }

    const labels: TocLabels = emptyLabels()
    if (filter) {
      const index = await getTocIndex()
      const ids = referencedIds(filter)
      const byKind = { affix: ids.affixes, itemType: ids.itemTypes, item: ids.items, talismanSet: ids.talismanSets }
      for (const kind of TOC_KINDS) {
        for (const entry of resolveTocEntries(index, kind, [...byKind[kind]])) labels[kind][entry.id] = entry
      }
    }
    return { code: filter ? code : undefined, filter, error, labels }
  })
