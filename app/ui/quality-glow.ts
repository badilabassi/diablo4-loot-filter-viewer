import { css } from 'remix/ui'

import type { RuleTagKey } from './rule-tags.ts'

interface GlowSpec {
  accent: string
  soft: string
  strong: string
}

const GLOW: Record<RuleTagKey, GlowSpec> = {
  mythic: {
    accent: 'rgba(205, 161, 216, 0.9)',
    soft: 'rgba(205, 161, 216, 0.18)',
    strong: 'rgba(205, 161, 216, 0.35)',
  },
  unique: {
    accent: 'rgba(220, 167, 121, 0.95)',
    soft: 'rgba(220, 167, 121, 0.2)',
    strong: 'rgba(220, 167, 121, 0.38)',
  },
  leg: {
    accent: 'rgba(255, 128, 0, 0.95)',
    soft: 'rgba(255, 128, 0, 0.2)',
    strong: 'rgba(255, 128, 0, 0.4)',
  },
  set: {
    accent: 'rgba(80, 216, 57, 0.95)',
    soft: 'rgba(80, 216, 57, 0.18)',
    strong: 'rgba(80, 216, 57, 0.35)',
  },
  ancestral: {
    accent: 'rgba(255, 255, 255, 0.9)',
    soft: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.28)',
  },
  ga: {
    accent: 'rgba(41, 210, 255, 0.95)',
    soft: 'rgba(41, 210, 255, 0.18)',
    strong: 'rgba(41, 210, 255, 0.35)',
  },
  codex: {
    accent: 'rgba(196, 120, 32, 0.9)',
    soft: 'rgba(196, 120, 32, 0.16)',
    strong: 'rgba(196, 120, 32, 0.32)',
  },
  select: {
    accent: 'rgba(215, 171, 109, 0.95)',
    soft: 'rgba(215, 171, 109, 0.16)',
    strong: 'rgba(215, 171, 109, 0.3)',
  },
  hidetext: {
    accent: 'rgba(135, 133, 130, 0.7)',
    soft: 'rgba(135, 133, 130, 0.08)',
    strong: 'rgba(135, 133, 130, 0.15)',
  },
  recolor: {
    accent: 'rgba(135, 133, 130, 0.7)',
    soft: 'rgba(135, 133, 130, 0.08)',
    strong: 'rgba(135, 133, 130, 0.15)',
  },
  hide: {
    accent: 'rgba(255, 68, 68, 0.9)',
    soft: 'rgba(255, 68, 68, 0.14)',
    strong: 'rgba(255, 68, 68, 0.3)',
  },
}

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
