import type { FilterNames } from './names.ts'
import styles from './affix-chip.module.css'

/** Server-safe. `affix` is undefined when the id isn't in the TOC index. */
export function AffixChip({
  snoId,
  affix,
}: {
  snoId: number
  affix: FilterNames['affixes'][number] | undefined
}) {
  return (
    <span
      className={styles.chip}
      data-cat={affix?.cat}
      title={affix ? `${affix.raw}\nSNO: ${snoId}` : `Unknown SNO: ${snoId}`}
    >
      {affix ? (
        affix.name
      ) : (
        <>
          {/* The server always has the index, so this is a genuinely unknown id
              (the Remix app said "resolving…" while its client index loaded). */}
          <em className={styles.unknown}>Unknown affix</em>
          <span className={styles.hex}>0x{snoId.toString(16).toUpperCase()}</span>
        </>
      )}
    </span>
  )
}
