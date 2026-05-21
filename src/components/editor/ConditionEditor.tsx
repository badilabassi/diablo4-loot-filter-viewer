import { useLiveQuery } from "@tanstack/react-db";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { affixCollection, itemCollection, itemTypeCollection } from "../../lib/collections";
import { COND_TYPES, QUALITY_FLAGS, QUALITY_TIERS } from "../../lib/constants";
import type { FilterCondition } from "../../lib/schemas";
import { cn } from "../../lib/utils";
import { Checkbox } from "../ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Props {
  cond: FilterCondition;
  onChange: (patch: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

// ── Generic Command-based multi-select picker ─────────────────────────────────

interface PickerItem {
  id: number;
  label: string;
  sub?: string;
}

function MultiCommandPicker({
  items,
  selected,
  onChange,
  placeholder,
  pillColor,
}: {
  items: PickerItem[];
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder: string;
  pillColor?: string;
}) {
  const [open, setOpen] = useState(false);

  const itemsById = useMemo(() => new Map(items.map((x) => [x.id, x])), [items]);
  const selectedItems = useMemo(
    () =>
      selected.map(
        (id) => itemsById.get(id) ?? { id, label: `0x${id.toString(16).toUpperCase()}` },
      ),
    [selected, itemsById],
  );

  return (
    <div className="space-y-1.5">
      {/* Selected pills */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs",
                pillColor ? "" : "border-d4-border2 bg-d4-bg text-d4-text2",
              )}
              style={
                pillColor
                  ? {
                      color: pillColor,
                      borderColor: `${pillColor}55`,
                      background: `${pillColor}10`,
                    }
                  : undefined
              }
            >
              {item.label}
              <button
                type="button"
                className="opacity-60 hover:opacity-100 ml-0.5 leading-none"
                onClick={() => onChange(selected.filter((x) => x !== item.id))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="w-full flex items-center justify-between px-2 py-1 rounded border border-d4-border bg-d4-bg text-xs text-d4-text3 hover:border-d4-gold hover:text-d4-gold2 transition-colors">
          <span>{placeholder}</span>
          <span className="opacity-40 text-xs">▼</span>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 border-d4-border bg-d4-bg2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          style={{ width: "320px" }}
          align="start"
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder={placeholder}
              className="font-cinzel text-xs text-d4-text2 h-9"
            />
            <CommandList className="max-h-[240px]">
              <CommandEmpty className="text-xs text-d4-text3 py-4">No results found.</CommandEmpty>
              <CommandGroup>
                {items
                  .filter((it) => !selected.includes(it.id))
                  .map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.label}
                      onSelect={() => {
                        onChange([...selected, item.id]);
                        setOpen(false);
                      }}
                      className="text-xs text-d4-text2 data-[selected=true]:bg-d4-gold/10 data-[selected=true]:text-d4-gold2 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3 w-3 shrink-0",
                          selected.includes(item.id) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.sub && <span className="ml-2 text-d4-text3 text-xs">{item.sub}</span>}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── ItemType picker ───────────────────────────────────────────────────────────

function ItemTypePicker({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const { data } = useLiveQuery((q) => q.from({ it: itemTypeCollection }), []);
  const items: PickerItem[] = (data ?? []).map((it) => ({ id: it.id, label: it.name }));
  return (
    <MultiCommandPicker
      items={items}
      selected={selected}
      onChange={onChange}
      placeholder="Add item type…"
    />
  );
}

// ── Affix picker ──────────────────────────────────────────────────────────────

function AffixPicker({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const { data } = useLiveQuery((q) => q.from({ a: affixCollection }), []);
  const items: PickerItem[] = (data ?? []).map((a) => ({ id: a.id, label: a.name, sub: a.cat }));
  return (
    <MultiCommandPicker
      items={items}
      selected={selected}
      onChange={onChange}
      placeholder="Add affix…"
    />
  );
}

// ── Item picker ───────────────────────────────────────────────────────────────

function ItemPicker({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const { data } = useLiveQuery((q) => q.from({ it: itemCollection }), []);
  const items: PickerItem[] = (data ?? []).map((it) => ({ id: it.id, label: it.name }));
  return (
    <MultiCommandPicker
      items={items}
      selected={selected}
      onChange={onChange}
      placeholder="Add item…"
      pillColor="#ef972f"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ConditionEditor({ cond, onChange, onRemove }: Props) {
  return (
    <div className="border border-d4-border rounded bg-d4-bg p-3 space-y-2">
      <div className="flex items-center gap-2">
        {/* Condition type */}
        <Select
          value={String(cond.filterType)}
          onValueChange={(v) => {
            const ft = Number(v);
            onChange({
              filterType: ft,
              qualityFlags: ft === 1 ? 16 : undefined,
              minPower: undefined,
              maxPower: undefined,
              minQualityTier: ft === 2 ? 4 : undefined,
              minGaCount: ft === 4 ? 1 : undefined,
              subtypeIds: [],
              affixIds: [],
              itemIds: [],
              minGaFromList: ft === 6 ? 1 : undefined,
            });
          }}
        >
          <SelectTrigger className="flex-1 h-8 text-xs font-cinzel bg-d4-bg2 border-d4-border text-d4-text focus:ring-d4-gold/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-d4-bg2 border-d4-border text-d4-text">
            {Object.entries(COND_TYPES).map(([k, v]) => (
              <SelectItem
                key={k}
                value={k}
                className="text-xs font-cinzel text-d4-text focus:bg-d4-gold/10 focus:text-d4-gold2"
              >
                {v.icon} {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          className="text-d4-text3 hover:text-red-400 text-lg leading-none px-1 shrink-0"
          onClick={onRemove}
          title="Remove condition"
        >
          ×
        </button>
      </div>

      {/* filterType=0 — Item Power */}
      {cond.filterType === 0 && (
        <div className="flex gap-3 items-center flex-wrap">
          <label className="flex items-center gap-2">
            <span className="text-xs text-d4-text3 font-cinzel uppercase tracking-wide">
              Min Power
            </span>
            <input
              type="number"
              value={cond.minPower ?? ""}
              min={0}
              max={2000}
              onChange={(e) =>
                onChange({ minPower: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-24 bg-d4-bg2 border border-d4-border rounded text-xs px-2 py-1 text-d4-text2 outline-none focus:border-d4-gold"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-d4-text3 font-cinzel uppercase tracking-wide">
              Max Power
            </span>
            <input
              type="number"
              value={cond.maxPower ?? ""}
              min={0}
              max={2000}
              onChange={(e) =>
                onChange({ maxPower: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-24 bg-d4-bg2 border border-d4-border rounded text-xs px-2 py-1 text-d4-text2 outline-none focus:border-d4-gold"
            />
          </label>
        </div>
      )}

      {/* filterType=1 — Rarity flags */}
      {cond.filterType === 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {QUALITY_FLAGS.map(([flag, name, color]) => {
            const checked = ((cond.qualityFlags ?? 0) & flag) !== 0;
            return (
              <div
                key={flag}
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => {
                  const cur = cond.qualityFlags ?? 0;
                  onChange({ qualityFlags: checked ? cur & ~flag : cur | flag });
                }}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    const cur = cond.qualityFlags ?? 0;
                    onChange({ qualityFlags: v ? cur | flag : cur & ~flag });
                  }}
                  className="border-d4-border2 data-[state=checked]:bg-d4-gold data-[state=checked]:border-d4-gold pointer-events-none"
                />
                <span className="text-xs font-cinzel" style={{ color }}>
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* filterType=2 — Quality Tier */}
      {cond.filterType === 2 && (
        <div className="flex gap-3 items-center">
          <span className="text-xs text-d4-text3 font-cinzel uppercase tracking-wide shrink-0">
            Min Tier
          </span>
          <Select
            value={String(cond.minQualityTier ?? 0)}
            onValueChange={(v) => onChange({ minQualityTier: Number(v) })}
          >
            <SelectTrigger className="h-8 text-xs font-cinzel bg-d4-bg2 border-d4-border text-d4-text focus:ring-d4-gold/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-d4-bg2 border-d4-border text-d4-text">
              {Object.entries(QUALITY_TIERS).map(([k, v]) => (
                <SelectItem
                  key={k}
                  value={k}
                  className="text-xs font-cinzel text-d4-text focus:bg-d4-gold/10 focus:text-d4-gold2"
                >
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-d4-text3">and above</span>
        </div>
      )}

      {/* filterType=3 — Codex Upgrade */}
      {cond.filterType === 3 && (
        <p className="text-xs text-d4-text3 italic">
          Matches items with a Codex of Power upgrade available.
        </p>
      )}

      {/* filterType=4 — GA Count */}
      {cond.filterType === 4 && (
        <label className="flex items-center gap-2">
          <span className="text-xs text-d4-text3 font-cinzel uppercase tracking-wide">Min GAs</span>
          <input
            type="number"
            value={cond.minGaCount ?? 1}
            min={1}
            max={3}
            onChange={(e) => onChange({ minGaCount: Number(e.target.value) })}
            className="w-16 bg-d4-bg2 border border-d4-border rounded text-xs px-2 py-1 text-d4-text2 outline-none focus:border-d4-gold"
          />
        </label>
      )}

      {/* filterType=5 — Item Subtype */}
      {cond.filterType === 5 && (
        <ItemTypePicker
          selected={cond.subtypeIds}
          onChange={(ids) => onChange({ subtypeIds: ids })}
        />
      )}

      {/* filterType=6 — Affixes with GA */}
      {cond.filterType === 6 && (
        <div className="space-y-2">
          <AffixPicker selected={cond.affixIds} onChange={(ids) => onChange({ affixIds: ids })} />
          <label className="flex items-center gap-2">
            <span className="text-xs text-d4-text3 font-cinzel uppercase tracking-wide">
              Min GA from list
            </span>
            <input
              type="number"
              value={cond.minGaFromList ?? 1}
              min={1}
              max={3}
              onChange={(e) => onChange({ minGaFromList: Number(e.target.value) })}
              className="w-16 bg-d4-bg2 border border-d4-border rounded text-xs px-2 py-1 text-d4-text2 outline-none focus:border-d4-gold"
            />
          </label>
        </div>
      )}

      {/* filterType=8 — Specific Items or Is Ancestral */}
      {cond.filterType === 8 && (
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => onChange({ itemIds: [] })}
          >
            <Checkbox
              checked={cond.itemIds.length === 0}
              onCheckedChange={(v) => {
                if (v) onChange({ itemIds: [] });
              }}
              className="border-d4-border2 data-[state=checked]:bg-[#e822a8] data-[state=checked]:border-[#e822a8] pointer-events-none"
            />
            <span className="text-xs font-cinzel" style={{ color: "#e822a8" }}>
              Is Ancestral (no specific items)
            </span>
          </div>
          <ItemPicker selected={cond.itemIds} onChange={(ids) => onChange({ itemIds: ids })} />
        </div>
      )}
    </div>
  );
}
