import type { CSSProperties } from 'react'

import { cx } from '../ui/cx.ts'
import { glowVars } from '../ui/quality-glow.ts'
import { dominantGlowTag, inferRuleTags } from '../ui/rule-tags.ts'
import shared from '../ui/styles.module.css'
import { CommitInput, ConditionEditor } from './condition-editor.tsx'
import { editorStore } from './editor-store.ts'
import { useEditor } from './editor-state.tsx'
import styles from './rule-editor.module.css'

const RULE_TYPES: [number, string][] = [
  [0, 'Show'],
  [1, 'Hide Text Label'],
  [2, 'Recolor'],
  [3, 'Hide All'],
]

const PRESET_COLORS = [
  '#bd9b4e',
  '#e822a8',
  '#4db8ff',
  '#ffffff',
  '#a06030',
  '#00c060',
  '#c8c020',
  '#ff4444',
  '#0000ff',
  '#c0c0c0',
]

/**
 * Ported 1:1 from the Remix RuleEditor. `onMove(from, to)` runs after ▲/▼ move
 * the rule so the parent can keep the moved rule selected (bug #2).
 */
export function RuleEditor({
  index: i,
  total,
  onMove,
}: {
  index: number
  total: number
  onMove: (from: number, to: number) => void
}) {
  const r = useEditor((s) => s.filter.rules[i])
  if (!r) return null
  const glowTag = dominantGlowTag(inferRuleTags(r))

  function move(to: number) {
    editorStore.moveRule(i, to)
    onMove(i, to)
  }

  return (
    <div
      className={cx(shared.card, shared.ornateFrame, shared.cardEntrance, styles.card)}
      data-glow={glowTag ?? undefined}
      style={
        {
          animationDelay: `${Math.min(i * 30, 500)}ms`,
          '--entrance-opacity': r.enabled ? 1 : 0.5,
          filter: r.enabled ? undefined : 'grayscale(0.6)',
          ...glowVars(glowTag),
        } as CSSProperties
      }
    >
      <div className={styles.header}>
        <div className={styles.reorder} role="group" aria-label={`Reorder rule ${i + 1}`}>
          <button
            type="button"
            disabled={i === 0}
            aria-label="Move rule up"
            className={cx(shared.iconBtn, styles.moveBtn)}
            onClick={() => move(i - 1)}
          >
            ▲
          </button>
          <button
            type="button"
            disabled={i === total - 1}
            aria-label="Move rule down"
            className={cx(shared.iconBtn, styles.moveBtn)}
            onClick={() => move(i + 1)}
          >
            ▼
          </button>
        </div>
        <span
          aria-hidden="true"
          style={{ fontSize: '12px', color: 'var(--d4-text3)', width: '20px', textAlign: 'center' }}
        >
          {i + 1}
        </span>
        <input
          type="text"
          value={r.name}
          maxLength={64}
          aria-label="Rule name"
          className={styles.nameInput}
          onChange={(e) => editorStore.updateRule(i, { name: e.currentTarget.value })}
        />
        <select
          value={String(r.type)}
          aria-label="Rule type"
          className={shared.select}
          onChange={(e) => editorStore.updateRule(i, { type: Number(e.currentTarget.value) })}
        >
          {RULE_TYPES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {r.type === 2 && (
          <label className={styles.colorLabel}>
            <span
              aria-hidden="true"
              className={styles.colorSwatch}
              style={{ background: r.color?.hex ?? '#ffffff' }}
            />
            <CommitInput
              type="color"
              value={r.color?.hex ?? '#ffffff'}
              aria-label="Rule highlight color"
              className={styles.colorInput}
              onCommit={(hex) => editorStore.updateRule(i, { color: { hex } })}
            />
          </label>
        )}
        <label
          className={styles.enabledToggle}
          style={{
            border: `1px solid ${r.enabled ? 'rgba(76, 175, 80, 0.4)' : 'var(--d4-border)'}`,
            background: r.enabled ? 'rgba(76, 175, 80, 0.12)' : 'rgba(255, 255, 255, 0.03)',
            color: r.enabled ? '#4caf50' : 'var(--d4-text3)',
          }}
        >
          <input
            type="checkbox"
            checked={r.enabled}
            aria-label={
              r.enabled ? 'Rule enabled — click to disable' : 'Rule disabled — click to enable'
            }
            onChange={(e) => editorStore.updateRule(i, { enabled: e.currentTarget.checked })}
          />
          {r.enabled ? 'On' : 'Off'}
        </label>
        <button
          type="button"
          aria-label="Duplicate rule"
          className={shared.iconBtn}
          onClick={() => editorStore.duplicateRule(i)}
        >
          ⧉
        </button>
        <button
          type="button"
          aria-label="Remove rule"
          className={shared.iconBtn}
          onClick={() => editorStore.removeRule(i)}
        >
          ×
        </button>
      </div>

      {r.type === 2 && (
        <div className={styles.presets}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Set highlight color ${c.toUpperCase()}`}
              className={styles.presetBtn}
              onClick={() => editorStore.updateRule(i, { color: { hex: c } })}
            >
              <span
                aria-hidden="true"
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: c,
                  display: 'block',
                }}
              />
            </button>
          ))}
          <button
            type="button"
            aria-label="Clear highlight color"
            className={cx(shared.btnSecondary, styles.clearBtn)}
            onClick={() => editorStore.updateRule(i, { color: undefined })}
          >
            clear
          </button>
        </div>
      )}

      <div className={cx(shared.panelInset, styles.conditions)}>
        {r.conditions.length === 0 && (
          <p style={{ fontSize: '12px', color: 'var(--d4-text3)', fontStyle: 'italic', margin: 0 }}>
            No conditions — rule matches all items.
          </p>
        )}
        {r.conditions.map((_, ci) => (
          <ConditionEditor ruleIndex={i} condIndex={ci} key={ci} />
        ))}
        <button
          type="button"
          className={cx(shared.btnSecondary, styles.addCondition)}
          onClick={() => editorStore.addCondition(i)}
        >
          + Add Condition
        </button>
      </div>
    </div>
  )
}
