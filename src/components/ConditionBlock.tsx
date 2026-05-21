import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import { itemCollection, itemTypeCollection } from "../lib/collections";
import { COND_TYPES, ITEM_TYPES, QUALITY_FLAGS, QUALITY_TIERS } from "../lib/constants";
import type { FilterCondition } from "../lib/types";
import { AffixChip } from "./AffixChip";

interface Props {
  cond: FilterCondition;
}

export function ConditionBlock({ cond }: Props) {
  const ct = COND_TYPES[cond.filterType] ?? { label: `Filter ${cond.filterType}`, icon: "?" };

  const qMatched =
    cond.qualityFlags != null
      ? QUALITY_FLAGS.filter(([flag]) => ((cond.qualityFlags ?? 0) & flag) !== 0)
      : [];

  const uniqueAffixes = useMemo(() => [...new Set(cond.affixIds)], [cond.affixIds]);
  const uniqueSubtypes = useMemo(() => [...new Set(cond.subtypeIds)], [cond.subtypeIds]);
  const uniqueItemIds = useMemo(() => [...new Set(cond.itemIds)], [cond.itemIds]);

  // Live item type names from TanStack DB (falls back to static ITEM_TYPES)
  const { data: liveItemTypes } = useLiveQuery((q) => q.from({ it: itemTypeCollection }), []);
  const liveItMap = useMemo(
    () => new Map((liveItemTypes ?? []).map((e) => [e.id, e.name])),
    [liveItemTypes],
  );

  // Live specific item names from TanStack DB (group 73 — Uniques / Mythic Uniques)
  const { data: liveItems } = useLiveQuery((q) => q.from({ it: itemCollection }), []);
  const liveItemMap = useMemo(
    () => new Map((liveItems ?? []).map((e) => [e.id, e.name])),
    [liveItems],
  );

  const hasContent =
    qMatched.length > 0 ||
    uniqueAffixes.length > 0 ||
    uniqueSubtypes.length > 0 ||
    uniqueItemIds.length > 0 ||
    cond.minPower != null ||
    cond.minQualityTier != null ||
    cond.minGaCount != null;

  return (
    <div className="cond-block">
      <div className="flex items-center gap-2 mb-2 font-cinzel text-sm tracking-widest uppercase text-d4-gold">
        <span>{ct.icon}</span>
        <span>{ct.label}</span>
        <span className="flex-1 h-px bg-d4-border" />
      </div>

      {/* filterType=1 — rarity bit-flags → pills */}
      {qMatched.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {qMatched.map(([, name, color]) => (
            <span
              key={name}
              className="px-2 py-0.5 rounded-full text-sm font-cinzel font-bold border"
              style={{ color, borderColor: color, background: `${color}18` }}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* filterType=2 — min quality tier */}
      {cond.minQualityTier != null && (
        <p className="text-sm text-d4-text2 mt-1">
          Min quality:{" "}
          <strong className="text-d4-gold2">
            {QUALITY_TIERS[cond.minQualityTier] ?? `Tier ${cond.minQualityTier}`}
          </strong>
          <span className="text-d4-text3 ml-1">(and above)</span>
        </p>
      )}

      {/* filterType=0 — min item power */}
      {cond.minPower != null && (
        <p className="text-d4-text2 text-sm mt-1">
          Min Item Power: <strong className="text-d4-gold2">{cond.minPower}</strong>
        </p>
      )}

      {/* filterType=4 — min GA count */}
      {cond.minGaCount != null && (
        <p className="text-sm text-d4-text2 mt-1">
          Min Greater Affixes: <strong className="text-d4-gold2">{cond.minGaCount}</strong>
        </p>
      )}

      {/* filterType=5 — item subtype chips */}
      {uniqueSubtypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {uniqueSubtypes.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-sm text-d4-text border-d4-border2 bg-d4-bg"
              title={`ItemType SNO: 0x${id.toString(16).toUpperCase()}`}
            >
              {liveItMap.get(id) ?? ITEM_TYPES[id] ?? (
                <>
                  <em className="text-xs opacity-60">Unknown type</em>
                  <span className="font-mono text-xs text-d4-text3">
                    0x{id.toString(16).toUpperCase()}
                  </span>
                </>
              )}
            </span>
          ))}
        </div>
      )}

      {/* filterType=6 — affix SNO chips */}
      {uniqueAffixes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {uniqueAffixes.map((id) => (
            <AffixChip key={id} snoId={id} />
          ))}
        </div>
      )}

      {/* filterType=8 — specific item whitelist (Uniques / Mythic Uniques), or Is Ancestral */}
      {cond.filterType === 8 && uniqueItemIds.length === 0 && (
        <p className="text-sm text-d4-text2 mt-1">
          <strong className="text-d4-unique text-shadow-lg text-shadow-d4-ancestral/20">Is Ancestral</strong>
        </p>
      )}
      {uniqueItemIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {uniqueItemIds.map((id) => {
            const name = liveItemMap.get(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-sm text-d4-unique border-d4-unique/30 bg-d4-unique/10"
                title={`Item SNO: 0x${id.toString(16).toUpperCase()}`}
              >
                {name ?? (
                  <>
                    <em className="text-xs opacity-60">Unknown item</em>
                    <span className="font-mono text-xs opacity-60">
                      0x{id.toString(16).toUpperCase()}
                    </span>
                  </>
                )}
              </span>
            );
          })}
        </div>
      )}

      {!hasContent && <em className="text-xs text-d4-text3">Condition active</em>}
    </div>
  );
}
