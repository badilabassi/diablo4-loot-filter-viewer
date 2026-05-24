import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

import { loadFilterIntoEditor } from '../../state/editor-store.ts'
import { filterStore } from '../../state/filter-store.ts'
import { tocStore } from '../../state/toc-store.ts'
import {
  containerStyle,
  headerGlow,
  navTabActive,
  navTabLink,
  navTabs,
  titleHero,
  titleSub,
} from '../../ui/document.tsx'
import { RuleCard } from '../../ui/rule-card.tsx'
import { StatusBar } from '../../ui/status-bar.tsx'
import {
  btnPrimary,
  btnSecondary,
  cardSection,
  errorBanner,
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
    return () => {
      if (typeof document !== 'undefined') {
        const root = document.getElementById('home-app-root')
        if (root && root.dataset.clientInit !== '1') {
          root.dataset.clientInit = '1'
          registerHomeInput(() => {}, () => {
            void handle.update()
          })
          if (!homeStoresSubscribed) {
            homeStoresSubscribed = true
            void tocStore.ensureLoaded()
            filterStore.subscribe(() => {
              syncHomeTextareaFromStore()
              void handle.update()
            })
            tocStore.subscribe(() => {
              void handle.update()
            })
          }
          requestAnimationFrame(() => syncHomeTextareaFromStore())
        }
      }

      const { filter, error } = filterStore.getState()
      const editHref = handle.props.editHref

      return (
        <div id="home-app-root">
          <header mix={headerGlow}>
            <div mix={css({ position: 'relative' })}>
              <div
                aria-hidden="true"
                style={{
                  fontSize: '36px',
                  marginBottom: '12px',
                  filter: 'drop-shadow(0 0 16px rgba(196, 120, 32, 0.65))',
                }}
              >
                ⚔
              </div>
              <h1 mix={titleHero}>Diablo IV</h1>
              <p mix={titleSub}>Filter Viewer & Editor</p>
              <div mix={[navTabs, ornateFrame, ornateFrameStrong]}>
                <span mix={navTabActive}>View</span>
                <a
                  href={editHref}
                  mix={[
                    navTabLink,
                    on('click', () => {
                      const filter = filterStore.getState().filter
                      if (filter) loadFilterIntoEditor(filter)
                    }),
                  ]}
                >
                  Edit
                </a>
              </div>
            </div>
          </header>

          <div mix={[containerStyle, css({ paddingBottom: '80px' })]}>
            <div
              mix={[
                ornateFrame,
                ornateFrameStrong,
                css({
                  marginTop: '32px',
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'var(--d4-bg2)',
                  border: '1px solid rgba(196, 120, 32, 0.25)',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.35)',
                }),
              ]}
            >
              <label mix={[metaLabel, css({ marginBottom: '8px' })]} htmlFor="filter-input">
                Filter share code
              </label>
              <div mix={css({ display: 'flex', gap: '8px' })}>
                <textarea
                  id="filter-input"
                  rows={3}
                  spellCheck={false}
                  placeholder="Paste base64 filter code here…"
                  mix={[inputStyle, css({ flex: 1, height: '72px', minWidth: 0 })]}
                />
                <div mix={css({ display: 'flex', flexDirection: 'column', gap: '6px' })}>
                  <button type="button" data-home-action="parse" mix={btnPrimary}>
                    Parse
                  </button>
                  <button type="button" data-home-action="example" mix={btnSecondary}>
                    Example
                  </button>
                  <div mix={css({ display: 'flex', gap: '4px' })}>
                    <button
                      type="button"
                      data-home-action="undo"
                      mix={btnSecondary}
                      disabled={!filterStore.canUndo()}
                    >
                      ↩
                    </button>
                    <button
                      type="button"
                      data-home-action="redo"
                      mix={btnSecondary}
                      disabled={!filterStore.canRedo()}
                    >
                      ↪
                    </button>
                  </div>
                </div>
              </div>
              {error && <p mix={errorBanner}>{error}</p>}
            </div>

            <StatusBar />

            {filter ? (
              <div mix={css({ marginTop: '4px' })}>
                <div mix={[cardSection, ornateFrame, ornateFrameStrong]}>
                  <span
                    mix={css({
                      fontFamily: 'var(--font-cinzel)',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--d4-gold3)',
                    })}
                  >
                    {filter.name}
                  </span>
                  <span
                    mix={css({
                      fontFamily: 'var(--font-cinzel)',
                      fontSize: '12px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      color: '#4caf50',
                      background: 'rgba(76,175,80,0.12)',
                      border: '1px solid rgba(76,175,80,0.25)',
                    })}
                  >
                    ● Active
                  </span>
                  <span
                    mix={css({
                      marginLeft: 'auto',
                      fontFamily: 'var(--font-cinzel)',
                      fontSize: '12px',
                      color: 'var(--d4-text3)',
                    })}
                  >
                    {filter.rules.filter((r) => r.type !== 3).length} rules
                  </span>
                  <a
                    href={editHref}
                    mix={[
                      btnSecondary,
                      css({ textDecoration: 'none' }),
                      on('click', () => {
                        const filter = filterStore.getState().filter
                        if (filter) loadFilterIntoEditor(filter)
                      }),
                    ]}
                  >
                    Edit →
                  </a>
                </div>
                {filter.rules.map((rule, i) => (
                  <RuleCard ruleJson={JSON.stringify(rule)} delay={i * 25} key={i} />
                ))}
              </div>
            ) : (
              <div
                mix={[
                  ornateFrame,
                  css({
                    textAlign: 'center',
                    padding: '96px 24px',
                    color: 'var(--d4-text3)',
                    borderRadius: '8px',
                    marginTop: '16px',
                  }),
                ]}
              >
                <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.2 }}>🜏</div>
                <p
                  mix={css({
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '12px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                  })}
                >
                  Paste a filter code above or click Example
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }
  },
)
