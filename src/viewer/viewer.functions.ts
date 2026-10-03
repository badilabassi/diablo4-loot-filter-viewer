import { createServerFn } from '@tanstack/react-start'
import { renderServerComponent } from '@tanstack/react-start/rsc'
import { createElement } from 'react'
import { z } from 'zod'

import { getTocIndex } from '../data/toc-index.server.ts'
import { RuleList } from './rule-list.tsx'
import { buildViewerModel } from './viewer-model.server.ts'

/** Generous bound on work per request; real codes are a few KB (plan D3). */
export const MAX_CODE_LENGTH = 64 * 1024

const input = z.object({ code: z.string().max(MAX_CODE_LENGTH).optional() })

async function renderViewer(code: string | undefined) {
  const { filter, names, editHref, error, status, age } = buildViewerModel(code, await getTocIndex(), Date.now())
  const Content = await renderServerComponent(createElement(RuleList, { filter, names, editHref }))
  return { Content, error, editHref, status, age }
}

/**
 * The viewer, rendered on the server (plan D2): parses the filter code, resolves
 * every name from the TOC index, and renders the rule list as a React Server
 * Component, so none of that code or data is sent to the browser.
 */
export const getViewer = createServerFn({ method: 'GET' })
  .validator(input)
  .handler(({ data }) => renderViewer(data.code))

/**
 * The same, for codes too long for a URL (plan D3: Vercel rejects URLs over
 * 14 KB). The result isn't shareable or CDN-cacheable, which is acceptable for
 * rare oversized filters.
 */
export const postViewer = createServerFn({ method: 'POST' })
  .validator(input)
  .handler(({ data }) => renderViewer(data.code))
