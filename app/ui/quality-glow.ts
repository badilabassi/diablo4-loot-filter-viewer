import { css } from 'remix/component'

import { GLOW } from '../../src/ui/quality-glow.ts'
import type { RuleTagKey } from '../../src/ui/rule-tags.ts'

/** Left-edge quality beam + ambient hover/open glow (D4 item tooltip colors). */
export function qualityGlow(tag: RuleTagKey | null, opts?: { intense?: boolean }) {
  if (!tag) return undefined
  const g = GLOW[tag]
  const intense = opts?.intense ?? false
  return css({
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '3px',
      borderRadius: '8px 0 0 8px',
      pointerEvents: 'none',
      background: `linear-gradient(180deg, ${g.accent} 0%, transparent 100%)`,
      boxShadow: intense
        ? `0 0 28px ${g.strong}, 0 0 8px ${g.accent}`
        : `0 0 16px ${g.soft}`,
      opacity: intense ? 1 : 0.75,
      transition: 'opacity 200ms ease, box-shadow 200ms ease',
    },
    '&:hover::after': {
      opacity: 1,
      boxShadow: `0 0 24px ${g.strong}, 0 0 10px ${g.accent}`,
    },
    boxShadow: intense
      ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 32px ${g.soft}, 0 4px 20px rgba(0,0,0,0.45)`
      : undefined,
  })
}
