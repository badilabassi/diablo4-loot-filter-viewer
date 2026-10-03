import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { type SubmitEvent, useState } from 'react'
import { z } from 'zod'

import { EXAMPLE_FILTER } from '../filter/constants.ts'
import { cx } from '../ui/cx.ts'
import { IconChevronLeft, IconChevronRight } from '../ui/icons.tsx'
import { canonicalFor, seo } from '../ui/seo.ts'
import shared from '../ui/styles.module.css'
import { HistoryButtons } from '../viewer/history-buttons.tsx'
import { StatusBar } from '../viewer/status-bar.tsx'
import { useSidebar } from '../viewer/use-sidebar.ts'
import layout from '../viewer/viewer-layout.module.css'
import { getViewer, postViewer } from '../viewer/viewer.functions.ts'

const SIDEBAR_ID = 'home-sidebar'

/**
 * Longest encoded code sent in a URL. Vercel rejects URLs over 14 KB; this leaves
 * room for the origin and path. Longer codes go through postViewer (plan D3).
 */
const URL_CODE_LIMIT = 12_000

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

type ViewerData = Awaited<ReturnType<typeof getViewer>>

function Viewer() {
  const loaded = Route.useLoaderData()
  const { code } = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const sidebar = useSidebar(SIDEBAR_ID)

  // A result for a code too long for the URL (plan D3). Shown until the next
  // navigation replaces the loader data.
  const [oversize, setOversize] = useState<{ for: ViewerData; result: ViewerData } | null>(null)
  const { Content, error, status, age } = oversize?.for === loaded ? oversize.result : loaded
  const parsed = !error && !!code && oversize?.for !== loaded
  const editSearch = parsed ? { code } : {}

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    // Without JavaScript the form submits natively (GET /?code=…), same result.
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('code')?.toString().trim() || undefined
    if (value && encodeURIComponent(value).length > URL_CODE_LIMIT) {
      setOversize({ for: loaded, result: await postViewer({ data: { code: value } }) })
      return
    }
    setOversize(null)
    await navigate({ search: value ? { code: value } : {} })
  }

  return (
    <div id="home-app-root" className={layout.root}>
      {/* Mobile top bar — hidden on desktop. */}
      <div className={layout.topBar}>
        <button
          type="button"
          aria-label={sidebar.open ? 'Close menu' : 'Open menu'}
          aria-expanded={sidebar.open}
          aria-controls={SIDEBAR_ID}
          className={cx(shared.iconBtn, layout.menuButton)}
          onClick={sidebar.toggle}
        >
          {sidebar.open ? <IconChevronLeft /> : <IconChevronRight />}
        </button>
        <span className={layout.topBarTitle}>Diablo IV · Filter Viewer</span>
        <Link to="/edit" search={editSearch} className={cx(shared.navTabLink, layout.topBarEdit)}>
          Edit
        </Link>
      </div>

      <div className={layout.content}>
        {sidebar.open && <div className={layout.backdrop} onClick={() => void sidebar.collapse()} />}

        {/* Always in the DOM. CSS decides by default; inline styles override only
            after the user explicitly toggles. */}
        <aside
          id={SIDEBAR_ID}
          aria-hidden={sidebar.closed || undefined}
          style={sidebar.closed ? { display: 'none' } : sidebar.open ? { display: 'flex', flexDirection: 'column' } : undefined}
          className={cx(shared.ornateFrame, layout.sidebar)}
        >
          <div className={cx(shared.headerGlow, layout.branding)}>
            <button
              type="button"
              aria-label="Collapse sidebar"
              className={cx(shared.iconBtn, layout.collapseButton)}
              onClick={() => void sidebar.collapse()}
            >
              <IconChevronLeft />
            </button>
            <div aria-hidden="true" className={layout.sigil}>
              ⚔
            </div>
            <h1 className={cx(shared.titleHero, layout.title)}>Diablo IV</h1>
            <p className={cx(shared.titleSub, layout.subtitle)}>Filter Viewer & Editor</p>
            <nav aria-label="Primary" className={cx(shared.navTabs, shared.ornateFrame, shared.ornateFrameStrong)}>
              <span className={shared.navTabActive} aria-current="page">
                View
              </span>
              <Link to="/edit" search={editSearch} className={shared.navTabLink}>
                Edit
              </Link>
            </nav>
          </div>

          {/* A plain GET form, so parsing works without JavaScript; with it, the
              submit becomes an in-app navigation. Each parse is a URL, so the
              browser's history is the undo/redo history. */}
          <form method="get" action="/" className={layout.controls} onSubmit={onSubmit}>
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
              <Link to="/" search={{ code: EXAMPLE_FILTER }} className={cx(shared.btnSecondary, layout.exampleLink)}>
                Load Example
              </Link>
            </div>
            <HistoryButtons />
            <div className={layout.status}>
              <StatusBar status={status} age={age} />
            </div>
          </form>
        </aside>

        <main id="main-content" style={sidebar.closed ? { gridColumn: '1 / -1' } : undefined} className={layout.main}>
          {/* Desktop: reopen the sidebar after the user collapsed it. */}
          {sidebar.closed && (
            <button
              type="button"
              aria-label="Open sidebar"
              className={cx(shared.iconBtn, shared.btnSecondary, layout.openButton)}
              onClick={sidebar.expand}
            >
              <IconChevronRight />
            </button>
          )}
          {Content}
        </main>
      </div>
    </div>
  )
}
