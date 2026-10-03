import type { FilterRule } from '../filter/schemas.ts'

export type RuleTagKey =
  | 'mythic'
  | 'unique'
  | 'leg'
  | 'set'
  | 'ancestral'
  | 'ga'
  | 'codex'
  | 'select'
  | 'hidetext'
  | 'recolor'
  | 'hide'

export interface RuleTag {
  key: RuleTagKey
  label: string
}

/** Priority for ambient card glow (highest wins). */
const GLOW_PRIORITY: RuleTagKey[] = [
  'mythic',
  'unique',
  'leg',
  'set',
  'ancestral',
  'ga',
  'codex',
  'select',
]

export function inferRuleTags(rule: FilterRule): RuleTag[] {
  const n = rule.name.toLowerCase()
  const tags: RuleTag[] = []
  if (n.includes('mythic')) tags.push({ key: 'mythic', label: 'Mythic' })
  if (n.includes('unique')) tags.push({ key: 'unique', label: 'Unique' })
  if (n.includes('leg')) tags.push({ key: 'leg', label: 'Legendary' })
  if (n.includes('set')) tags.push({ key: 'set', label: 'Set' })
  if (n.includes('ancestral')) tags.push({ key: 'ancestral', label: 'Ancestral' })
  if (n.includes(' ga') || n.includes('greater affix')) tags.push({ key: 'ga', label: 'GA' })
  if (n.includes('codex')) tags.push({ key: 'codex', label: 'Codex' })
  if (n.includes('select')) tags.push({ key: 'select', label: 'SELECT' })
  if (rule.type === 1) tags.push({ key: 'hidetext', label: 'Hide Text' })
  if (rule.type === 2) tags.push({ key: 'recolor', label: 'Recolor' })
  if (rule.type === 3) tags.push({ key: 'hide', label: 'Hide All' })
  return tags
}

export function dominantGlowTag(tags: RuleTag[]): RuleTagKey | null {
  for (const key of GLOW_PRIORITY) {
    if (tags.some((t) => t.key === key)) return key
  }
  return null
}

export const tagChipColors: Record<
  RuleTagKey,
  { color: string; border: string; bg: string }
> = {
  mythic: { color: '#cda1d8', border: 'rgba(205,161,216,0.35)', bg: 'rgba(205,161,216,0.12)' },
  unique: { color: '#dca779', border: 'rgba(220,167,121,0.35)', bg: 'rgba(220,167,121,0.12)' },
  leg: { color: '#ff8000', border: 'rgba(255,128,0,0.35)', bg: 'rgba(255,128,0,0.12)' },
  set: { color: '#50d839', border: 'rgba(80,216,57,0.35)', bg: 'rgba(80,216,57,0.12)' },
  ancestral: { color: '#fff', border: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.08)' },
  ga: { color: '#29d2ff', border: 'rgba(41,210,255,0.35)', bg: 'rgba(41,210,255,0.12)' },
  codex: { color: 'var(--d4-gold2)', border: 'rgba(155,118,68,0.35)', bg: 'rgba(155,118,68,0.12)' },
  select: { color: 'var(--d4-gold3)', border: 'rgba(215,171,109,0.35)', bg: 'rgba(215,171,109,0.12)' },
  hidetext: { color: 'var(--d4-text2)', border: 'var(--d4-border)', bg: 'rgba(255,255,255,0.04)' },
  recolor: { color: 'var(--d4-text2)', border: 'var(--d4-border)', bg: 'rgba(255,255,255,0.04)' },
  hide: { color: '#ff4444', border: 'rgba(255,68,68,0.35)', bg: 'rgba(255,68,68,0.12)' },
}
