import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

import { COND_TYPES, QUALITY_FLAGS, QUALITY_TIERS } from '../../filter/constants.ts'
import type { FilterCondition } from '../../filter/schemas.ts'
import { editorStore } from '../../state/editor-store.ts'
import { iconBtn, selectStyle } from '../styles.ts'
import { MultiPicker } from './multi-picker.tsx'

interface ConditionEditorProps extends SerializableProps {
  ruleIndex: number
  condIndex: number
}

export const ConditionEditor = clientEntry(
  import.meta.url,
  function ConditionEditor(handle: Handle<ConditionEditorProps>) {
    const cond = () =>
      editorStore.getState().filter.rules[handle.props.ruleIndex]!.conditions[
        handle.props.condIndex
      ]!

    function patch(p: Partial<FilterCondition>) {
      editorStore.updateCondition(handle.props.ruleIndex, handle.props.condIndex, p)
      handle.update()
    }

    return () => {
      const c = cond()
      return (
        <div
          mix={[css({
            border: '1px solid var(--d4-border)',
            borderRadius: '6px',
            background: 'var(--d4-bg)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          })]}
        >
          <div mix={[css({ display: 'flex', alignItems: 'center', gap: '8px' })]}>
            <select
              value={String(c.filterType)}
              aria-label="Condition type"
              mix={[selectStyle, css({ flex: 1 }), on('change', (e) => {
                const ft = Number((e.target as HTMLSelectElement).value)
                patch({
                  filterType: ft,
                  qualityFlags: ft === 1 ? 16 : undefined,
                  minPower: undefined,
                  maxPower: undefined,
                  minQualityTier: ft === 2 ? 4 : undefined,
                  minGaCount: ft === 4 ? 1 : undefined,
                  subtypeIds: [],
                  affixIds: [],
                  itemIds: [],
                  talismanSetIds: [],
                  optionalAffixIds: [],
                  minGaFromList: ft === 6 ? 1 : undefined,
                })
              })]}
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
              mix={[
                iconBtn,
                on('click', () => {
                  editorStore.removeCondition(handle.props.ruleIndex, handle.props.condIndex)
                  handle.update()
                }),
              ]}
            >
              ×
            </button>
          </div>

          {c.filterType === 0 && (
            <div mix={[css({ display: 'flex', gap: '12px', flexWrap: 'wrap' })]}>
              <label mix={[css({ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' })]}>
                Min Power
                <input
                  type="number"
                  value={c.minPower ?? ''}
                  mix={[css({ width: '96px', padding: '4px 8px', fontSize: '12px' }), on('change', (e) =>
                    patch({
                      minPower: (e.target as HTMLInputElement).value
                        ? Number((e.target as HTMLInputElement).value)
                        : undefined,
                    }),
                  )]}
                />
              </label>
              <label mix={[css({ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' })]}>
                Max Power
                <input
                  type="number"
                  value={c.maxPower ?? ''}
                  mix={[css({ width: '96px', padding: '4px 8px', fontSize: '12px' }), on('change', (e) =>
                    patch({
                      maxPower: (e.target as HTMLInputElement).value
                        ? Number((e.target as HTMLInputElement).value)
                        : undefined,
                    }),
                  )]}
                />
              </label>
            </div>
          )}

          {c.filterType === 1 && (
            <div mix={[css({ display: 'flex', flexWrap: 'wrap', gap: '12px' })]}>
              {QUALITY_FLAGS.map(([flag, name, color]) => {
                const checked = ((c.qualityFlags ?? 0) & flag) !== 0
                return (
                  <label
                    key={flag}
                    mix={[css({ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' })]}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      mix={on('change', () => {
                        const cur = c.qualityFlags ?? 0
                        patch({ qualityFlags: checked ? cur & ~flag : cur | flag })
                      })}
                    />
                    <span style={{ color, fontSize: '12px', fontFamily: 'var(--font-cinzel)' }}>{name}</span>
                  </label>
                )
              })}
            </div>
          )}

          {c.filterType === 2 && (
            <div mix={[css({ display: 'flex', alignItems: 'center', gap: '8px' })]}>
              <span style={{ fontSize: '12px', color: 'var(--d4-text3)' }}>Min Tier</span>
              <select
                value={String(c.minQualityTier ?? 0)}
                aria-label="Minimum item quality tier"
                mix={[selectStyle, on('change', (e) => {
                  patch({ minQualityTier: Number(e.currentTarget.value) })
                })]}
              >
                {Object.entries(QUALITY_TIERS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '12px', color: 'var(--d4-text3)' }}>and above</span>
            </div>
          )}

          {c.filterType === 3 && (
            <p style={{ fontSize: '12px', color: 'var(--d4-text3)', fontStyle: 'italic', margin: 0 }}>
              Matches items with a Codex of Power upgrade available.
            </p>
          )}

          {c.filterType === 4 && (
            <label mix={[css({ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' })]}>
              Min GAs
              <input
                type="number"
                value={c.minGaCount ?? 1}
                min={1}
                max={3}
                mix={[css({ width: '64px', padding: '4px 8px' }), on('change', (e) =>
                  patch({ minGaCount: Number((e.target as HTMLInputElement).value) }),
                )]}
              />
            </label>
          )}

          {c.filterType === 5 && (
            <MultiPicker
              ruleIndex={handle.props.ruleIndex}
              condIndex={handle.props.condIndex}
              field="subtypeIds"
              kind="itemType"
              placeholder="Add item type…"
            />
          )}

          {c.filterType === 6 && (
            <>
              <MultiPicker
                ruleIndex={handle.props.ruleIndex}
                condIndex={handle.props.condIndex}
                field="affixIds"
                kind="affix"
                placeholder="Add affix…"
              />
              <label mix={[css({ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' })]}>
                Min GA from list
                <input
                  type="number"
                  value={c.minGaFromList ?? 1}
                  min={1}
                  max={3}
                  mix={[css({ width: '64px', padding: '4px 8px' }), on('change', (e) =>
                    patch({ minGaFromList: Number((e.target as HTMLInputElement).value) }),
                  )]}
                />
              </label>
            </>
          )}

          {c.filterType === 7 && (
            <MultiPicker
              ruleIndex={handle.props.ruleIndex}
              condIndex={handle.props.condIndex}
              field="optionalAffixIds"
              kind="affix"
              placeholder="Add optional affix…"
            />
          )}

          {c.filterType === 8 && (
            <>
              <label mix={[css({ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' })]}>
                <input
                  type="checkbox"
                  checked={c.itemIds.length === 0}
                  mix={on('change', () => patch({ itemIds: [] }))}
                />
                <span style={{ color: '#e822a8', fontFamily: 'var(--font-cinzel)' }}>Is Ancestral</span>
              </label>
              <MultiPicker
                ruleIndex={handle.props.ruleIndex}
                condIndex={handle.props.condIndex}
                field="itemIds"
                kind="item"
                placeholder="Add item…"
                pillColor="#ef972f"
              />
            </>
          )}

          {c.filterType === 9 && (
            <MultiPicker
              ruleIndex={handle.props.ruleIndex}
              condIndex={handle.props.condIndex}
              field="talismanSetIds"
              kind="talismanSet"
              placeholder="Add Talisman set… (leave empty to match any)"
              pillColor="#50d839"
            />
          )}
        </div>
      )
    }
  },
)
