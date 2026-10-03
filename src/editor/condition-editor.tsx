import { type InputHTMLAttributes, useEffect, useRef } from 'react'

import { COND_TYPES, ITEM_PROPERTIES, QUALITY_FLAGS } from '../filter/constants.ts'
import type { FilterCondition } from '../filter/schemas.ts'
import { cx } from '../ui/cx.ts'
import shared from '../ui/styles.module.css'
import styles from './condition-editor.module.css'
import { editorStore } from './editor-store.ts'
import { useEditor } from './editor-state.tsx'
import { MultiPicker } from './multi-picker.tsx'

type CommitInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> & {
  value: string | number
  onCommit: (value: string) => void
}

/**
 * An input that reports the native `change` event (commit: blur, Enter, spinner,
 * color picker closed), not React's per-keystroke onChange. The Remix editor
 * listened to `change` on number and color inputs, so each commit is one undo
 * step; this keeps that. The DOM value follows `value` (e.g. after undo).
 */
export function CommitInput({ value, onCommit, ...rest }: CommitInputProps) {
  const ref = useRef<HTMLInputElement>(null)
  const onCommitRef = useRef(onCommit)
  useEffect(() => {
    onCommitRef.current = onCommit
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = () => onCommitRef.current(el.value)
    el.addEventListener('change', handler)
    return () => el.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (el && el.value !== String(value)) el.value = String(value)
  }, [value])

  return <input ref={ref} defaultValue={value} {...rest} />
}

