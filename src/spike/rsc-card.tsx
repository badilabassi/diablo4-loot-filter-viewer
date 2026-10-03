import { MotionToggle } from './motion-toggle.tsx'
import styles from './rsc-card.module.css'

/** Server component: no hooks, no browser APIs. Embeds one 'use client' child. */
export function RscCard({ renderedAt }: { renderedAt: string }) {
  return (
    <section className={styles.card} data-testid="rsc-card">
      <h2 className={styles.title}>Server component</h2>
      <p>
        Rendered on the server at <time data-testid="rendered-at">{renderedAt}</time>
      </p>
      <MotionToggle />
    </section>
  )
}
