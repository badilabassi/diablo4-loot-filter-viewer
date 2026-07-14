// Server-side TOC fetch: affixes from D4Companion, items from CoreTOC + D4Companion overrides.

import { inferCat } from '../filter/toc-labels.ts'
import { ITEM_TYPES } from '../filter/constants.ts'
import type { TocAffix, TocData, TocItem, TocItemType } from '../filter/toc-types.ts'

export type { TocAffix, TocData, TocItem, TocItemType }

const D4C_BASE =
  'https://raw.githubusercontent.com/josdemmers/Diablo4Companion/master/D4Companion/Data'

export const D4C_AFFIXES_URL = `${D4C_BASE}/Affixes.enUS.json`
export const D4C_UNIQUES_URL = `${D4C_BASE}/Uniques.enUS.json`
export const CORETOC_URL =
  'https://raw.githubusercontent.com/DiabloTools/d4data/master/json/base/CoreTOC.dat.json'

export const D4C_REPO = {
  owner: 'josdemmers',
  repo: 'Diablo4Companion',
  branch: 'master',
} as const

// ── Raw types ─────────────────────────────────────────────────────────────────

interface D4CAffix {
  IdSnoList: string[]
  IdNameList: string[]
  Description: string
  DescriptionClean: string
}

interface D4CUnique {
  IdNameItemList: string[]
  Name: string
}

// ── GitHub refs API ───────────────────────────────────────────────────────────

export async function fetchCommitHash(
  owner: string,
  repo: string,
  branch: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      { headers: { Accept: 'application/vnd.github+json' } },
    )
    if (!res.ok) return null
    const json = (await res.json()) as { object?: { sha?: string } }
    return json?.object?.sha ?? null
  } catch {
    return null
  }
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed (${res.status}): ${url}`)
  return res.json() as Promise<T>
}

// ── Item name derivation for CoreTOC section 73 entries ──────────────────────

function humanizeItem(filename: string): string {
  const s = filename
    .replace(/_x\d+$/, '')
    .replace(/^S\d+_[A-Z]{2,4}_/, '')
    .replace(/^S\d+_/, '')
    .replace(/^UberUnique_/i, '')

  const rarityIdx = s.search(/_(Unique|Legendary|Mythic)(_|$)/i)
  if (rarityIdx > 0) {
    const prefix = s.slice(0, rarityIdx)
    if (prefix && !/^(Generic|Set|Base|Template)$/i.test(prefix)) {
      return prefix.replace(/_/g, ' ').trim()
    }
  }

  const SLOTS = [
    'Helm', 'Chest', 'Gloves', 'Pants', 'Legs', 'Boots', 'Ring', 'Amulet',
    'Weapon', 'Offhand', 'Shield', 'Focus', 'Staff', 'Axe', 'Sword', 'Mace',
    'Scythe', 'Glaive', 'Wand', 'Bow', 'Crossbow', 'Dagger', 'Flail',
    'Polearm', 'Quarterstaff',
  ]
  const CLASSES = [
    'Warlock', 'Druid', 'Sorc', 'Necro', 'Rogue', 'Barb', 'Spiritborn',
    'Paladin', 'Amazon',
  ]
  const parts = s.split('_')
  let slot = '', cls = '', rarity = ''
  for (const p of parts) {
    if (SLOTS.some((x) => x.toLowerCase() === p.toLowerCase())) slot = p
    if (CLASSES.some((x) => x.toLowerCase() === p.toLowerCase())) cls = p
    if (p === 'Unique') rarity = 'Unique'
    if (p === 'Legendary') rarity = 'Legendary'
    if (p === 'Mythic') rarity = 'Mythic'
  }
  return [cls, rarity || 'Item', slot].filter(Boolean).join(' ') || filename
}

// ── Build TocData ─────────────────────────────────────────────────────────────

export async function buildTocData(): Promise<TocData> {
  const [affixesRaw, uniquesRaw, coreToc] = await Promise.all([
    fetchJson<D4CAffix[]>(D4C_AFFIXES_URL),
    fetchJson<D4CUnique[]>(D4C_UNIQUES_URL),
    fetchJson<Record<string, Record<string, string>>>(CORETOC_URL),
  ])

  // Affixes — expand multi-ID groups so every SNO resolves to a name.
  const affixes: TocAffix[] = []
  for (const entry of affixesRaw) {
    const name = (entry.DescriptionClean || entry.Description)
      .split(/\r?\n/)[0]!
      .trim()
    if (!name) continue
    const cat = inferCat(name)
    for (let i = 0; i < entry.IdSnoList.length; i++) {
      const id = Number(entry.IdSnoList[i])
      if (!id) continue
      affixes.push({ id, name, cat, raw: entry.IdNameList[i] ?? entry.IdNameList[0] ?? '' })
    }
  }

  // Items — CoreTOC section 73 as base, D4Companion names as overrides.
  // D4Companion's IdSnoList is the power SNO (section 104), not the item SNO
  // (section 73). Cross-reference via IdNameItemList which holds the item filename.
  const coreTocReverse = new Map<string, number>()
  for (const [sno, fname] of Object.entries(coreToc['73'] ?? {})) {
    coreTocReverse.set(fname, Number(sno))
  }

  const d4cNameById = new Map<number, string>()
  for (const entry of uniquesRaw) {
    if (!entry.Name.trim()) continue
    for (const itemName of entry.IdNameItemList) {
      const sno = coreTocReverse.get(itemName)
      if (sno) d4cNameById.set(sno, entry.Name)
    }
  }

  // Only keep unique/mythic items — base, magic, and rare entries from section 73
  // serve no purpose in the picker and would bury named uniques under thousands
  // of "Item", "Item Helm" etc. entries.
  const items: TocItem[] = []
  for (const [sno, fname] of Object.entries(coreToc['73'] ?? {})) {
    const id = Number(sno)
    const d4cName = d4cNameById.get(id)
    if (d4cName) {
      items.push({ id, name: d4cName })
    } else if (/unique|mythic/i.test(fname)) {
      items.push({ id, name: humanizeItem(fname) })
    }
  }

  // Item types from the hardcoded SNO constant — D4Companion's ItemTypes.enUS.json
  // does not carry SNO IDs.
  const itemTypes: TocItemType[] = Object.entries(ITEM_TYPES).map(([id, name]) => ({
    id: Number(id),
    name,
  }))

  return { affixes, itemTypes, items, ts: Date.now() }
}
