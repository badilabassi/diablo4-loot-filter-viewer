import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

import { parseRuleJson } from '../filter/parse-rule.ts'
import { ConditionBlock } from './condition-block.tsx'
import { qualityGlow } from './quality-glow.ts'
import { dominantGlowTag, inferRuleTags, tagChipColors } from './rule-tags.ts'
import { cardEntrance, cardStyle, metaLabel, ornateFrame, panelInset } from './styles.ts'

interface RuleCardProps extends SerializableProps {
  ruleJson: string
  delay: number
}

export const RuleCard = clientEntry(
  import.meta.url,
  function RuleCard(handle: Handle<RuleCardProps>) {
    let open = false
    const rule = () => parseRuleJson(handle.props.ruleJson)

    return () => {
      const r = rule()
      const swatchColor = r.color.isDefault ? '#4060c0' : r.color.hex
      const highlightHex = r.color.isDefault ? '#0000FF' : r.color.hex
      const tags = inferRuleTags(r)
      const glowTag = dominantGlowTag(tags)
      const ruleLabel =
        r.name.trim() || (r.type === 3 ? 'HIDE ALL' : r.type === 1 ? 'HIDE TEXT LABEL' : 'Unnamed rule')
      const toggleLabel = open
        ? `Collapse rule: ${ruleLabel}`
        : `Expand rule: ${ruleLabel}`

      return (
        <div
          mix={[
            cardStyle,
            ornateFrame,
            cardEntrance,
            qualityGlow(glowTag, { intense: open }),
            open
              ? css({
                  borderColor: 'rgba(196, 120, 32, 0.4) !important',
                })
              : undefined,
          ]}
          style={{ animationDelay: `${Math.min(handle.props.delay, 600)}ms` }}
        >
          <button
            type="button"
            aria-expanded={open}
            aria-label={toggleLabel}
            mix={[
              css({
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                border: 0,
                background: 'transparent',
                color: 'inherit',
                font: 'inherit',
                transition: 'background 150ms ease',
                '&:hover': { background: 'rgba(255, 255, 255, 0.03)' },
              }),
              on('click', async () => {
                open = !open
                await handle.update()
              }),
            ]}
          >
            <span
              aria-hidden="true"
              mix={css({ width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0 })}
              style={{ background: swatchColor, boxShadow: `0 0 10px ${swatchColor}aa` }}
            />
            <span
              aria-hidden="true"
              mix={css({ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 })}
              style={{
                background: r.enabled ? '#4caf50' : '#3a3a3a',
                boxShadow: r.enabled ? '0 0 6px #4caf50aa' : 'none',
              }}
            />
            <span
              mix={css({
                fontFamily: 'var(--font-cinzel)',
                fontSize: '16px',
                fontWeight: 600,
                flex: 1,
                color: 'var(--d4-text)',
                textShadow: glowTag ? '0 0 20px rgba(0,0,0,0.5)' : undefined,
              })}
            >
              {r.name.trim() || (r.type === 3 ? 'HIDE ALL' : r.type === 1 ? 'HIDE TEXT LABEL' : '—')}
            </span>
            {tags.length > 0 && (
              <span mix={css({ display: 'flex', gap: '6px', flexWrap: 'wrap' })}>
                {tags.map((t) => {
                  const c = tagChipColors[t.key]
                  return (
                    <span
                      key={t.key}
                      mix={css({
                        fontFamily: 'var(--font-cinzel)',
                        fontSize: '12px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        border: `1px solid ${c.border}`,
                        color: c.color,
                        background: c.bg,
                        fontWeight: 700,
                        boxShadow: `0 0 8px ${c.bg}`,
                      })}
                    >
                      {t.label}
                    </span>
                  )
                })}
              </span>
            )}
            {r.conditions.length > 0 && (
              <span
                mix={css({
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '12px',
                  color: 'var(--d4-text3)',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  border: '1px solid var(--d4-border)',
                })}
              >
                {r.conditions.length}
              </span>
            )}
            <span
              aria-hidden="true"
              mix={css({
                color: 'var(--d4-gold2)',
                transition: 'transform 200ms ease, color 150ms ease',
                transform: open ? 'rotate(90deg)' : undefined,
              })}
            >
              ›
            </span>
          </button>

          {open && (
            <div mix={panelInset}>
              <div
                mix={css({
                  display: 'flex',
                  gap: '20px',
                  flexWrap: 'wrap',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(196, 120, 32, 0.15)',
                })}
              >
                <div>
                  <span mix={metaLabel}>Status</span>
                  <p
                    style={{
                      color: r.enabled ? '#4caf50' : 'var(--d4-text3)',
                      fontSize: '12px',
                      margin: '4px 0 0',
                    }}
                  >
                    {r.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <span mix={metaLabel}>Color</span>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 0' }}>
                    <span
                      mix={css({ width: '16px', height: '16px', borderRadius: '50%' })}
                      style={{ background: highlightHex, boxShadow: `0 0 12px ${highlightHex}88` }}
                    />
                    <code style={{ fontSize: '12px', color: 'var(--d4-text2)' }}>
                      {highlightHex.toUpperCase()}
                    </code>
                  </p>
                </div>
              </div>

              {r.conditions.length === 0 ? (
                <em style={{ fontSize: '12px', color: 'var(--d4-text3)' }}>No conditions decoded</em>
              ) : (
                r.conditions.map((c, i) => <ConditionBlock cond={c} key={i} />)
              )}
            </div>
          )}
        </div>
      )
    }
  },
)
