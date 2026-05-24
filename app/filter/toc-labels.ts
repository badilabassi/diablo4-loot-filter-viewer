import type { AffixCategory } from './schemas.ts'

export function humanize(raw: string): string {
  if (!raw) return '?'
  const n = raw
    .replace(/_Slot0\d+$/, '')
    .replace(/^[A-Z]\d+_[A-Z]{2,4}_/, '')
    .replace(/^[A-Z]\d+_/, '')
    .replace(/^INHERENT_/, '')
    .replace(/^Tempered_/, 'Tempered ')
  const dtM = n.match(/^DamageType_(.+)/)
  if (dtM) return `${dtM[1]} Damage`
  const csM = n.match(/^CoreStat_(.+)/)
  if (csM) return csM[1]!
  return n
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\bCDR\b/gi, 'Cooldown Reduction')
    .replace(/\bCrit\b/g, 'Critical Strike')
    .replace(/\bCD\b/g, 'Cooldown')
    .replace(/\bDmg\b/g, 'Damage')
    .replace(/\bRes\b/g, 'Resistance')
    .trim()
}

export function inferCat(name: string): AffixCategory {
  const n = name.toLowerCase()
  if (/corestat|strength|dexterity|intel|willpower|allstat/.test(n)) return 'stat'
  if (/damage|crit|attack|lucky|vuln|overpower|offense|weapon/.test(n)) return 'offense'
  if (/life|armor|defense|resist|barrier|thorns|block|dodge|fortif/.test(n)) return 'defense'
  return 'utility'
}
