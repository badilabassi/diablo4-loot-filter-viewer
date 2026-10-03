import type { AffixCategory } from './schemas.ts'

/**
 * Quality tier index (used by filterType=2 / Ancestral filter).
 * This is a 0-indexed enum, NOT bit-flags like QUALITY_FLAGS.
 */
export const QUALITY_TIERS: Record<number, string> = {
  0: "Common",
  1: "Magic",
  2: "Rare",
  3: "Sacred",
  4: "Ancestral",
  5: "Unique",
  6: "Mythic Unique",
};

export const QUALITY_FLAGS = [
  [1, "Common", "#c0c0c0"],
  [2, "Magic", "#7c7cfb"],
  [4, "Rare", "#ff0"],
  [8, "Legendary", "#ff8000"],
  [16, "Unique", "#dca779"],
  [32, "Mythic Unique", "#cda1d8"],
  [64, "Talisman Set(s)", "#50d839"],
] as const;

/**
 * ItemType SNO IDs → human-readable names.
 * Source: CoreTOC_flat.json (group 98) from DiabloTools/d4data.
 * These appear in filterType=5 (Item Subtype) conditions as field-2 fixed32 values.
 */
export const ITEM_TYPES: Record<number, string> = {
  446650: "Any Gear", // 0x6D0BA
  446778: "Mace", // 0x6D13A
  446788: "2H Mace", // 0x6D144
  446794: "2H Mace (Druid)", // 0x6D14A
  446796: "Sword", // 0x6D14C
  446799: "2H Sword", // 0x6D14F
  446801: "Axe", // 0x6D151
  446802: "2H Axe", // 0x6D152
  446803: "Staff", // 0x6D153
  446804: "Scythe", // 0x6D154
  446805: "2H Scythe", // 0x6D155
  446809: "Dagger", // 0x6D159
  446810: "Dagger (Off-Hand)", // 0x6D15A
  446813: "Polearm", // 0x6D15D
  446819: "Wand", // 0x6D163
  446823: "Bow", // 0x6D167
  446824: "Crossbow", // 0x6D168
  446825: "2H Crossbow", // 0x6D169
  446826: "Focus", // 0x6D16A
  446827: "Off-Hand Totem", // 0x6D16B
  446829: "Chest", // 0x6D16D
  446830: "Helm", // 0x6D16E
  446831: "Legs", // 0x6D16F
  446832: "Boots", // 0x6D170
  446833: "Gloves", // 0x6D171
  446834: "Shield", // 0x6D172
  446836: "Ring", // 0x6D174
  446837: "Amulet", // 0x6D175
  446839: "Gem", // 0x6D177
  446840: "Rune", // 0x6D178
  446841: "Rune (Condition)", // 0x6D179
  446842: "Rune (Effect)", // 0x6D17A
  446843: "Consumable", // 0x6D17B
  446845: "Health Potion", // 0x6D17D
  446846: "Gold", // 0x6D17E
  446847: "Collectible", // 0x6D17F
  446848: "Currency", // 0x6D180
  446851: "Quest Item", // 0x6D183
  446853: "Tome", // 0x6D185
  446856: "Crafting Reagent", // 0x6D188
  446857: "Crafting Recipe", // 0x6D189
  446859: "Dungeon Key", // 0x6D18B
  446860: "Elixir", // 0x6D18C
  446862: "Mount", // 0x6D18E
  446866: "Trophy", // 0x6D192
  733643: "Paragon Glyph", // 0xB31CB
  1462897: "Glaive", // 0x165271
  1495597: "Quarterstaff", // 0x16D22D
  1567587: "Staff (Druid)", // 0x17EB63
  1567589: "Staff (Sorc)", // 0x17EB65
  1871482: "Temper Manual", // 0x1C8E7A
  2105299: "Spear (Amazon)", // 0x201FD3
  2105304: "Shield (Amazon)", // 0x201FD8
  2148778: "Shield (HTH)", // 0x20C9AA
  2175824: "Seasonal Socketable", // 0x213350
  2237261: "Horadric Power", // 0x22234D
  2288901: "Charm", // 0x22ED05
  2292304: "Fish", // 0x22FA50
  2299642: "Junk", // 0x2316FA
  2312856: "Flail", // 0x234A98
  2326144: "Horadric Seal", // 0x237E80
  2360642: "Horadric Elixir", // 0x240542
};

export const COND_TYPES: Record<number, { label: string; icon: string }> = {
  0: { label: "Item Power", icon: "⚔" },
  1: { label: "Item Rarity", icon: "✦" },
  2: { label: "Quality Tier", icon: "💎" },
  3: { label: "Codex Upgrade", icon: "📖" },
  4: { label: "Greater Affix Count", icon: "⭐" },
  5: { label: "Item Subtype", icon: "🔷" },
  6: { label: "Greater Affixes", icon: "⭐" },
  7: { label: "Optional Affixes", icon: "☆" },
  8: { label: "Specific Items", icon: "🔱" },
  9: { label: "Talisman Set Bonus", icon: "🎴" },
};

