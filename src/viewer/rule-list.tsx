import type { ParsedFilter } from '../filter/schemas.ts'
import { cx } from '../ui/cx.ts'
import shared from '../ui/styles.module.css'
import type { FilterNames } from './names.ts'
import { RuleCard } from './rule-card.tsx'
import styles from './rule-list.module.css'

/**
 * Server-safe: the viewer's main content, ported from the Remix HomeApp. With a
 * filter it shows the header strip and one card per rule; without, the empty glyph.
 * `editHref` opens this filter in the editor (plan C6Δ: the URL carries it).
 */
export function RuleList({
  filter,
  names,
  editHref,
}: {
  filter: ParsedFilter | null
  names: FilterNames
  editHref: string
}) {
  if (!filter) {
    return (
      <div className={styles.empty}>
        <div aria-hidden="true" className={styles.emptyGlyph}>
          🜏
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.header}>
        <span className={styles.filterName}>{filter.name}</span>
        <span className={styles.active}>● Active</span>
        <span className={styles.ruleCount}>{filter.rules.filter((r) => r.type !== 3).length} rules</span>
        <a href={editHref} className={cx(shared.btnSecondary, styles.editLink)}>
          Edit →
        </a>
      </div>
      {filter.rules.map((rule, i) => (
        <RuleCard key={i} rule={rule} names={names} delay={i * 25} />
      ))}
    </>
  )
}
