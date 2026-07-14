import { animateMini as animate, type DOMKeyframesDefinition } from 'motion'
import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

import { parseFilterB64, serializeFilter } from '../../filter/proto.ts'
import { editorStore, loadFilterIntoEditor } from '../../state/editor-store.ts'
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
import { RuleEditor } from '../../ui/editor/rule-editor.tsx'
import {
  btnPrimary,
  btnSecondary,
  errorBanner,
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
  syncFilterNameFromStore,
} from './bind-dom.ts'

interface EditAppProps extends SerializableProps {
  homeHref: string
}

const modalOverlay = css({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
})

const modalDialog = css({
  background: 'var(--d4-bg2)',
  border: '1px solid rgba(196, 120, 32, 0.45)',
  borderRadius: '8px',
  padding: '24px',
  width: '480px',
  maxWidth: 'calc(100vw - 32px)',
  boxShadow: '0 8px 48px rgba(0, 0, 0, 0.75)',
  position: 'relative',
})

const modalTitle = css({
  fontFamily: 'var(--font-cinzel)',
  fontSize: '16px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--d4-gold3)',
  marginBottom: '16px',
})

let editStoresSubscribed = false

export const EditApp = clientEntry(
  import.meta.url,
  function EditApp(handle: Handle<EditAppProps>) {
    // 'css-default' = let media queries decide (desktop: open, mobile: closed) — no JS needed
    // 'open'        = explicitly opened by user (overrides CSS hide on mobile)
    // 'closed'      = explicitly closed by user (overrides CSS show on desktop)
    let sidebarState: 'css-default' | 'open' | 'closed' = 'css-default'
    let initialized = false

    const collapseKf: DOMKeyframesDefinition = { opacity: 0, x: -20 }
    const expandKf: DOMKeyframesDefinition = { opacity: [0, 1], x: [-20, 0] }

    async function collapseSidebar() {
      const el = document.querySelector('#edit-sidebar')
      if (el) await animate(el, collapseKf, { duration: 0.18, ease: 'easeIn' }).finished
      sidebarState = 'closed'
      void handle.update()
    }

    function expandSidebar() {
      sidebarState = 'open'
      void handle.update()
      requestAnimationFrame(() => {
        const el = document.querySelector('#edit-sidebar')
        if (el) animate(el, expandKf, { duration: 0.28, ease: [0.22, 1, 0.36, 1] })
      })
    }

    let selectedRuleIndex = 0
    let dragSrcIndex: number | null = null
    let dragOverIndex: number | null = null
    let showImportModal = false
    let importError = ''
    let importTriggerEl: HTMLElement | null = null
    let showExportModal = false
    let exportCode = ''
    let exportCopied = false
    let exportTriggerEl: HTMLElement | null = null

    return () => {
      if (!initialized && typeof document !== 'undefined') {
        initialized = true
        registerEditBindings(() => { void handle.update() })
        syncEditorFromViewer()
        if (!editStoresSubscribed) {
          editStoresSubscribed = true
          void tocStore.ensureLoaded()
          editorStore.subscribe(() => {
            syncFilterNameFromStore()
            void handle.update()
          })
          filterStore.subscribe(() => { void handle.update() })
          tocStore.subscribe(() => { void handle.update() })
        }
        requestAnimationFrame(() => syncFilterNameFromStore())
      }

      const { filter } = editorStore.getState()
      const viewerFilter = filterStore.getState().filter
      const homeHref = handle.props.homeHref
      const sidebarOpen = sidebarState === 'open'
      const sidebarClosed = sidebarState === 'closed'

      if (filter.rules.length > 0 && selectedRuleIndex >= filter.rules.length) {
        selectedRuleIndex = filter.rules.length - 1
      }

      function openExport() {
        exportTriggerEl = typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null
        exportCode = serializeFilter(filter)
        exportCopied = false
        showExportModal = true
        void handle.update()
        requestAnimationFrame(() => document.getElementById('export-modal-close')?.focus())
      }

      function closeExport() {
        showExportModal = false
        void handle.update()
        requestAnimationFrame(() => exportTriggerEl?.focus())
      }

      function openImport() {
        importTriggerEl = typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null
        importError = ''
        showImportModal = true
        void handle.update()
        requestAnimationFrame(() => document.getElementById('import-code-input')?.focus())
      }

      function closeImport() {
        showImportModal = false
        importError = ''
        void handle.update()
        requestAnimationFrame(() => importTriggerEl?.focus())
      }

      function doImport() {
        const ta = document.getElementById('import-code-input') as HTMLTextAreaElement | null
        const code = ta?.value.trim() ?? ''
        if (!code) { importError = 'Paste a filter code first.'; void handle.update(); return }
        try {
          loadFilterIntoEditor(parseFilterB64(code))
          closeImport()
        } catch {
          importError = 'Invalid filter code — could not parse.'
          void handle.update()
        }
      }

      return (
        <div
          id="edit-app-root"
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
              aria-controls="edit-sidebar"
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
              Diablo IV · Filter Editor
            </span>
            <a
              href={homeHref}
              mix={[navTabLink, css({ marginLeft: 'auto', textDecoration: 'none' })]}
            >View</a>
          </div>

          {/* Content area */}
          <div
            mix={css({
              flex: 1,
              position: 'relative',
              minHeight: 0,
              '@media (min-width: 701px)': {
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
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
              id="edit-sidebar"
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
                  borderRight: '1px solid rgba(196, 120, 32, 0.2)',
                  background: 'var(--d4-bg2)',
                  display: 'none',
                  flexDirection: 'column',
                  overflow: 'hidden',
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
                    width: 'min(85vw, 320px)',
                    zIndex: 50,
                    overflow: 'auto',
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
                  <div
                    aria-hidden="true"
                    style={{ fontSize: '28px', marginBottom: '8px', filter: 'drop-shadow(0 0 14px rgba(196, 120, 32, 0.65))' }}
                  >⚔</div>
                  <h1 mix={[titleHero, css({ fontSize: '22px' })]}>Diablo IV</h1>
                  <p mix={[titleSub, css({ fontSize: '11px', marginBottom: '16px' })]}>Filter Editor</p>
                  <nav aria-label="Primary" mix={[navTabs, ornateFrame, ornateFrameStrong]}>
                    <a href={homeHref} mix={navTabLink}>View</a>
                    <span mix={navTabActive} aria-current="page">Edit</span>
                  </nav>
                </div>

                {/* Toolbar */}
                <div
                  mix={css({
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(196, 120, 32, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flexShrink: 0,
                  })}
                >
                  <input
                    id="filter-name"
                    type="text"
                    aria-label="Filter name"
                    mix={css({
                      width: '100%',
                      background: 'var(--d4-bg)',
                      border: '1px solid rgba(196, 120, 32, 0.22)',
                      borderRadius: '6px',
                      color: 'var(--d4-gold3)',
                      fontFamily: 'var(--font-cinzel)',
                      fontSize: '13px',
                      outline: 'none',
                      padding: '7px 12px',
                      '&:focus': { borderColor: 'rgba(196, 120, 32, 0.5)' },
                    })}
                  />
                  <div mix={css({ display: 'flex', gap: '6px' })}>
                    <button
                      type="button"
                      data-edit-action="undo"
                      mix={[iconBtn, btnSecondary, css({ minWidth: '36px', minHeight: '36px' })]}
                      disabled={!editorStore.canUndo()}
                      aria-label="Undo"
                    >↩</button>
                    <button
                      type="button"
                      data-edit-action="redo"
                      mix={[iconBtn, btnSecondary, css({ minWidth: '36px', minHeight: '36px' })]}
                      disabled={!editorStore.canRedo()}
                      aria-label="Redo"
                    >↪</button>
                  </div>
                </div>

                {/* Visually hidden drag instructions */}
                <span id="drag-reorder-hint" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
                  Drag to reorder. Use the up and down arrow buttons for keyboard reordering.
                </span>

                {/* Rule list */}
                <div mix={css({ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', minHeight: 0 })}>
                  <div mix={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' })}>
                    <span mix={sectionTitle}>Rules ({filter.rules.length})</span>
                    <button
                      type="button"
                      mix={[btnSecondary, css({ fontSize: '11px', padding: '4px 10px' }), on('click', () => {
                        const nextIndex = filter.rules.length
                        editorStore.addRule()
                        selectedRuleIndex = nextIndex
                        void handle.update()
                      })]}
                    >+ Add</button>
                  </div>

                  {filter.rules.length === 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--d4-text3)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                      No rules yet
                    </p>
                  )}

                  {filter.rules.map((rule, i) => {
                    const isSelected = i === selectedRuleIndex
                    return (
                      <div
                        key={i}
                        draggable="true"
                        mix={[
                          ornateFrame,
                          css({
                            borderRadius: '6px',
                            border: dragOverIndex === i && dragSrcIndex !== i
                              ? '1px solid rgba(196, 120, 32, 0.85)'
                              : isSelected
                                ? '1px solid rgba(196, 120, 32, 0.55)'
                                : '1px solid var(--d4-border)',
                            boxShadow: dragOverIndex === i && dragSrcIndex !== i
                              ? '0 0 0 1px rgba(196, 120, 32, 0.35), inset 0 0 10px rgba(196, 120, 32, 0.08)'
                              : 'none',
                            background: isSelected
                              ? 'linear-gradient(90deg, rgba(196, 120, 32, 0.12) 0%, rgba(196, 120, 32, 0.04) 100%)'
                              : 'transparent',
                            opacity: dragSrcIndex === i ? 0.35 : rule.enabled ? 1 : 0.5,
                            filter: rule.enabled ? undefined : 'grayscale(0.5)',
                            cursor: 'grab',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: dragSrcIndex !== null ? 'none' : 'all 150ms ease',
                            minHeight: '44px',
                            '&:hover': {
                              borderColor: 'rgba(196, 120, 32, 0.4)',
                              background: isSelected
                                ? 'linear-gradient(90deg, rgba(196, 120, 32, 0.15) 0%, rgba(196, 120, 32, 0.06) 100%)'
                                : 'rgba(196, 120, 32, 0.06)',
                            },
                          }),
                          on('click', () => {
                            selectedRuleIndex = i
                            void handle.update()
                          }),
                          on('dragstart', (e) => {
                            dragSrcIndex = i
                            const dt = (e as DragEvent).dataTransfer
                            if (dt) { dt.effectAllowed = 'move'; dt.setData('text/plain', String(i)) }
                            void handle.update()
                          }),
                          on('dragover', (e) => {
                            e.preventDefault()
                            const dt = (e as DragEvent).dataTransfer
                            if (dt) dt.dropEffect = 'move'
                            if (dragOverIndex !== i) { dragOverIndex = i; void handle.update() }
                          }),
                          on('drop', (e) => {
                            e.preventDefault()
                            if (dragSrcIndex !== null && dragSrcIndex !== i) {
                              const from = dragSrcIndex
                              const to = i
                              editorStore.moveRule(from, to)
                              if (selectedRuleIndex === from) {
                                selectedRuleIndex = to
                              } else if (from < to && selectedRuleIndex > from && selectedRuleIndex <= to) {
                                selectedRuleIndex -= 1
                              } else if (from > to && selectedRuleIndex >= to && selectedRuleIndex < from) {
                                selectedRuleIndex += 1
                              }
                            }
                            dragSrcIndex = null; dragOverIndex = null
                            void handle.update()
                          }),
                          on('dragend', () => {
                            dragSrcIndex = null; dragOverIndex = null
                            void handle.update()
                          }),
                          on('keydown', (e) => {
                            const ke = e as KeyboardEvent
                            if (ke.key === 'Enter' || ke.key === ' ') {
                              ke.preventDefault()
                              selectedRuleIndex = i
                              void handle.update()
                            }
                          }),
                        ]}
                        role="button"
                        aria-pressed={isSelected}
                        aria-label={`Select rule: ${rule.name || 'Unnamed'}`}
                        aria-describedby="drag-reorder-hint"
                        tabIndex={0}
                      >
                        <div mix={css({ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 })}>
                          <button
                            type="button"
                            disabled={i === 0}
                            aria-label="Move rule up"
                            mix={[css({
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '18px', height: '18px', border: 0, background: 'transparent',
                              cursor: 'pointer', color: 'var(--d4-text3)', fontSize: '9px',
                              borderRadius: '2px', padding: 0,
                              '&:disabled': { opacity: 0.25, cursor: 'not-allowed' },
                              '&:hover:not(:disabled)': { color: 'var(--d4-gold3)' },
                            }), on('click', (e) => {
                              e.stopPropagation()
                              if (i === 0) return
                              editorStore.moveRule(i, i - 1)
                              if (selectedRuleIndex === i) selectedRuleIndex = i - 1
                              else if (selectedRuleIndex === i - 1) selectedRuleIndex = i
                              void handle.update()
                            })]}
                          >▲</button>
                          <button
                            type="button"
                            disabled={i === filter.rules.length - 1}
                            aria-label="Move rule down"
                            mix={[css({
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '18px', height: '18px', border: 0, background: 'transparent',
                              cursor: 'pointer', color: 'var(--d4-text3)', fontSize: '9px',
                              borderRadius: '2px', padding: 0,
                              '&:disabled': { opacity: 0.25, cursor: 'not-allowed' },
                              '&:hover:not(:disabled)': { color: 'var(--d4-gold3)' },
                            }), on('click', (e) => {
                              e.stopPropagation()
                              if (i === filter.rules.length - 1) return
                              editorStore.moveRule(i, i + 1)
                              if (selectedRuleIndex === i) selectedRuleIndex = i + 1
                              else if (selectedRuleIndex === i + 1) selectedRuleIndex = i
                              void handle.update()
                            })]}
                          >▼</button>
                        </div>

                        <span
                          aria-hidden="true"
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            boxSizing: 'border-box',
                            background: rule.enabled ? '#4caf50' : 'transparent',
                            border: rule.enabled ? 'none' : '1.5px solid var(--d4-text3)',
                            boxShadow: rule.enabled ? '0 0 5px #4caf50aa' : 'none',
                          }}
                        />

                        <span
                          style={{
                            flex: 1,
                            fontFamily: 'var(--font-cinzel)',
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: isSelected ? 'var(--d4-gold3)' : 'var(--d4-text)',
                          }}
                        >
                          {rule.name}
                        </span>

                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--d4-text3)',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            flexShrink: 0,
                          }}
                        >
                          {(['Show', 'Hide Text', 'Recolor', 'Hide All'] as const)[rule.type] ?? 'Show'}
                        </span>

                        {!rule.enabled && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              color: 'var(--d4-text3)',
                              border: '1px solid var(--d4-border)',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              flexShrink: 0,
                            }}
                          >
                            OFF
                          </span>
                        )}

                        <button
                          type="button"
                          aria-label="Remove rule"
                          mix={[css({
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '20px', height: '20px', border: 0, background: 'transparent',
                            cursor: 'pointer', color: 'var(--d4-text3)', fontSize: '14px',
                            flexShrink: 0, borderRadius: '3px', padding: 0,
                            '&:hover': { color: '#f55' },
                          }), on('click', (e) => {
                            e.stopPropagation()
                            editorStore.removeRule(i)
                            void handle.update()
                          })]}
                        >×</button>
                      </div>
                    )
                  })}
                </div>

                {/* Footer: Import / Export */}
                <div
                  mix={css({
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(196, 120, 32, 0.12)',
                    display: 'flex',
                    gap: '8px',
                    flexShrink: 0,
                  })}
                >
                  <button
                    type="button"
                    mix={[btnSecondary, css({ flex: 1, fontSize: '11px' }), on('click', openImport)]}
                  >↓ Import</button>
                  <button
                    type="button"
                    mix={[btnPrimary, css({ flex: 1, fontSize: '11px' }), on('click', openExport)]}
                  >↑ Export</button>
                </div>
              </aside>

            {/* Main: selected rule config */}
            <main
              id="main-content"
              style={sidebarClosed ? { gridColumn: '1 / -1' } : undefined}
              mix={css({
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              })}
            >
              <div mix={css({ padding: '24px', flex: 1, '@media (max-width: 700px)': { padding: '16px' } })}>
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
                {filter.rules.length > 0 ? (
                  <RuleEditor index={selectedRuleIndex} total={filter.rules.length} />
                ) : (
                  <div mix={[ornateFrame, css({ textAlign: 'center', padding: '96px 24px', color: 'var(--d4-text3)', borderRadius: '8px' })]}>
                    <p mix={css({ fontFamily: 'var(--font-cinzel)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' })}>
                      {sidebarClosed ? 'Open the sidebar to add rules' : 'Add a rule to get started'}
                    </p>
                  </div>
                )}
              </div>
            </main>
          </div>

          {/* Import modal */}
          {showImportModal && (
            <div mix={[modalOverlay, on('click', closeImport)]}>
              <div
                id="import-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-modal-title"
                mix={[modalDialog, ornateFrame, ornateFrameStrong, on('click', (e) => e.stopPropagation()), on('keydown', (e) => {
                  const ke = e as KeyboardEvent
                  if (ke.key === 'Escape') { closeImport(); return }
                  if (ke.key !== 'Tab') return
                  const dialog = document.getElementById('import-modal')
                  if (!dialog) return
                  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),textarea:not([disabled])'))
                  if (!focusable.length) return
                  const first = focusable[0]!; const last = focusable[focusable.length - 1]!
                  if (ke.shiftKey && document.activeElement === first) { ke.preventDefault(); last.focus() }
                  else if (!ke.shiftKey && document.activeElement === last) { ke.preventDefault(); first.focus() }
                })]}
              >
                <h2 id="import-modal-title" mix={modalTitle}>Import Filter</h2>
                <label mix={[metaLabel, css({ marginBottom: '8px' })]} htmlFor="import-code-input">
                  Filter Code (base64)
                </label>
                <textarea
                  id="import-code-input"
                  rows={5}
                  spellCheck={false}
                  placeholder="Paste base64 filter code here…"
                  autofocus={true}
                  mix={[inputStyle, css({ marginBottom: importError ? '8px' : '16px' })]}
                />
                {importError && (
                  <p mix={[errorBanner, css({ marginBottom: '16px' })]}>{importError}</p>
                )}
                {viewerFilter && (
                  <p mix={css({ fontSize: '12px', color: 'var(--d4-text3)', marginBottom: '16px', fontFamily: 'var(--font-cinzel)' })}>
                    Or{' '}
                    <button
                      type="button"
                      mix={[css({
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        color: 'var(--d4-gold3)', fontFamily: 'var(--font-cinzel)', fontSize: '12px',
                        textDecoration: 'underline',
                        '&:hover': { color: 'var(--d4-gold2)' },
                      }), on('click', () => {
                        syncEditorFromViewer()
                        closeImport()
                      })]}
                    >import from the Viewer</button>
                  </p>
                )}
                <div mix={css({ display: 'flex', gap: '8px', justifyContent: 'flex-end' })}>
                  <button type="button" mix={[btnSecondary, on('click', closeImport)]}>Cancel</button>
                  <button type="button" mix={[btnPrimary, on('click', doImport)]}>Import</button>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  mix={[iconBtn, css({ position: 'absolute', top: '12px', right: '12px', minWidth: '32px', minHeight: '32px', fontSize: '18px' }), on('click', closeImport)]}
                >×</button>
              </div>
            </div>
          )}

          {/* Export modal */}
          {showExportModal && (
            <div mix={[modalOverlay, on('click', closeExport)]}>
              <div
                id="export-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="export-modal-title"
                mix={[modalDialog, ornateFrame, ornateFrameStrong, on('click', (e) => e.stopPropagation()), on('keydown', (e) => {
                  const ke = e as KeyboardEvent
                  if (ke.key === 'Escape') { closeExport(); return }
                  if (ke.key !== 'Tab') return
                  const dialog = document.getElementById('export-modal')
                  if (!dialog) return
                  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),textarea:not([disabled])'))
                  if (!focusable.length) return
                  const first = focusable[0]!; const last = focusable[focusable.length - 1]!
                  if (ke.shiftKey && document.activeElement === first) { ke.preventDefault(); last.focus() }
                  else if (!ke.shiftKey && document.activeElement === last) { ke.preventDefault(); first.focus() }
                })]}
              >
                <h2 id="export-modal-title" mix={modalTitle}>Export Filter</h2>
                <label mix={[metaLabel, css({ marginBottom: '8px' })]} htmlFor="export-code-output">
                  Filter Code (base64)
                </label>
                <textarea
                  id="export-code-output"
                  readOnly
                  rows={5}
                  value={exportCode}
                  mix={[inputStyle, css({ marginBottom: '16px', cursor: 'text' })]}
                />
                <div mix={css({ display: 'flex', gap: '8px', justifyContent: 'flex-end' })}>
                  <button type="button" mix={[btnSecondary, on('click', closeExport)]}>Close</button>
                  <button
                    type="button"
                    mix={[btnPrimary, on('click', () => {
                      void navigator.clipboard.writeText(exportCode).then(() => {
                        exportCopied = true
                        void handle.update()
                        setTimeout(() => { exportCopied = false; void handle.update() }, 2000)
                      })
                    })]}
                  >{exportCopied ? '✓ Copied!' : 'Copy to Clipboard'}</button>
                </div>
                <button
                  type="button"
                  id="export-modal-close"
                  aria-label="Close"
                  mix={[iconBtn, css({ position: 'absolute', top: '12px', right: '12px', minWidth: '32px', minHeight: '32px', fontSize: '18px' }), on('click', closeExport)]}
                >×</button>
              </div>
            </div>
          )}
        </div>
      )
    }
  },
)
