import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { TOC_KINDS } from './toc-kinds.ts'
import { getTocIndex, resolveTocEntries, searchTocEntries } from './toc-index.server.ts'

const kind = z.enum(TOC_KINDS)
// Bounds keep a crafted request from making the server do unbounded work. A
// condition never holds anywhere near this many ids.
const ids = z.array(z.number().int().nonnegative()).max(500)

/** Editor picker search: replaces downloading the whole TOC to the browser. */
export const searchToc = createServerFn({ method: 'GET' })
  .validator(z.object({ kind, query: z.string().max(100), exclude: ids.default([]) }))
  .handler(async ({ data }) =>
    searchTocEntries(await getTocIndex(), data.kind, data.query, data.exclude),
  )

/** Labels for ids already in a filter, e.g. selected picker pills. */
export const resolveToc = createServerFn({ method: 'GET' })
  .validator(z.object({ kind, ids }))
  .handler(async ({ data }) => resolveTocEntries(await getTocIndex(), data.kind, data.ids))
