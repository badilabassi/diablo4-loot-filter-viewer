// Server-side TOC fetch, build, and processing.

import { humanize, inferCat } from '../filter/toc-labels.ts'
import type { TocAffix, TocData, TocItem, TocItemType } from '../filter/toc-types.ts'

export type { AffixCategory } from '../filter/schemas.ts'
export type { TocAffix, TocData, TocItem, TocItemType }

// ── Maxroll data types (subset we care about) ─────────────────────────────────

interface MaxrollItem {
  id: number;
  name?: string;
  magicType?: number;
}

export interface MaxrollData {
  items: Record<string, MaxrollItem>;
}

export const MAXROLL_DATA_URL = "https://assets-ng.maxroll.gg/d4-tools/game/data.min.json";

export async function fetchMaxrollData(): Promise<MaxrollData> {
  const res = await fetch(MAXROLL_DATA_URL);
  if (!res.ok) throw new Error(`Maxroll data fetch failed: ${res.status}`);
  const json = (await res.json()) as MaxrollData;
  return json;
}

/**
 * Returns the ETag (or Last-Modified as fallback) for the Maxroll data file
 * using a HEAD request — no body downloaded.
 */
export async function fetchMaxrollEtag(): Promise<string | null> {
  try {
    const res = await fetch(MAXROLL_DATA_URL, { method: "HEAD" });
    if (!res.ok) return null;
    return res.headers.get("etag") ?? res.headers.get("last-modified");
  } catch {
    return null;
  }
}

export function buildMaxrollItemNames(data: MaxrollData): Map<number, string> {
  const map = new Map<number, string>();
  for (const v of Object.values(data.items)) {
    if (v.id && v.name) map.set(v.id, v.name);
  }
  return map;
}

// ── Config ────────────────────────────────────────────────────────────────────

export const REPOS = [
  { owner: "DiabloTools", repo: "d4data", branch: "master" },
] as const;

const AFFIX_SKIP = [
  "Unique_",
  "UBERUNIQUE",
  "TEST",
  "DONOTSHIP",
  "Legacy",
  "PACT",
  "Paragon_",
  "QA_",
];

function humanizeItemType(raw: string): string {
  const MAP: Record<string, string> = {
    GearItem: "Any Equipment",
    Mace: "Mace",
    Mace2H: "Two-Hand Mace",
    Mace2HDruid: "Two-Hand Mace",
    Sword: "Sword",
    Sword2H: "Two-Hand Sword",
    Axe: "Axe",
    Axe2H: "Two-Hand Axe",
    Staff: "Staff",
    StaffDruid: "Druid Staff",
    StaffSorcerer: "Sorcerer Staff",
    Scythe: "Scythe",
    Scythe2H: "Two-Hand Scythe",
    Dagger: "Dagger",
    DaggerOffHand: "Off-Hand Dagger",
    Polearm: "Polearm",
    Glaive: "Glaive",
    Quarterstaff: "Quarterstaff",
    Wand: "Wand",
    Bow: "Bow",
    Crossbow: "Crossbow",
    Crossbow2H: "Two-Hand Crossbow",
    Focus: "Focus",
    OffHandTotem: "Off-Hand Totem",
    FocusBookOffHand: "Off-Hand Focus",
    Shield: "Shield",
    ChestArmor: "Chest Armor",
    Helm: "Helm",
    Legs: "Pants",
    Boots: "Boots",
    Gloves: "Gloves",
    Ring: "Ring",
    Amulet: "Amulet",
    Charm: "Charm",
    HoradricSeal: "Horadric Seal",
    Flail: "Flail",
    Amazon_Spear: "Amazon Spear",
    Amazon_Shield: "Amazon Shield",
  };
  return MAP[raw] ?? raw.replace(/_/g, " ");
}

