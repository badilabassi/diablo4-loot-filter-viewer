import { createController } from 'remix/router'

import { getClientEntryHref } from '../assets/client-entry-href.ts'
import { assetServer } from '../assets.ts'
import { getCachedTocData } from '../data/toc-cache.ts'
import { routes } from '../routes.ts'
import { EditPage } from './edit/page.tsx'
import { HomePage } from './home/page.tsx'

function canonicalUrl(request: Request): string {
  const url = new URL(request.url)
  url.search = ''
  url.hash = ''
  return url.href
}

export default createController(routes, {
  actions: {
    async assets(context) {
      return (
        (await assetServer.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
      )
    },
    async tocApi() {
      const data = await getCachedTocData()
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400',
        },
      })
    },
    async home(context) {
      const clientEntryHref = await getClientEntryHref()
      const canonical = canonicalUrl(context.request)
      return context.render(
        <HomePage
          clientEntryHref={clientEntryHref}
          editHref={routes.edit.href()}
          canonical={canonical}
        />,
      )
    },
    async edit(context) {
      const clientEntryHref = await getClientEntryHref()
      const canonical = canonicalUrl(context.request)
      return context.render(
        <EditPage
          clientEntryHref={clientEntryHref}
          homeHref={routes.home.href()}
          canonical={canonical}
        />,
      )
    },
  },
})
