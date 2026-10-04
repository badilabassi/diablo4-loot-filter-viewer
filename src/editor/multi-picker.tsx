import { useEffect, useRef, useState } from 'react'

import type { TocEntry, TocKind } from '../data/toc-kinds.ts'
import { resolveToc, searchToc } from '../data/toc.functions.ts'
import type { FilterCondition } from '../filter/schemas.ts'
import { cx } from '../ui/cx.ts'
import shared from '../ui/styles.module.css'
import { editorStore } from './editor-store.ts'
import { useEditor, useTocLabel } from './editor-state.tsx'
import styles from './multi-picker.module.css'
import { rememberLabels, tocLabelStore } from './toc-labels.ts'

type PickerField = 'affixIds' | 'subtypeIds' | 'itemIds' | 'talismanSetIds' | 'optionalAffixIds'

interface MultiPickerProps {
  ruleIndex: number
  condIndex: number
  field: PickerField
  kind: TocKind
  placeholder: string
  pillColor?: string
}

const NONE: readonly number[] = []
const SEARCH_DEBOUNCE_MS = 150

const hexLabel = (id: number) => `0x${id.toString(16).toUpperCase()}`

/**
 * Ported from the Remix MultiPicker. The Remix version filtered the whole TOC on
 * the client; this one asks the server (searchToc / resolveToc) and caches the
 * labels it gets back in tocLabelStore.
 */
export function MultiPicker({
  ruleIndex,
  condIndex,
  field,
  kind,
  placeholder,
  pillColor,
}: MultiPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TocEntry[]>([])
  const sel = useEditor((s) => s.filter.rules[ruleIndex]?.conditions[condIndex]?.[field]) ?? NONE

  function setSelected(ids: number[]) {
    editorStore.updateCondition(ruleIndex, condIndex, { [field]: ids } as Partial<FilterCondition>)
  }

  // Labels for selected ids the client hasn't seen yet: ask the server once per id.
  const requested = useRef(new Set<string>())
  useEffect(() => {
    const known = tocLabelStore.getState()[kind]
    const ids = sel.filter((id) => !known[id] && !requested.current.has(`${kind}:${id}`))
    if (ids.length === 0) return
    for (const id of ids) requested.current.add(`${kind}:${id}`)
    resolveToc({ data: { kind, ids } }).then(
      (entries) => rememberLabels(kind, entries),
      () => {},
    )
  }, [kind, sel])

  // Search while open: immediately on open (empty query lists the first
  // entries), debounced while typing. Only the latest response is applied.
  const latestSearch = useRef(0)
  useEffect(() => {
    if (!open) return
    const ticket = ++latestSearch.current
    const run = () => {
      searchToc({ data: { kind, query, exclude: [...sel] } }).then(
        (entries) => {
          if (ticket !== latestSearch.current) return
          rememberLabels(kind, entries)
          setResults(entries)
        },
        () => {},
      )
    }
    if (!query) {
      run()
      return
    }
    const timer = setTimeout(run, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [open, query, kind, sel])

  function close() {
    latestSearch.current++
    setOpen(false)
    setResults([])
  }

  const filtered = results.filter((it) => !sel.includes(it.id))
  const listboxId = `picker-lb-${ruleIndex}-${condIndex}-${field}`
  const searchId = `picker-search-${ruleIndex}-${condIndex}-${field}`

  return (
    <div className={styles.root}>
      {sel.length > 0 && (
        <div className={styles.pills}>
          {sel.map((id) => (
            <Pill
              key={id}
              kind={kind}
              id={id}
              pillColor={pillColor}
              onRemove={() => setSelected(sel.filter((x) => x !== id))}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={placeholder}
        className={styles.trigger}
        onClick={() => {
          if (open) {
            close()
            return
          }
          setOpen(true)
          requestAnimationFrame(() => document.getElementById(searchId)?.focus())
        }}
      >
        <span>{placeholder}</span>
        <span aria-hidden="true">▼</span>
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          // Programmatically focusable, as the listbox role requires; focus normally
          // sits on the search field inside it.
          tabIndex={-1}
          aria-label={placeholder}
          className={styles.listbox}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close()
          }}
        >
          <input
            id={searchId}
            type="search"
            placeholder={placeholder}
            aria-label={`Search ${placeholder}`}
            value={query}
            className={styles.search}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={false}
              className={styles.option}
              onClick={() => {
                setSelected([...sel, item.id])
                close()
                setQuery('')
              }}
            >
              <span>{item.label}</span>
              {item.sub && <span style={{ color: 'var(--d4-text3)' }}>{item.sub}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Pill({
  kind,
  id,
  pillColor,
  onRemove,
}: {
  kind: TocKind
  id: number
  pillColor: string | undefined
  onRemove: () => void
}) {
  const label = useTocLabel(kind, id)?.label ?? hexLabel(id)
  return (
    <span
      className={styles.pill}
      style={
        pillColor
          ? { color: pillColor, borderColor: `${pillColor}55`, background: `${pillColor}10` }
          : { background: 'var(--d4-bg)', color: 'var(--d4-text2)' }
      }
    >
      {label}
      <button
        type="button"
        aria-label={`Remove ${label}`}
        className={cx(shared.iconBtn, styles.pillRemove)}
        onClick={onRemove}
      >
        ×
      </button>
    </span>
  )
}