function humanizeItem(filename: string): string {
  const s = filename
    .replace(/_x\d+$/, "") // _x1 expansion suffix
    .replace(/_\d{3}$/, "") // _001 numeric suffix
    .replace(/^S\d+_[A-Z]{2,4}_/, "") // S04_BSK_ season+class prefix
    .replace(/^S\d+_/, "") // S04_ season prefix
    .replace(/^UberUnique_/i, "");

  // Extract named item portion before the rarity marker
  // e.g. "Andariels_Visage_Unique_Helm_Generic" → "Andariels Visage"
  const rarityIdx = s.search(/_(Unique|Legendary|Mythic)(_|$)/i);
  if (rarityIdx > 0) {
    const prefix = s.slice(0, rarityIdx);
    if (prefix && !/^(Generic|Set|Base|Template)$/i.test(prefix)) {
      return prefix.replace(/_/g, " ").trim();
    }
  }

  // Generic item — extract slot/class/rarity
  const SLOTS = [
    "Helm",
    "Chest",
    "Gloves",
    "Pants",
    "Legs",
    "Boots",
    "Ring",
    "Amulet",
    "Weapon",
    "Offhand",
    "Shield",
    "Focus",
    "Staff",
    "Axe",
    "Sword",
    "Mace",
    "Scythe",
    "Glaive",
    "Wand",
    "Bow",
    "Crossbow",
    "Dagger",
    "Flail",
    "Polearm",
    "Quarterstaff",
  ];
  const CLASSES = [
    "Warlock",
    "Druid",
    "Sorc",
    "Necro",
    "Rogue",
    "Barb",
    "Spiritborn",
    "Paladin",
    "Amazon",
  ];
  const parts = s.split("_");
  let slot = "",
    cls = "",
    rarity = "";
  for (const p of parts) {
    if (SLOTS.some((x) => x.toLowerCase() === p.toLowerCase())) slot = p;
    if (CLASSES.some((x) => x.toLowerCase() === p.toLowerCase())) cls = p;
    if (p === "Unique") rarity = "Unique";
    if (p === "Legendary") rarity = "Legendary";
    if (p === "Mythic") rarity = "Mythic";
  }
  return [cls, rarity || "Item", slot].filter(Boolean).join(" ") || filename;
}

// ── Fetch CoreTOC ─────────────────────────────────────────────────────────────

/**
 * Returns the latest commit SHA for a GitHub repo branch using the lightweight
 * Git refs API (no auth required, minimal payload).
 */
export async function fetchCommitHash(
  owner: string,
  repo: string,
  branch: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { object?: { sha?: string } };
    return json?.object?.sha ?? null;
  } catch {
    return null;
  }
}

export async function fetchCoreTOC(): Promise<Record<string, Record<string, string>>> {
  for (const { owner, repo, branch } of REPOS) {
    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/json/base/CoreTOC.dat.json`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json: unknown = await res.json();
      if (json && typeof json === "object") return json as Record<string, Record<string, string>>;
    } catch {}
  }
  throw new Error("CoreTOC unavailable from all repos");
}

// ── Process raw TOC → TocData ─────────────────────────────────────────────────

export function processCoreTOC(
  toc: Record<string, Record<string, string>>,
  itemNameOverrides?: Map<number, string>,
): TocData {
  const affixes: TocAffix[] = [];
  for (const [sno, fname] of Object.entries(toc["104"] ?? {})) {
    if (AFFIX_SKIP.some((p) => fname.includes(p))) continue;
    affixes.push({ id: Number(sno), name: humanize(fname), cat: inferCat(fname), raw: fname });
  }

  const itemTypes: TocItemType[] = [];
  for (const [sno, name] of Object.entries(toc["98"] ?? {})) {
    itemTypes.push({ id: Number(sno), name: humanizeItemType(name) });
  }

  const items: TocItem[] = [];
  for (const [sno, fname] of Object.entries(toc["73"] ?? {})) {
    const id = Number(sno);
    const name = itemNameOverrides?.get(id) ?? humanizeItem(fname);
    items.push({ id, name });
  }

  return { affixes, itemTypes, items, ts: Date.now() };
}
