import { animateMini as animate, type DOMKeyframesDefinition } from 'motion'
import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

import { loadFilterIntoEditor } from '../../state/editor-store.ts'
import { filterStore } from '../../state/filter-store.ts'
import { tocStore } from '../../state/toc-store.ts'
import {
  headerGlow,
  navTabActive,
  navTabLink,
  navTabs,
  titleHero,
  titleSub,
} from '../../ui/document.tsx'
import { IconChevronLeft, IconChevronRight } from '../../ui/icons.tsx'
import { RuleCard } from '../../ui/rule-card.tsx'
import { StatusBar } from '../../ui/status-bar.tsx'
import {
  btnPrimary,
  btnSecondary,
  errorBanner,
  iconBtn,
  inputStyle,
  metaLabel,
  ornateFrame,
  ornateFrameStrong,
} from '../../ui/styles.ts'
import { registerHomeInput, syncHomeTextareaFromStore } from './bind-dom.ts'

interface HomeAppProps extends SerializableProps {
  editHref: string
}

let homeStoresSubscribed = false

export const HomeApp = clientEntry(
  import.meta.url,
  function HomeApp(handle: Handle<HomeAppProps>) {
    // 'css-default' = let media queries decide (desktop: open, mobile: closed) — no JS needed
    // 'open'        = explicitly opened by user (overrides CSS hide on mobile)
    // 'closed'      = explicitly closed by user (overrides CSS show on desktop)
    let sidebarState: 'css-default' | 'open' | 'closed' = 'css-default'
    let initialized = false

    const collapseKf: DOMKeyframesDefinition = { opacity: 0, x: -20 }
    const expandKf: DOMKeyframesDefinition = { opacity: [0, 1], x: [-20, 0] }

    async function collapseSidebar() {
      const el = document.querySelector('#home-sidebar')
      if (el) await animate(el, collapseKf, { duration: 0.18, ease: 'easeIn' }).finished
      sidebarState = 'closed'
      void handle.update()
    }

    function expandSidebar() {
      sidebarState = 'open'
      void handle.update()
      requestAnimationFrame(() => {
        const el = document.querySelector('#home-sidebar')
        if (el) animate(el, expandKf, { duration: 0.28, ease: [0.22, 1, 0.36, 1] })
      })
    }

    return () => {
      if (!initialized && typeof document !== 'undefined') {
        initialized = true
        registerHomeInput(() => {}, () => { void handle.update() })
        if (!homeStoresSubscribed) {
          homeStoresSubscribed = true
          void tocStore.ensureLoaded()
          filterStore.subscribe(() => {
            syncHomeTextareaFromStore()
            void handle.update()
          })
          tocStore.subscribe(() => { void handle.update() })
        }
        requestAnimationFrame(() => syncHomeTextareaFromStore())
      }

      const { filter, error } = filterStore.getState()
      const editHref = handle.props.editHref
      const sidebarOpen = sidebarState === 'open'
      const sidebarClosed = sidebarState === 'closed'

      return (
        <div
          id="home-app-root"
          mix={css({
            display: 'flex',
            flexDirection: 'column',
            '@media (min-width: 701px)': { height: '100vh', overflow: 'hidden' },
          })}
        >
          {/* Mobile top bar — hidden on desktop */}
          <div
            mix={css({
              display: 'none',
              '@media (max-width: 700px)': {
                display: 'flex',
                alignItems: 'center',
                height: '52px',
                padding: '0 16px',
                gap: '12px',
                background: 'var(--d4-bg2)',
                borderBottom: '1px solid rgba(196,120,32,0.2)',
                position: 'sticky',
                top: 0,
                zIndex: 20,
                flexShrink: 0,
              },
            })}
          >
            <button
              type="button"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sidebarOpen}
              aria-controls="home-sidebar"
              mix={[
                iconBtn,
                css({ minWidth: '40px', minHeight: '40px' }),
                on('click', () => {
                  if (sidebarState === 'open') void collapseSidebar()
                  else expandSidebar()
                }),
              ]}
            >{sidebarOpen ? <IconChevronLeft /> : <IconChevronRight />}</button>
            <span mix={css({ fontFamily: 'var(--font-cinzel)', fontSize: '13px', fontWeight: 700, color: 'var(--d4-gold3)' })}>
              Diablo IV · Filter Viewer
            </span>
            <a
              href={editHref}
              mix={[navTabLink, css({ marginLeft: 'auto', textDecoration: 'none' }), on('click', () => {
                const f = filterStore.getState().filter
                if (f) loadFilterIntoEditor(f)
              })]}
            >Edit</a>
          </div>

          {/* Content area */}
          <div
            mix={css({
              flex: 1,
              position: 'relative',
              minHeight: 0,
              '@media (min-width: 701px)': {
                display: 'grid',
                gridTemplateColumns: '340px 1fr',
                overflow: 'hidden',
                height: '100%',
              },
            })}
          >
            {/* Mobile backdrop — only when sidebar is explicitly open */}
            {sidebarOpen && (
              <div
                mix={[
                  css({
                    display: 'none',
                    '@media (max-width: 700px)': {
                      display: 'block',
                      position: 'fixed',
                      inset: 0,
                      top: '52px',
                      background: 'rgba(0,0,0,0.55)',
                      zIndex: 49,
                    },
                  }),
                  on('click', () => { void collapseSidebar() }),
                ]}
              />
            )}

            {/* Sidebar — always in DOM.
                CSS default: display flex on desktop, display none on mobile.
                Inline style overrides only when user explicitly toggles. */}
            <aside
              id="home-sidebar"
              aria-hidden={sidebarClosed}
              style={
                sidebarClosed
                  ? { display: 'none' }
                  : sidebarOpen
                  ? { display: 'flex', flexDirection: 'column' }
                  : undefined
              }
              mix={[
                ornateFrame,
                css({
                  background: 'var(--d4-bg2)',
                  display: 'none',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  borderRight: '1px solid rgba(196,120,32,0.2)',
                  '@media (min-width: 701px)': {
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  },
                  '@media (max-width: 700px)': {
                    position: 'fixed',
                    top: '52px',
                    left: 0,
                    bottom: 0,
                    width: 'min(85vw, 340px)',
                    zIndex: 50,
                  },
                }),
              ]}
            >
              {/* Branding */}
              <div mix={[headerGlow, css({ padding: '28px 20px 24px', flexShrink: 0, position: 'relative' })]}>
                <button
                  type="button"
                  aria-label="Collapse sidebar"
                  mix={[
                    iconBtn,
                    css({
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      zIndex: 1,
                    }),
                    on('click', () => { void collapseSidebar() }),
                  ]}
                ><IconChevronLeft /></button>
<div aria-hidden="true" style={{ fontSize: '28px', marginBottom: '8px', filter: 'drop-shadow(0 0 14px rgba(196, 120, 32, 0.65))' }}>⚔</div>
                <h1 mix={[titleHero, css({ fontSize: '22px' })]}>Diablo IV</h1>
                <p mix={[titleSub, css({ fontSize: '11px', marginBottom: '16px' })]}>Filter Viewer & Editor</p>
                <nav aria-label="Primary" mix={[navTabs, ornateFrame, ornateFrameStrong]}>
                  <span mix={navTabActive} aria-current="page">View</span>
                  <a href={editHref} mix={[navTabLink, on('click', () => {
                    const f = filterStore.getState().filter
                    if (f) loadFilterIntoEditor(f)
                  })]}>Edit</a>
                </nav>
              </div>

              {/* Controls */}
              <div mix={css({ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 })}>
                <label mix={metaLabel} htmlFor="filter-input">Filter Code</label>
                <textarea
                  id="filter-input"
                  rows={8}
                  spellCheck={false}
                  placeholder="Paste base64 filter code here…"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'filter-input-error' : undefined}
                  mix={[inputStyle, css({ resize: 'vertical', minHeight: '120px' })]}
                />
                {error && (
                  <p id="filter-input-error" role="alert" mix={errorBanner}>{error}</p>
                )}
                <div mix={css({ display: 'flex', flexDirection: 'column', gap: '6px' })}>
                  <button type="button" data-home-action="parse" mix={btnPrimary}>Parse</button>
                  <button type="button" data-home-action="example" mix={btnSecondary}>Load Example</button>
                </div>
                <div mix={css({ display: 'flex', gap: '4px' })} role="group" aria-label="History">
                  <button
                    type="button"
                    data-home-action="undo"
                    mix={[iconBtn, btnSecondary, css({ flex: 1 })]}
                    disabled={!filterStore.canUndo()}
                    aria-label="Undo"
                  >↩ Undo</button>
                  <button
                    type="button"
                    data-home-action="redo"
                    mix={[iconBtn, btnSecondary, css({ flex: 1 })]}
                    disabled={!filterStore.canRedo()}
                    aria-label="Redo"
                  >↪ Redo</button>
                </div>
                <div mix={css({ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--d4-border)' })}>
                  <StatusBar />
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main
              id="main-content"
              style={sidebarClosed ? { gridColumn: '1 / -1' } : undefined}
              mix={css({
                overflowY: 'auto',
                padding: '24px',
                '@media (max-width: 700px)': { padding: '16px' },
              })}
            >
              {/* Desktop: open sidebar button when user has collapsed it */}
              {sidebarClosed && (
                <button
                  type="button"
                  aria-label="Open sidebar"
                  mix={[
                    iconBtn,
                    btnSecondary,
                    css({
                      marginBottom: '16px',
                      '@media (max-width: 700px)': { display: 'none' },
                    }),
                    on('click', () => { expandSidebar() }),
                  ]}
                ><IconChevronRight /></button>
              )}

              {filter ? (
                <>
                  <div mix={css({ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: 'linear-gradient(90deg, rgba(196, 120, 32, 0.14) 0%, rgba(196, 120, 32, 0.04) 55%, transparent 100%)', border: '1px solid rgba(196, 120, 32, 0.32)' })}>
                    <span mix={css({ fontFamily: 'var(--font-cinzel)', fontSize: '18px', fontWeight: 700, color: 'var(--d4-gold3)' })}>
                      {filter.name}
                    </span>
                    <span mix={css({
                      fontFamily: 'var(--font-cinzel)', fontSize: '12px', letterSpacing: '0.12em',
                      textTransform: 'uppercase', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                      color: '#4caf50', background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.25)',
                    })}>
                      ● Active
                    </span>
                    <span mix={css({ marginLeft: 'auto', fontFamily: 'var(--font-cinzel)', fontSize: '12px', color: 'var(--d4-text3)' })}>
                      {filter.rules.filter((r) => r.type !== 3).length} rules
                    </span>
                    <a
                      href={editHref}
                      mix={[btnSecondary, css({ textDecoration: 'none' }), on('click', () => {
                        const f = filterStore.getState().filter
                        if (f) loadFilterIntoEditor(f)
                      })]}
                    >Edit →</a>
                  </div>
                  {filter.rules.map((rule, i) => (
                    <RuleCard ruleJson={JSON.stringify(rule)} delay={i * 25} key={i} />
                  ))}
                </>
              ) : (
                <div mix={css({ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px' })}>
                  <div aria-hidden="true" style={{ fontSize: '64px', opacity: 0.07 }}>🜏</div>
                </div>
              )}
            </main>
          </div>
        </div>
      )
    }
  },
)
