import type { AffixCategory } from './schemas.ts'

export function inferCat(name: string): AffixCategory {
  const n = name.toLowerCase()
  if (/corestat|strength|dexterity|intel|willpower|allstat/.test(n)) return 'stat'
  if (/damage|crit|attack|lucky|vuln|overpower|offense|weapon/.test(n)) return 'offense'
  if (/life|armor|defense|resist|barrier|thorns|block|dodge|fortif/.test(n)) return 'defense'
  return 'utility'
}
