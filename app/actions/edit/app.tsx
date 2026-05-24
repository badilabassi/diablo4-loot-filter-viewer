import { clientEntry, css, type Handle, type SerializableProps } from 'remix/ui'

import { editorStore } from '../../state/editor-store.ts'
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
import { RuleEditor } from '../../ui/editor/rule-editor.tsx'
import {
  btnPrimary,
  btnSecondary,
  cardSection,
  iconBtn,
  inputStyle,
  metaLabel,
  ornateFrame,
  ornateFrameStrong,
  sectionTitle,
} from '../../ui/styles.ts'
import {
  registerEditBindings,
  syncEditorFromViewer,
  syncExportTextareaFromStore,
  syncFilterNameFromStore,
} from './bind-dom.ts'

interface EditAppProps extends SerializableProps {
  homeHref: string
}

let editStoresSubscribed = false

export const EditApp = clientEntry(
  import.meta.url,
  function EditApp(handle: Handle<EditAppProps>) {
    return () => {
      if (typeof document !== 'undefined') {
        const root = document.getElementById('edit-app-root')
        if (root && root.dataset.clientInit !== '1') {
          root.dataset.clientInit = '1'
          registerEditBindings(() => {
            void handle.update()
          })
          syncEditorFromViewer()
          if (!editStoresSubscribed) {
            editStoresSubscribed = true
            void tocStore.ensureLoaded()
            editorStore.subscribe(() => {
              syncFilterNameFromStore()
              syncExportTextareaFromStore()
              void handle.update()
            })
            filterStore.subscribe(() => {
              void handle.update()
            })
            tocStore.subscribe(() => {
              void handle.update()
            })
          }
          requestAnimationFrame(() => {
            syncFilterNameFromStore()
            syncExportTextareaFromStore()
            void handle.update()
          })
        }
      }

      const { filter, exportedB64 } = editorStore.getState()
      const viewerFilter = filterStore.getState().filter
      const homeHref = handle.props.homeHref

      return (
        <div id="edit-app-root">
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
              <p mix={titleSub}>Filter Editor</p>
              <nav aria-label="Primary" mix={[navTabs, ornateFrame, ornateFrameStrong]}>
                <a href={homeHref} mix={navTabLink}>
                  View
                </a>
                <span mix={navTabActive} aria-current="page">
                  Edit
                </span>
              </nav>
            </div>
          </header>

          <main
            id="main-content"
            mix={[
              containerStyle,
              css({ padding: '24px 24px 64px', display: 'flex', flexDirection: 'column', gap: '16px' }),
            ]}
          >
            <div
              mix={css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' })}
              role="toolbar"
              aria-label="Editor actions"
            >
              {viewerFilter && (
                <button type="button" data-edit-action="import" mix={btnSecondary}>
                  ↓ Import from Viewer
                </button>
              )}
              <button
                type="button"
                data-edit-action="undo"
                mix={[iconBtn, btnSecondary]}
                disabled={!editorStore.canUndo()}
                aria-label="Undo"
              >
                ↩
              </button>
              <button
                type="button"
                data-edit-action="redo"
                mix={[iconBtn, btnSecondary]}
                disabled={!editorStore.canRedo()}
                aria-label="Redo"
              >
                ↪
              </button>
              <span mix={css({ flex: 1 })} />
              <button type="button" data-edit-action="copy" mix={btnPrimary}>
                Copy Filter Code
              </button>
            </div>

            {exportedB64 && (
              <div
                mix={[
                  cardSection,
                  ornateFrame,
                  ornateFrameStrong,
                  css({ position: 'relative', flexDirection: 'column', alignItems: 'stretch' }),
                ]}
              >
                <label mix={[metaLabel, css({ margin: '0 0 6px' })]} htmlFor="export-b64">
                  Filter Code (base64)
                </label>
                <textarea
                  id="export-b64"
                  readOnly
                  rows={3}
                  mix={[
                    inputStyle,
                    css({
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      minHeight: '72px',
                    }),
                  ]}
                />
                <button
                  type="button"
                  data-edit-action="clear-export"
                  aria-label="Dismiss exported filter code"
                  mix={[iconBtn, css({ position: 'absolute', top: '0', right: '0', fontSize: '18px' })]}
                >
                  ×
                </button>
              </div>
            )}

            <div
              mix={[
                ornateFrame,
                css({
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'var(--d4-bg2)',
                  border: '1px solid rgba(196, 120, 32, 0.22)',
                }),
              ]}
            >
              <label mix={[metaLabel, css({ marginBottom: '4px' })]} htmlFor="filter-name">
                Filter Name
              </label>
              <input
                id="filter-name"
                type="text"
                mix={[
                  inputStyle,
                  css({
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '14px',
                    padding: '8px 12px',
                    color: 'var(--d4-gold3)',
                  }),
                ]}
              />
            </div>

            <div>
              <div mix={css({ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' })}>
                <h2 mix={sectionTitle}>Rules ({filter.rules.length})</h2>
                <span
                  mix={css({
                    flex: 1,
                    height: '1px',
                    background: 'linear-gradient(90deg, rgba(196, 120, 32, 0.35), transparent)',
                  })}
                />
                <button type="button" data-edit-action="add-rule" mix={btnPrimary}>
                  + Add Rule
                </button>
              </div>

              {filter.rules.length === 0 && (
                <div mix={css({ textAlign: 'center', padding: '40px 0', color: 'var(--d4-text3)' })}>
                  <p
                    mix={css({
                      fontFamily: 'var(--font-cinzel)',
                      fontSize: '12px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                    })}
                  >
                    No rules yet
                  </p>
                </div>
              )}

              <div mix={css({ display: 'flex', flexDirection: 'column', gap: '12px' })}>
                {filter.rules.map((_, i) => (
                  <RuleEditor index={i} total={filter.rules.length} key={i} />
                ))}
              </div>
            </div>

            {filter.rules.length > 0 && (
              <div mix={css({ textAlign: 'center', paddingBottom: '48px' })}>
                <button type="button" data-edit-action="copy" mix={btnPrimary}>
                  Copy Filter Code
                </button>
                <p style={{ fontSize: '12px', color: 'var(--d4-text3)', marginTop: '8px' }}>
                  Paste the code into the game&apos;s filter UI
                </p>
              </div>
            )}
          </main>
        </div>
      )
    }
  },
)
