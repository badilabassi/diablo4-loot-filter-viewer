import type { CSSProperties } from 'react'

import type { RuleTagKey } from './rule-tags.ts'

/** D4 item tooltip colors per rule tag. */
export interface GlowSpec {
  accent: string
  soft: string
  strong: string
}

export const GLOW: Record<RuleTagKey, GlowSpec> = {
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

/**
 * CSS custom properties driving the quality glow in CSS (see the .glow rules in
 * viewer/rule-card.module.css). Returns undefined when the rule has no glow tag.
 */
export function glowVars(tag: RuleTagKey | null): CSSProperties | undefined {
  if (!tag) return undefined
  const g = GLOW[tag]
  return { ['--glow-accent']: g.accent, ['--glow-soft']: g.soft, ['--glow-strong']: g.strong } as CSSProperties
}
