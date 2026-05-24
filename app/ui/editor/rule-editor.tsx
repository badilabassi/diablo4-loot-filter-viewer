import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

import { editorStore } from '../../state/editor-store.ts'
import { qualityGlow } from '../quality-glow.ts'
import { dominantGlowTag, inferRuleTags } from '../rule-tags.ts'
import {
  btnSecondary,
  cardEntrance,
  cardStyle,
  iconBtn,
  ornateFrame,
  panelInset,
  selectStyle,
} from '../styles.ts'
import { ConditionEditor } from './condition-editor.tsx'

interface RuleEditorProps extends SerializableProps {
  index: number
  total: number
}

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

export const RuleEditor = clientEntry(
  import.meta.url,
  function RuleEditor(handle: Handle<RuleEditorProps>) {
    const rule = () => editorStore.getState().filter.rules[handle.props.index]!

    function refresh() {
      handle.update()
    }

    return () => {
      const r = rule()
      const i = handle.props.index
      const glowTag = dominantGlowTag(inferRuleTags(r))
      return (
        <div
          mix={[
            cardStyle,
            ornateFrame,
            cardEntrance,
            qualityGlow(glowTag),
            css({ marginBottom: 0 }),
          ]}
          style={{ animationDelay: `${Math.min(i * 30, 500)}ms` }}
        >
          <div
            mix={css({
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderBottom: '1px solid rgba(196, 120, 32, 0.2)',
              flexWrap: 'wrap',
              background:
                'linear-gradient(180deg, rgba(196, 120, 32, 0.08) 0%, rgba(0, 0, 0, 0.15) 100%)',
            })}
          >
            <div
              mix={[css({ display: 'flex', flexDirection: 'column', gap: '2px' })]}
              role="group"
              aria-label={`Reorder rule ${i + 1}`}
            >
              <button
                type="button"
                disabled={i === 0}
                aria-label="Move rule up"
                mix={[
                  iconBtn,
                  css({ minWidth: '36px', minHeight: '36px', fontSize: '10px' }),
                  on('click', () => {
                    editorStore.moveRule(i, i - 1)
                    refresh()
                  }),
                ]}
              >
                ▲
              </button>
              <button
                type="button"
                disabled={i === handle.props.total - 1}
                aria-label="Move rule down"
                mix={[
                  iconBtn,
                  css({ minWidth: '36px', minHeight: '36px', fontSize: '10px' }),
                  on('click', () => {
                    editorStore.moveRule(i, i + 1)
                    refresh()
                  }),
                ]}
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
              mix={[css({
                flex: 1,
                minWidth: '120px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid transparent',
                color: 'var(--d4-text)',
                fontFamily: 'var(--font-cinzel)',
                fontSize: '14px',
                outline: 'none',
              }), on('input', (e) => {
                editorStore.updateRule(i, { name: (e.target as HTMLInputElement).value })
                refresh()
              })]}
            />
            <select
              value={String(r.type)}
              aria-label="Rule type"
              mix={[selectStyle, on('change', (e) => {
                editorStore.updateRule(i, { type: Number(e.currentTarget.value) })
                refresh()
              })]}
            >
              {RULE_TYPES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <label
              mix={[css({ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' })]}
            >
              <span
                aria-hidden="true"
                mix={[css({ display: 'block', width: '20px', height: '20px', borderRadius: '4px', border: '1px solid var(--d4-border)' })]}
                style={{ background: r.color.isDefault ? '#0000ff' : r.color.hex }}
              />
              <input
                type="color"
                value={r.color.isDefault ? '#0000ff' : r.color.hex}
                aria-label="Rule highlight color"
                mix={[css({ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }), on('change', (e) => {
                  editorStore.updateRule(i, {
                    color: { hex: (e.target as HTMLInputElement).value, isDefault: false },
                  })
                  refresh()
                })]}
              />
            </label>
            <label mix={[css({ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' })]}>
              <input
                type="checkbox"
                checked={r.enabled}
                mix={on('change', (e) => {
                  editorStore.updateRule(i, { enabled: e.currentTarget.checked })
                  refresh()
                })}
              />
              On
            </label>
            <button
              type="button"
              aria-label="Duplicate rule"
              mix={[
                iconBtn,
                on('click', () => {
                  editorStore.duplicateRule(i)
                  refresh()
                }),
              ]}
            >
              ⧉
            </button>
            <button
              type="button"
              aria-label="Remove rule"
              mix={[
                iconBtn,
                on('click', () => {
                  editorStore.removeRule(i)
                  refresh()
                }),
              ]}
            >
              ×
            </button>
          </div>

          <div
            mix={[css({
              display: 'flex',
              gap: '4px',
              padding: '6px 12px',
              borderBottom: '1px solid var(--d4-border)',
              flexWrap: 'wrap',
            })]}
          >
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Set highlight color ${c.toUpperCase()}`}
                mix={[
                  css({
                    width: '44px',
                    height: '44px',
                    borderRadius: '6px',
                    border: '1px solid var(--d4-border)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    background: 'transparent',
                  }),
                  on('click', () => {
                    editorStore.updateRule(i, { color: { hex: c, isDefault: false } })
                    refresh()
                  }),
                ]}
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
              aria-label="Reset highlight color to default"
              mix={[
                btnSecondary,
                css({ minHeight: '44px', fontSize: '11px' }),
                on('click', () => {
                  editorStore.updateRule(i, { color: { hex: '#0000ff', isDefault: true } })
                  refresh()
                }),
              ]}
            >
              default
            </button>
          </div>

          <div mix={[panelInset, css({ display: 'flex', flexDirection: 'column', gap: '8px' })]}>
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
              mix={[btnSecondary, css({ width: '100%' }), on('click', () => {
                editorStore.addCondition(i)
                refresh()
              })]}
            >
              + Add Condition
            </button>
          </div>
        </div>
      )
    }
  },
)
