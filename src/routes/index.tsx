import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { EXAMPLE_FILTER } from '../filter/constants.ts'
import { cx } from '../ui/cx.ts'
import { canonicalFor, seo } from '../ui/seo.ts'
import shared from '../ui/styles.module.css'
import { StatusBar } from '../viewer/status-bar.tsx'
import layout from '../viewer/viewer-layout.module.css'
import { getViewer } from '../viewer/viewer.functions.ts'

const EXAMPLE_HREF = `/?code=${encodeURIComponent(EXAMPLE_FILTER)}`

export const Route = createFileRoute('/')({
  // The viewer's state is the URL (approved behavior change #1).
  validateSearch: z.object({ code: z.string().optional() }),
  loaderDeps: ({ search }) => ({ code: search.code }),
  loader: ({ deps }) => getViewer({ data: { code: deps.code } }),
  head: ({ matches, match }) =>
    seo({
      title: 'D4 Loot Filter Viewer — Diablo IV',
      description:
        'Browse and inspect Diablo IV loot filter rules in your browser. Paste filter code to explore conditions, affixes, and item types.',
      canonical: canonicalFor(matches, match.pathname),
    }),
  component: Viewer,
})

function Viewer() {
  const { Content, error, editHref, status, age } = Route.useLoaderData()
  const { code } = Route.useSearch()

  return (
    <div id="home-app-root" className={layout.root}>
      <div className={layout.content}>
        <aside id="home-sidebar" className={cx(shared.ornateFrame, layout.sidebar)}>
          <div className={cx(shared.headerGlow, layout.branding)}>
            <div aria-hidden="true" className={layout.sigil}>
              ⚔
            </div>
            <h1 className={cx(shared.titleHero, layout.title)}>Diablo IV</h1>
            <p className={cx(shared.titleSub, layout.subtitle)}>Filter Viewer & Editor</p>
            <nav aria-label="Primary" className={cx(shared.navTabs, shared.ornateFrame, shared.ornateFrameStrong)}>
              <span className={shared.navTabActive} aria-current="page">
                View
              </span>
              <a href={editHref} className={shared.navTabLink}>
                Edit
              </a>
            </nav>
          </div>

          {/* A plain GET form: parsing works without JavaScript, and each parse is
              a URL, so the browser's history is the undo/redo history. */}
          <form method="get" action="/" className={layout.controls}>
            <label className={shared.metaLabel} htmlFor="filter-input">
              Filter Code
            </label>
            <textarea
              // Re-mount on navigation so the field shows the current URL's code.
              key={code ?? ''}
              id="filter-input"
              name="code"
              rows={8}
              spellCheck={false}
              placeholder="Paste base64 filter code here…"
              defaultValue={code ?? ''}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'filter-input-error' : undefined}
              className={cx(shared.input, layout.textarea)}
            />
            {error && (
              <p id="filter-input-error" role="alert" className={shared.errorBanner}>
                {error}
              </p>
            )}
            <div className={layout.actions}>
              <button type="submit" className={shared.btnPrimary}>
                Parse
              </button>
              <a href={EXAMPLE_HREF} className={cx(shared.btnSecondary, layout.exampleLink)}>
                Load Example
              </a>
            </div>
            <div className={layout.status}>
              <StatusBar status={status} age={age} />
            </div>
          </form>
        </aside>

        <main id="main-content" className={layout.main}>
          {Content}
        </main>
      </div>
    </div>
  )
}
