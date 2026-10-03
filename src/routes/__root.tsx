import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestUrl } from '@tanstack/react-start/server'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import type { ReactNode } from 'react'

import '../styles/theme.css'
import { SiteFooter } from '../ui/site-footer.tsx'
import { SITE_NAME, THEME_COLOR } from '../ui/seo.ts'

/** The origin pages are served from, for canonical URLs (same host the request used). */
const getOrigin = createIsomorphicFn()
  .server(() => getRequestUrl().origin)
  .client(() => window.location.origin)

export const Route = createRootRoute({
  // The origin doesn't change for the lifetime of a page, so load it once.
  loader: () => ({ origin: getOrigin() }),
  staleTime: Infinity,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: THEME_COLOR },
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <noscript>
          <p>{SITE_NAME}'s viewer works without JavaScript. The filter editor requires it.</p>
        </noscript>
        {children}
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
        <Scripts />
      </body>
    </html>
  )
}
