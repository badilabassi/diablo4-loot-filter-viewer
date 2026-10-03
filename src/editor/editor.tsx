import { Link } from '@tanstack/react-router'
import { type DragEvent, type KeyboardEvent, useState } from 'react'

import { serializeFilter } from '../filter/proto.ts'
import { cx } from '../ui/cx.ts'
import { IconChevronLeft, IconChevronRight } from '../ui/icons.tsx'
import shared from '../ui/styles.module.css'
import { useSidebar } from '../ui/use-sidebar.ts'
import layout from './editor-layout.module.css'
import { useEditor } from './editor-state.tsx'
import { editorStore } from './editor-store.ts'
import { ExportDialog, ImportDialog } from './modals.tsx'
import { RuleEditor } from './rule-editor.tsx'

const SIDEBAR_ID = 'edit-sidebar'
const RULE_TYPES = ['Show', 'Hide Text', 'Recolor', 'Hide All'] as const

/** Selection after moving a rule from `from` to `to`, matching the Remix drop logic. */
export function selectionAfterMove(selected: number, from: number, to: number): number {
  if (selected === from) return to
  if (from < to && selected > from && selected <= to) return selected - 1
  if (from > to && selected >= to && selected < from) return selected + 1
  return selected
}

/** The filter editor, ported from the Remix EditApp. Renders inside <EditorStateProvider>. */
export function Editor({ loadError }: { loadError: string | null }) {
  const filter = useEditor((s) => s.filter)
  const canUndo = useEditor((s) => s.canUndo)
  const canRedo = useEditor((s) => s.canRedo)
  const sidebar = useSidebar(SIDEBAR_ID)

  const [selected, setSelected] = useState(0)
  const [dragSrc, setDragSrc] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [dialog, setDialog] = useState<null | 'import' | { exportCode: string }>(null)

  const rules = filter.rules
  const selectedIndex = rules.length > 0 && selected >= rules.length ? rules.length - 1 : selected

  // Edit → View carries the edited filter (plan C6Δ).
  const viewSearch = { code: serializeFilter(filter) }

  function move(from: number, to: number) {
    editorStore.moveRule(from, to)
    setSelected((s) => selectionAfterMove(s, from, to))
  }

  function onDrop(e: DragEvent, to: number) {
    e.preventDefault()
    if (dragSrc !== null && dragSrc !== to) move(dragSrc, to)
    setDragSrc(null)
    setDragOver(null)
  }

  function onRowKeyDown(e: KeyboardEvent, i: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelected(i)
    }
  }

  return (
    <div id="edit-app-root" className={layout.root}>
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
        <span className={layout.topBarTitle}>Diablo IV · Filter Editor</span>
        <Link to="/" search={viewSearch} className={cx(shared.navTabLink, layout.topBarView)}>
          View
        </Link>
      </div>

      <div className={layout.content}>
        {sidebar.open && <div className={layout.backdrop} onClick={() => void sidebar.collapse()} />}

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
            <p className={cx(shared.titleSub, layout.subtitle)}>Filter Editor</p>
            <nav aria-label="Primary" className={cx(shared.navTabs, shared.ornateFrame, shared.ornateFrameStrong)}>
              <Link to="/" search={viewSearch} className={shared.navTabLink}>
                View
              </Link>
              <span className={shared.navTabActive} aria-current="page">
                Edit
              </span>
            </nav>
          </div>

          <div className={layout.toolbar}>
            <input
              // Re-mount when the name changes from outside (undo, import) so the
              // field shows it; typing commits on blur, as in the Remix editor.
              key={filter.name}
              id="filter-name"
              type="text"
              aria-label="Filter name"
              defaultValue={filter.name}
              className={layout.nameInput}
              onBlur={(e) => {
                if (e.target.value !== filter.name) editorStore.setFilterName(e.target.value)
              }}
            />
            <div className={layout.historyRow}>
              <button
                type="button"
                className={cx(shared.iconBtn, shared.btnSecondary, layout.historyButton)}
                disabled={!canUndo}
                aria-label="Undo"
                onClick={editorStore.undo}
              >
                ↩
              </button>
              <button
                type="button"
                className={cx(shared.iconBtn, shared.btnSecondary, layout.historyButton)}
                disabled={!canRedo}
                aria-label="Redo"
                onClick={editorStore.redo}
              >
                ↪
              </button>
            </div>
          </div>

          <span id="drag-reorder-hint" className={layout.visuallyHidden}>
            Drag to reorder. Use the up and down arrow buttons for keyboard reordering.
          </span>

          <div className={layout.ruleList}>
            <div className={layout.ruleListHeader}>
              <span className={shared.sectionTitle}>Rules ({rules.length})</span>
              <button
                type="button"
                className={cx(shared.btnSecondary, layout.addButton)}
                onClick={() => {
                  const next = rules.length
                  editorStore.addRule()
                  setSelected(next)
                }}
              >
                + Add
              </button>
            </div>

            {rules.length === 0 && <p className={layout.noRules}>No rules yet</p>}

            {rules.map((rule, i) => (
              <div
                key={i}
                draggable="true"
                role="button"
                tabIndex={0}
                aria-pressed={i === selectedIndex}
                aria-label={`Select rule: ${rule.name || 'Unnamed'}`}
                aria-describedby="drag-reorder-hint"
                className={cx(shared.ornateFrame, layout.ruleRow)}
                data-selected={i === selectedIndex || undefined}
                data-disabled={!rule.enabled || undefined}
                data-dragging={dragSrc === i || undefined}
                data-drag-over={(dragOver === i && dragSrc !== i) || undefined}
                data-drag-active={dragSrc !== null || undefined}
                onClick={() => setSelected(i)}
                onKeyDown={(e) => onRowKeyDown(e, i)}
                onDragStart={(e) => {
                  setDragSrc(i)
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', String(i))
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  if (dragOver !== i) setDragOver(i)
                }}
                onDrop={(e) => onDrop(e, i)}
                onDragEnd={() => {
                  setDragSrc(null)
                  setDragOver(null)
                }}
              >
                <div className={layout.moveButtons}>
                  <button
                    type="button"
                    disabled={i === 0}
                    aria-label="Move rule up"
                    className={layout.moveButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (i > 0) move(i, i - 1)
                    }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={i === rules.length - 1}
                    aria-label="Move rule down"
                    className={layout.moveButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (i < rules.length - 1) move(i, i + 1)
                    }}
                  >
                    ▼
                  </button>
                </div>

                <span
                  aria-hidden="true"
                  className={layout.enabledDot}
                  style={{
                    background: rule.enabled ? '#4caf50' : 'transparent',
                    border: rule.enabled ? 'none' : '1.5px solid var(--d4-text3)',
                    boxShadow: rule.enabled ? '0 0 5px #4caf50aa' : 'none',
                  }}
                />
                <span className={layout.ruleName}>{rule.name}</span>
                <span className={layout.typeBadge}>{RULE_TYPES[rule.type] ?? 'Show'}</span>
                {!rule.enabled && <span className={layout.offBadge}>OFF</span>}
                <button
                  type="button"
                  aria-label="Remove rule"
                  className={layout.removeButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    editorStore.removeRule(i)
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className={layout.footer}>
            <button type="button" className={cx(shared.btnSecondary, layout.footerButton)} onClick={() => setDialog('import')}>
              ↓ Import
            </button>
            <button
              type="button"
              className={cx(shared.btnPrimary, layout.footerButton)}
              onClick={() => setDialog({ exportCode: serializeFilter(filter) })}
            >
              ↑ Export
            </button>
          </div>
        </aside>

        <main id="main-content" style={sidebar.closed ? { gridColumn: '1 / -1' } : undefined} className={layout.main}>
          <div className={layout.mainInner}>
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
            {loadError && (
              <p role="alert" className={cx(shared.errorBanner, layout.loadError)}>
                {loadError}
              </p>
            )}
            {rules.length > 0 ? (
              // onMove keeps the moved rule selected (fixes the audit's bug #2).
              <RuleEditor index={selectedIndex} total={rules.length} onMove={(from, to) => setSelected((s) => selectionAfterMove(s, from, to))} />
            ) : (
              <div className={cx(shared.ornateFrame, layout.emptyState)}>
                <p className={layout.emptyText}>
                  {sidebar.closed ? 'Open the sidebar to add rules' : 'Add a rule to get started'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {dialog === 'import' && <ImportDialog onClose={() => setDialog(null)} />}
      {dialog && dialog !== 'import' && <ExportDialog code={dialog.exportCode} onClose={() => setDialog(null)} />}
    </div>
  )
}
