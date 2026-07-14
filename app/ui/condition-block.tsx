import { css, type Handle } from 'remix/ui'

import { COND_TYPES, ITEM_TYPES, QUALITY_FLAGS, QUALITY_TIERS } from '../filter/constants.ts'
import { tocStore } from '../state/toc-store.ts'
import type { FilterCondition } from '../filter/schemas.ts'
import { AffixChip } from './affix-chip.tsx'
import { condBlockStyle, metaLabel, ornateFrame } from './styles.ts'

export function ConditionBlock(handle: Handle<{ cond: FilterCondition }>) {
  return () => {
    const { cond } = handle.props
    const ct = COND_TYPES[cond.filterType] ?? { label: `Filter ${cond.filterType}`, icon: '?' }
    const qMatched =
      cond.qualityFlags != null
        ? QUALITY_FLAGS.filter(([flag]) => ((cond.qualityFlags ?? 0) & flag) !== 0)
        : []
    const uniqueAffixes: number[] = [...new Set(cond.affixIds)]
    const uniqueOptionalAffixes: number[] = [...new Set(cond.optionalAffixIds)]
    const uniqueSubtypes: number[] = [...new Set(cond.subtypeIds)]
    const uniqueItemIds: number[] = [...new Set(cond.itemIds)]
    const uniqueTalismanSets: number[] = [...new Set(cond.talismanSetIds)]

    const hasContent =
      qMatched.length > 0 ||
      uniqueAffixes.length > 0 ||
      uniqueOptionalAffixes.length > 0 ||
      uniqueSubtypes.length > 0 ||
      uniqueItemIds.length > 0 ||
      uniqueTalismanSets.length > 0 ||
      cond.filterType === 9 ||
      cond.minPower != null ||
      cond.minQualityTier != null ||
      cond.minGaCount != null

    return (
      <div mix={[condBlockStyle, ornateFrame]}>
        <div
          mix={[
            metaLabel,
            css({
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontSize: '14px',
              color: 'var(--d4-gold)',
            }),
          ]}
        >
          <span>{ct.icon}</span>
          <span>{ct.label}</span>
          <span mix={css({ flex: 1, height: '1px', background: 'var(--d4-border)' })} />
        </div>

        {qMatched.length > 0 && (
          <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' })}>
            {qMatched.map(([, name, color]) => (
              <span
                key={name}
                mix={css({
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '14px',
                  fontFamily: 'var(--font-cinzel)',
                  fontWeight: 700,
                  border: `1px solid ${color}`,
                  color,
                  background: `${color}18`,
                })}
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {cond.minQualityTier != null && (
          <p style={{ fontSize: '14px', color: 'var(--d4-text2)', marginTop: '4px' }}>
            Min quality:{' '}
            <strong style={{ color: 'var(--d4-gold2)' }}>
              {QUALITY_TIERS[cond.minQualityTier] ?? `Tier ${cond.minQualityTier}`}
            </strong>
            <span style={{ color: 'var(--d4-text3)', marginLeft: '4px' }}>(and above)</span>
          </p>
        )}

        {cond.minPower != null && (
          <p style={{ fontSize: '14px', color: 'var(--d4-text2)', marginTop: '4px' }}>
            Min Item Power: <strong style={{ color: 'var(--d4-gold2)' }}>{cond.minPower}</strong>
          </p>
        )}

        {cond.minGaCount != null && (
          <p style={{ fontSize: '14px', color: 'var(--d4-text2)', marginTop: '4px' }}>
            Min Greater Affixes: <strong style={{ color: 'var(--d4-gold2)' }}>{cond.minGaCount}</strong>
          </p>
        )}

        {uniqueSubtypes.length > 0 && (
          <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' })}>
            {uniqueSubtypes.map((id) => {
              const name = tocStore.getItemType(id)?.name ?? ITEM_TYPES[id]
              return (
                <span
                  key={id}
                  mix={css({
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--d4-border2)',
                    background: 'var(--d4-bg)',
                    fontSize: '14px',
                    color: 'var(--d4-text)',
                  })}
                  title={`ItemType SNO: 0x${id.toString(16).toUpperCase()}`}
                >
                  {name ?? (
                    <>
                      <em style={{ fontSize: '12px', opacity: 0.6 }}>Unknown type</em>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--d4-text3)' }}>
                        0x{id.toString(16).toUpperCase()}
                      </span>
                    </>
                  )}
                </span>
              )
            })}
          </div>
        )}

        {uniqueAffixes.length > 0 && (
          <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' })}>
            {uniqueAffixes.map((id) => (
              <AffixChip snoId={id} />
            ))}
          </div>
        )}

        {uniqueOptionalAffixes.length > 0 && (
          <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' })}>
            {uniqueOptionalAffixes.map((id) => (
              <AffixChip snoId={id} />
            ))}
          </div>
        )}

        {cond.filterType === 8 && uniqueItemIds.length === 0 && (
          <p style={{ fontSize: '14px', color: 'var(--d4-text2)', marginTop: '4px' }}>
            <strong style={{ color: 'var(--d4-unique)' }}>Is Ancestral</strong>
          </p>
        )}

        {cond.filterType === 9 && uniqueTalismanSets.length === 0 && (
          <p style={{ fontSize: '14px', color: 'var(--d4-text2)', marginTop: '4px' }}>
            <strong style={{ color: '#50d839' }}>Any Talisman Set</strong>
          </p>
        )}

        {uniqueTalismanSets.length > 0 && (
          <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' })}>
            {uniqueTalismanSets.map((id) => {
              const name = tocStore.getTalismanSet(id)?.name
              return (
                <span
                  key={id}
                  mix={css({
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(80, 216, 57, 0.3)',
                    background: 'rgba(80, 216, 57, 0.1)',
                    fontSize: '14px',
                    color: '#50d839',
                  })}
                  title={`Talisman Set SNO: 0x${id.toString(16).toUpperCase()}`}
                >
                  {name ?? (
                    <>
                      <em style={{ fontSize: '12px', opacity: 0.6 }}>Unknown set</em>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', opacity: 0.6 }}>
                        0x{id.toString(16).toUpperCase()}
                      </span>
                    </>
                  )}
                </span>
              )
            })}
          </div>
        )}

        {uniqueItemIds.length > 0 && (
          <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' })}>
            {uniqueItemIds.map((id) => {
              const name = tocStore.getItem(id)?.name
              return (
                <span
                  key={id}
                  mix={css({
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(220, 167, 121, 0.3)',
                    background: 'rgba(220, 167, 121, 0.1)',
                    fontSize: '14px',
                    color: 'var(--d4-unique)',
                  })}
                  title={`Item SNO: 0x${id.toString(16).toUpperCase()}`}
                >
                  {name ?? (
                    <>
                      <em style={{ fontSize: '12px', opacity: 0.6 }}>Unknown item</em>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', opacity: 0.6 }}>
                        0x{id.toString(16).toUpperCase()}
                      </span>
                    </>
                  )}
                </span>
              )
            })}
          </div>
        )}

        {!hasContent && (
          <em style={{ fontSize: '12px', color: 'var(--d4-text3)' }}>Condition active</em>
        )}
      </div>
    )
  }
}
