import * as path from 'node:path'

import { renderWith } from 'remix/middleware/render'
import { createHtmlResponse } from 'remix/response/html'
import type { RemixNode } from 'remix/component'
import { renderToStream } from 'remix/component/server'

import { assetServer } from '../assets.ts'

export function render() {
  return renderWith(
    ({ request }) =>
      function render(node: RemixNode, init?: ResponseInit) {
        let stream = renderToStream(node, {
          signal: request.signal,
          async resolveClientEntry(entryId, component) {
            if (!entryId.startsWith('file://')) {
              throw new Error(
                `Expected \`import.meta.url\` for clientEntry ID, received '${entryId}'`,
              )
            }

            const { href, importMap, preloads } = await assetServer.getScriptEntry(entryId)
            return {
              href,
              importMap,
              preloads,
              exportName: entryId.split('#')[1] || component.name || titleCaseFileName(entryId),
            }
          },
        })

        return createHtmlResponse(stream, init)
      },
  )
}

function titleCaseFileName(fileUrl: string): string {
  let url = new URL(fileUrl)
  let fileName = path.basename(url.pathname, path.extname(url.pathname))
  return fileName
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join('')
}