/** Ported 1:1 from the Remix ConditionEditor. */
export function ConditionEditor({ ruleIndex, condIndex }: { ruleIndex: number; condIndex: number }) {
  const c = useEditor((s) => s.filter.rules[ruleIndex]?.conditions[condIndex])
  if (!c) return null

  function patch(p: Partial<FilterCondition>) {
    editorStore.updateCondition(ruleIndex, condIndex, p)
  }

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <select
          value={String(c.filterType)}
          aria-label="Condition type"
          className={cx(shared.select, styles.typeSelect)}
          onChange={(e) => {
            const ft = Number(e.currentTarget.value)
            patch({
              filterType: ft,
              qualityFlags: ft === 1 ? 16 : undefined,
              minPower: undefined,
              maxPower: undefined,
              itemProperties: ft === 2 ? 4 : undefined,
              minGaCount: ft === 4 ? 1 : undefined,
              subtypeIds: [],
              affixIds: [],
              itemIds: [],
              talismanSetIds: [],
              optionalAffixIds: [],
              minFromList: ft === 6 ? 1 : undefined,
              // Real Codex Upgrade and Greater Affix checks carry field 6 = 1
              // (for the GA check: "at least").
              field6: ft === 3 || ft === 4 ? 1 : undefined,
            })
          }}
        >
          {Object.entries(COND_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.icon} {v.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Remove condition"
          className={shared.iconBtn}
          onClick={() => editorStore.removeCondition(ruleIndex, condIndex)}
        >
          ×
        </button>
      </div>

      {c.filterType === 0 && (
        <div className={styles.powerRow}>
          <label className={styles.field}>
            Min Power
            <CommitInput
              type="number"
              value={c.minPower ?? ''}
              className={styles.powerInput}
              onCommit={(v) => patch({ minPower: v ? Number(v) : undefined })}
            />
          </label>
          <label className={styles.field}>
            Max Power
            <CommitInput
              type="number"
              value={c.maxPower ?? ''}
              className={styles.powerInput}
              onCommit={(v) => patch({ maxPower: v ? Number(v) : undefined })}
            />
          </label>
        </div>
      )}

      {c.filterType === 1 && (
        <div className={styles.flags}>
          {QUALITY_FLAGS.map(([flag, name, color]) => {
            const checked = ((c.qualityFlags ?? 0) & flag) !== 0
            return (
              <label key={flag} className={styles.flag}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const cur = c.qualityFlags ?? 0
                    patch({ qualityFlags: checked ? cur & ~flag : cur | flag })
                  }}
                />
                <span style={{ color, fontSize: '12px', fontFamily: 'var(--font-cinzel)' }}>{name}</span>
              </label>
            )
          })}
        </div>
      )}

      {c.filterType === 2 && (
        <div className={styles.flags}>
          {ITEM_PROPERTIES.map(([bit, name, color]) => {
            const checked = ((c.itemProperties ?? 0) & bit) !== 0
            return (
              <label key={bit} className={styles.flag}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const cur = c.itemProperties ?? 0
                    patch({ itemProperties: checked ? cur & ~bit : cur | bit })
                  }}
                />
                <span style={{ color, fontSize: '12px', fontFamily: 'var(--font-cinzel)' }}>{name}</span>
              </label>
            )
          })}
        </div>
      )}

      {c.filterType === 3 && (
        <p style={{ fontSize: '12px', color: 'var(--d4-text3)', fontStyle: 'italic', margin: 0 }}>
          Matches items with a Codex of Power upgrade available.
        </p>
      )}

      {c.filterType === 4 && (
        <label className={styles.field}>
          Must have
          <select
            value={c.field6 === 1 ? 'atLeast' : 'fewerThan'}
            aria-label="At least or fewer than"
            className={shared.select}
            onChange={(e) => patch({ field6: e.currentTarget.value === 'atLeast' ? 1 : 0 })}
          >
            <option value="atLeast">at least</option>
            <option value="fewerThan">fewer than</option>
          </select>
          <CommitInput
            type="number"
            value={c.minGaCount ?? 1}
            min={1}
            max={3}
            className={styles.gaInput}
            onCommit={(v) => patch({ minGaCount: Number(v) })}
          />
          Greater Affixes
        </label>
      )}

      {c.filterType === 5 && (
        <MultiPicker
          ruleIndex={ruleIndex}
          condIndex={condIndex}
          field="subtypeIds"
          kind="itemType"
          placeholder="Add item type…"
        />
      )}

      {c.filterType === 6 && (
        <>
          <MultiPicker ruleIndex={ruleIndex} condIndex={condIndex} field="affixIds" kind="affix" placeholder="Add affix…" />
          <label className={styles.field}>
            Must have at least
            <CommitInput
              type="number"
              value={c.minFromList ?? 1}
              min={1}
              className={styles.gaInput}
              onCommit={(v) => patch({ minFromList: Number(v) })}
            />
            of these
          </label>
        </>
      )}

      {c.filterType === 7 && (
        <>
          <MultiPicker
            ruleIndex={ruleIndex}
            condIndex={condIndex}
            field="optionalAffixIds"
            kind="affix"
            placeholder="Add optional affix…"
          />
          <label className={styles.field}>
            Must have at least
            <CommitInput
              type="number"
              // Optional: left empty, the condition sets no minimum (field 4 absent).
              value={c.minFromList ?? ''}
              min={1}
              placeholder="—"
              className={styles.gaInput}
              onCommit={(v) => patch({ minFromList: v === '' ? undefined : Number(v) })}
            />
            of these
          </label>
        </>
      )}

      {c.filterType === 8 && (
        <>
          <label className={styles.field}>
            <input type="checkbox" checked={c.itemIds.length === 0} onChange={() => patch({ itemIds: [] })} />
            <span style={{ color: '#e822a8', fontFamily: 'var(--font-cinzel)' }}>Is Ancestral</span>
          </label>
          <MultiPicker
            ruleIndex={ruleIndex}
            condIndex={condIndex}
            field="itemIds"
            kind="item"
            placeholder="Add item…"
            pillColor="#ef972f"
          />
        </>
      )}

      {c.filterType === 9 && (
        <MultiPicker
          ruleIndex={ruleIndex}
          condIndex={condIndex}
          field="talismanSetIds"
          kind="talismanSet"
          placeholder="Add Talisman set… (leave empty to match any)"
          pillColor="#50d839"
        />
      )}
    </div>
  )
}
