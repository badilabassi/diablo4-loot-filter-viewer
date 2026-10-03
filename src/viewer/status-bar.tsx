import styles from './status-bar.module.css'

export interface IndexStatus {
  affixes: number
  items: number
  /** When the TOC data was built (ms since epoch). */
  ts: number
}

/**
 * "seeded 3d ago" as the Remix StatusBar computed it. Pass `now` explicitly:
 * computing it during render would differ between server and client.
 */
export function seededAge(ts: number, now: number): string {
  const ageH = Math.round((now - ts) / (1000 * 60 * 60))
  return ageH < 1 ? 'just now' : ageH < 24 ? `${ageH}h ago` : `${Math.round(ageH / 24)}d ago`
}

/**
 * Server-safe. The server always has the index, so the Remix version's
 * "Loading index…" state no longer exists. Counts use a fixed locale so the
 * markup is the same wherever it renders.
 */
export function StatusBar({ status, age }: { status: IndexStatus; age: string }) {
  return (
    <div role="status" aria-live="polite" className={styles.bar}>
      <span aria-hidden="true" className={styles.dot} />
      <span className={styles.ready}>Index ready</span>
      <span className={styles.sep}>·</span>
      <span className={styles.count}>{status.affixes.toLocaleString('en-US')} affixes</span>
      <span className={styles.sep}>·</span>
      <span className={styles.count}>{status.items.toLocaleString('en-US')} items</span>
      <span className={styles.age}>seeded {age}</span>
    </div>
  )
}