export const CAT_CLASSES: Record<AffixCategory, string> = {
  stat: "text-d4-stat border-d4-stat/25 bg-d4-stat/8",
  offense: "text-d4-offense border-d4-offense/25 bg-d4-offense/8",
  defense: "text-d4-defense border-d4-defense/25 bg-d4-defense/8",
  utility: "text-d4-utility border-d4-utility/25 bg-d4-utility/8",
};

export const TAG_CLASSES: Record<string, string> = {
  mythic: "text-d4-mythic border-d4-mythic/60 bg-d4-mythic/5",
  unique: "text-d4-unique border-d4-unique/60 bg-d4-unique/5",
  leg: "text-d4-leg border-d4-leg/60 bg-d4-leg/5",
  set: "text-d4-set border-d4-set/60 bg-d4-set/5",
  ga: "text-d4-ga border-d4-ga/60 bg-d4-ga/5",
  ancestral:
    "text-d4-ancestral border-d4-ancestral/60 bg-d4-ancestral/5 inset-shadow-sm inset-shadow-d4-ancestral/20",
  codex: "text-blue-300 border-blue-300/60 bg-blue-300/5",
  select: "text-d4-gold2 border-d4-gold2/60 bg-d4-gold2/5",
  hidetext: "text-orange-400 border-orange-400/60 bg-orange-400/5",
  recolor: "text-purple-400 border-purple-400/60 bg-purple-400/5",
  hide: "text-red-400 border-red-400/60 bg-red-400/5",
};

export const EXAMPLE_FILTER =
  "CiQKE0V2ZXJ5IE15dGhpYyBVbmlxdWUQAB3oIqj/IgQIASAgKAEKIwoSQWxsIENvZGV4IFVwZ3JhZGVzEAAdAAD//yIECAMwASgBCjIKGExlZy9VbmlxdWUvTXl0aGljIENoYXJtcxAAHQAA//8iBwgFFQXtIgAiBAgBIDgoAQoxChNTZXQgQ2hhcm1zIChTRUxFQ1QpEAAdAAD//yICCAkiBwgFFQXtIgAiBAgBIEAoAQooCg5BbGwgU2V0IENoYXJtcxAAHQAA//8iBwgFFQXtIgAiBAgBIEAoAQoxChdMZWcvVW5pcXVlL015dGhpYyBTZWFscxAAHQAA//8iBwgFFYB+IwAiBAgBIHgoAQo1ChZTYWx2YWdlIFNlYWxzICYgQ2hhcm1zEAAdAAD//yIMCAUVgH4jABUF7SIAIgQIASAEKAEKHwoQVW5pcXVlcyAoU0VMRUNUKRACHa7oIv8iAggIKAEKHAoLQWxsIFVuaXF1ZXMQAB0AAP//IgQIASAQKAEKNwoVU3BlY2lmaWMgR0FzIChTRUxFQ1QpEAAdAAD//yIVCAYV9wonABoKDfcKJwAV9wonACABKAEKYgoNTWFpbiBTdGF0IEdBcxAAHQAA//8iSAgGFcLqGwAVxuobABW66hsAFb7qGwAaCg3C6hsAFcLqGwAaCg3G6hsAFcbqGwAaCg266hsAFbrqGwAaCg2+6hsAFb7qGwAgASgBCo0CCg1Vbml2ZXJzYWwgR0FzEAAdAAD//yLyAQgGFTFuHQAVzuobABU4/RsAFbjqGwAV3uobABWy6hsAFQo8JwAVtOobABWA/BsAFZP8JwAVY24dABXY6hsAFdTqGwAV0uobABoKDTFuHQAVMW4dABoKDc7qGwAVzuobABoKDTj9GwAVOP0bABoKDbjqGwAVuOobABoKDd7qGwAV3uobABoKDbLqGwAVsuobABoKDQo8JwAVCjwnABoKDbTqGwAVtOobABoKDWNuHQAVY24dABoKDZP8JwAVk/wnABoKDYD8GwAVgPwbABoKDdjqGwAV2OobABoKDdTqGwAV1OobABoKDdLqGwAV0uobACABKAEKJgoTQWxsIEdyZWF0ZXIgQWZmaXhlcxAAHQAA//8iBggEIAEwASgBCh8KDkFsbCBBbmNlc3RyYWxzEAAdAAD//yIECAIgBCgBCjgKF1doaXRlcyBUbyBDdWJlIChTRUxFQ1QpEAAdAAD//yIFCAAg0gYiBwgFFVnRBgAiBAgBIAEoAQoMCgEgEAMdAAD//ygBEhhSYXh4J3MgVG9ybWVudCA2KyBGaWx0ZXIYASAB";
