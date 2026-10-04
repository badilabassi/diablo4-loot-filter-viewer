import type { CSSProperties } from 'react'

import type { FilterRule } from '../filter/schemas.ts'
import { cx } from '../ui/cx.ts'
import { glowVars } from '../ui/quality-glow.ts'
import { dominantGlowTag, inferRuleTags, tagChipColors } from '../ui/rule-tags.ts'
import shared from '../ui/styles.module.css'
import { ConditionBlock } from './condition-block.tsx'
import type { FilterNames } from './names.ts'
import styles from './rule-card.module.css'

/**
 * Server-safe. Ported from the Remix RuleCard; expand/collapse is native
 * <details>, so the card needs no client JavaScript.
 */
export function RuleCard({
  rule: r,
  names,
  delay,
}: {
  rule: FilterRule
  names: FilterNames
  delay: number
}) {
  const isRecolor = r.type === 2
  const swatchColor = r.color?.hex ?? '#ffffff'
  const tags = inferRuleTags(r)
  const glowTag = dominantGlowTag(tags)

  return (
    <details
      className={cx(shared.card, shared.ornateFrame, shared.cardEntrance, styles.card)}
      data-glow={glowTag ?? undefined}
      style={
        {
          animationDelay: `${Math.min(delay, 600)}ms`,
          '--entrance-opacity': r.enabled ? 1 : 0.55,
          filter: r.enabled ? undefined : 'grayscale(0.6)',
          ...glowVars(glowTag),
        } as CSSProperties
      }
    >
      <summary className={styles.summary}>
        {isRecolor && (
          <span
            aria-hidden="true"
            className={styles.swatch}
            style={{ background: swatchColor, boxShadow: `0 0 10px ${swatchColor}aa` }}
          />
        )}
        <span
          aria-hidden="true"
          className={styles.enabledDot}
          style={{
            background: r.enabled ? '#4caf50' : 'transparent',
            border: r.enabled ? 'none' : '1.5px solid var(--d4-text3)',
            boxShadow: r.enabled ? '0 0 6px #4caf50aa' : 'none',
          }}
        />
        {!r.enabled && <span className={styles.off}>OFF</span>}
        <span className={styles.name}>
          {r.name.trim() || (r.type === 3 ? 'HIDE ALL' : r.type === 1 ? 'HIDE TEXT LABEL' : '—')}
        </span>
        {tags.length > 0 && (
          <span className={styles.tags}>
            {tags.map((t) => {
              const c = tagChipColors[t.key]
              return (
                <span
                  key={t.key}
                  className={styles.tag}
                  style={{
                    border: `1px solid ${c.border}`,
                    color: c.color,
                    background: c.bg,
                    boxShadow: `0 0 8px ${c.bg}`,
                  }}
                >
                  {t.label}
                </span>
              )
            })}
          </span>
        )}
        {r.conditions.length > 0 && (
          <span
            className={styles.count}
            aria-label={`${r.conditions.length} condition${r.conditions.length === 1 ? '' : 's'}`}
          >
            {r.conditions.length}
          </span>
        )}
        <span aria-hidden="true" className={styles.chevron}>
          ›
        </span>
      </summary>

      <div className={cx(shared.panelInset, shared.panelEntrance)}>
        <div className={styles.meta}>
          <div>
            <span className={shared.metaLabel}>Status</span>
            <p
              className={styles.metaValue}
              style={{ color: r.enabled ? '#4caf50' : 'var(--d4-text3)' }}
            >
              {r.enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          {isRecolor && (
            <div>
              <span className={shared.metaLabel}>Color</span>
              <p className={styles.colorValue}>
                <span
                  className={styles.colorDot}
                  style={{ background: swatchColor, boxShadow: `0 0 12px ${swatchColor}88` }}
                />
                <code className={styles.hex}>{swatchColor.toUpperCase()}</code>
              </p>
            </div>
          )}
        </div>

        {r.conditions.length === 0 ? (
          <em className={styles.empty}>No conditions decoded</em>
        ) : (
          r.conditions.map((c, i) => <ConditionBlock key={i} cond={c} names={names} />)
        )}
      </div>
    </details>
  )
}
