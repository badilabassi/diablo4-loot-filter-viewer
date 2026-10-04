import { COND_TYPES, ITEM_PROPERTIES, ITEM_TYPES, QUALITY_FLAGS } from '../filter/constants.ts'
import type { FilterCondition } from '../filter/schemas.ts'
import { cx } from '../ui/cx.ts'
import shared from '../ui/styles.module.css'
import { AffixChip } from './affix-chip.tsx'
import styles from './condition-block.module.css'
import type { FilterNames } from './names.ts'

const hex = (id: number) => `0x${id.toString(16).toUpperCase()}`

/** Server-safe. Ported 1:1 from the Remix ConditionBlock; names come from `names`. */
export function ConditionBlock({ cond, names }: { cond: FilterCondition; names: FilterNames }) {
  const ct = COND_TYPES[cond.filterType] ?? { label: `Filter ${cond.filterType}`, icon: '?' }
  const qMatched =
    cond.qualityFlags != null
      ? QUALITY_FLAGS.filter(([flag]) => ((cond.qualityFlags ?? 0) & flag) !== 0)
      : []
  // Item Properties bits; any bit without a known name is shown by its value.
  const props = cond.itemProperties ?? 0
  const pMatched = ITEM_PROPERTIES.filter(([bit]) => (props & bit) !== 0)
  const unknownProps = props & ~ITEM_PROPERTIES.reduce((m, [bit]) => m | bit, 0)
  const uniqueAffixes = [...new Set(cond.affixIds)]
  const uniqueOptionalAffixes = [...new Set(cond.optionalAffixIds)]
  const uniqueSubtypes = [...new Set(cond.subtypeIds)]
  const uniqueItemIds = [...new Set(cond.itemIds)]
  const uniqueTalismanSets = [...new Set(cond.talismanSetIds)]
  // Has Required Affixes: the affixes that must also roll as Greater Affixes.
  const greaterAffixes = [...new Set((cond.affixRanges ?? []).map((r) => r.min))]

  const hasContent =
    qMatched.length > 0 ||
    uniqueAffixes.length > 0 ||
    uniqueOptionalAffixes.length > 0 ||
    uniqueSubtypes.length > 0 ||
    uniqueItemIds.length > 0 ||
    uniqueTalismanSets.length > 0 ||
    cond.filterType === 9 ||
    cond.minPower != null ||
    cond.itemProperties != null ||
    cond.minGaCount != null

  return (
    <div className={cx(shared.condBlock, shared.ornateFrame)}>
      <div className={cx(shared.metaLabel, styles.header)}>
        <span>{ct.icon}</span>
        <span>{ct.label}</span>
        <span className={styles.rule} />
      </div>

      {qMatched.length > 0 && (
        <div className={styles.qualityChips}>
          {qMatched.map(([, name, color]) => (
            <span
              key={name}
              className={styles.quality}
              style={{ border: `1px solid ${color}`, color, background: `${color}18` }}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {cond.itemProperties != null && (
        <div className={styles.qualityChips}>
          {pMatched.map(([, name, color]) => (
            <span
              key={name}
              className={styles.quality}
              style={{ border: `1px solid ${color}`, color, background: `${color}18` }}
            >
              {name}
            </span>
          ))}
          {unknownProps !== 0 && <span className={styles.quality}>Other ({unknownProps})</span>}
        </div>
      )}

      {cond.minPower != null && (
        <p className={styles.stat}>
          Min Item Power: <strong className={styles.statValue}>{cond.minPower}</strong>
        </p>
      )}

      {cond.minGaCount != null && (
        <p className={styles.stat}>
          {/* Field 6 is the direction: 1 = at least, anything else = fewer than. */}
          Must have {cond.field6 === 1 ? 'at least' : 'fewer than'}{' '}
          <strong className={styles.statValue}>{cond.minGaCount}</strong> Greater{' '}
          {cond.minGaCount === 1 ? 'Affix' : 'Affixes'}
        </p>
      )}

      {uniqueSubtypes.length > 0 && (
        <div className={styles.chips}>
          {uniqueSubtypes.map((id) => {
            const name = names.itemTypes[id] ?? ITEM_TYPES[id]
            return (
              <span
                key={id}
                className={cx(styles.pill, styles.itemType)}
                title={`ItemType SNO: ${hex(id)}`}
              >
                {name ?? (
                  <>
                    <em className={styles.unknown}>Unknown type</em>
                    <span className={styles.hex}>{hex(id)}</span>
                  </>
                )}
              </span>
            )
          })}
        </div>
      )}

      {cond.filterType === 6 && cond.minFromList != null && (
        <p className={styles.stat}>
          Must have at least <strong className={styles.statValue}>{cond.minFromList}</strong> of:
        </p>
      )}
      {uniqueAffixes.length > 0 && (
        <div className={styles.chips}>
          {uniqueAffixes.map((id) => (
            <AffixChip key={id} snoId={id} affix={names.affixes[id]} />
          ))}
        </div>
      )}

      {greaterAffixes.length > 0 && (
        <>
          <p className={styles.subLabel}>Greater Affixes:</p>
          <div className={styles.chips}>
            {greaterAffixes.map((id) => (
              <AffixChip key={id} snoId={id} affix={names.affixes[id]} />
            ))}
          </div>
        </>
      )}

      {cond.filterType === 7 && cond.minFromList != null && (
        <p className={styles.stat}>
          Must have at least <strong className={styles.statValue}>{cond.minFromList}</strong> of:
        </p>
      )}
      {uniqueOptionalAffixes.length > 0 && (
        <div className={styles.chips}>
          {uniqueOptionalAffixes.map((id) => (
            <AffixChip key={id} snoId={id} affix={names.affixes[id]} />
          ))}
        </div>
      )}

      {cond.filterType === 8 && uniqueItemIds.length === 0 && (
        <p className={styles.stat}>
          <strong className={styles.ancestral}>Is Ancestral</strong>
        </p>
      )}

      {cond.filterType === 9 && uniqueTalismanSets.length === 0 && (
        <p className={styles.stat}>
          <strong className={styles.anySet}>Any Talisman Set</strong>
        </p>
      )}

      {uniqueTalismanSets.length > 0 && (
        <div className={styles.chips}>
          {uniqueTalismanSets.map((id) => (
            <span
              key={id}
              className={cx(styles.pill, styles.talismanSet)}
              title={`Talisman Set SNO: ${hex(id)}`}
            >
              {names.talismanSets[id] ?? (
                <>
                  <em className={styles.unknown}>Unknown set</em>
                  <span className={styles.hex}>{hex(id)}</span>
                </>
              )}
            </span>
          ))}
        </div>
      )}

      {uniqueItemIds.length > 0 && (
        <div className={styles.chips}>
          {uniqueItemIds.map((id) => (
            <span key={id} className={cx(styles.pill, styles.item)} title={`Item SNO: ${hex(id)}`}>
              {names.items[id] ?? (
                <>
                  <em className={styles.unknown}>Unknown item</em>
                  <span className={styles.hex}>{hex(id)}</span>
                </>
              )}
            </span>
          ))}
        </div>
      )}

      {!hasContent && <em className={styles.empty}>Condition active</em>}
    </div>
  )
}
