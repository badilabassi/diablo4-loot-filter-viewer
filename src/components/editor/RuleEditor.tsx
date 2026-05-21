import type { FilterRule } from "../../lib/schemas";
import { useEditorStore } from "../../store/editorStore";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ConditionEditor } from "./ConditionEditor";

const RULE_TYPES: [number, string][] = [
  [0, "Show"],
  [1, "Hide Text Label"],
  [2, "Recolor"],
  [3, "Hide All"],
];

const PRESET_COLORS = [
  "#bd9b4e",
  "#e822a8",
  "#4db8ff",
  "#ffffff",
  "#a06030",
  "#00c060",
  "#c8c020",
  "#ff4444",
  "#0000ff",
  "#c0c0c0",
];

interface Props {
  rule: FilterRule;
  index: number;
  total: number;
}

export function RuleEditor({ rule, index, total }: Props) {
  const {
    updateRule,
    removeRule,
    duplicateRule,
    addCondition,
    removeCondition,
    updateCondition,
    moveRule,
  } = useEditorStore();

  return (
    <div className="border border-d4-border rounded-md bg-d4-bg2">
      {/* Rule header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-d4-border">
        {/* Move up/down */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => moveRule(index, index - 1)}
            className="text-d4-text3 hover:text-d4-gold disabled:opacity-20 text-xs leading-none"
            title="Move up"
          >
            ▲
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => moveRule(index, index + 1)}
            className="text-d4-text3 hover:text-d4-gold disabled:opacity-20 text-xs leading-none"
            title="Move down"
          >
            ▼
          </button>
        </div>

        <span className="text-xs font-cinzel text-d4-text3 w-5 text-center">{index + 1}</span>

        {/* Name */}
        <input
          type="text"
          value={rule.name}
          maxLength={64}
          onChange={(e) => updateRule(index, { name: e.target.value })}
          className="flex-1 bg-transparent border-b border-transparent focus:border-d4-gold text-d4-text font-cinzel text-sm outline-none px-1 py-0.5"
          placeholder="Rule name"
        />

        {/* Rule type */}
        <Select
          value={String(rule.type)}
          onValueChange={(v) => updateRule(index, { type: Number(v) })}
        >
          <SelectTrigger className="w-36 h-7 text-xs font-cinzel bg-d4-bg border-d4-border text-d4-text2 focus:ring-d4-gold/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-d4-bg2 border-d4-border text-d4-text">
            {RULE_TYPES.map(([v, l]) => (
              <SelectItem
                key={v}
                value={String(v)}
                className="text-xs font-cinzel text-d4-text focus:bg-d4-gold/10 focus:text-d4-gold2"
              >
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Color swatch + native color picker overlay */}
        <div className="relative">
          <div
            className="w-5 h-5 rounded border border-d4-border cursor-pointer"
            style={{ background: rule.color.isDefault ? "#0000ff" : rule.color.hex }}
            title="Color"
          />
          <input
            type="color"
            value={rule.color.isDefault ? "#0000ff" : rule.color.hex}
            onChange={(e) =>
              updateRule(index, { color: { hex: e.target.value, isDefault: false } })
            }
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>

        {/* Enabled toggle */}
        <div className="flex items-center gap-1.5 cursor-pointer select-none" title="Enabled">
          <Checkbox
            checked={rule.enabled}
            onCheckedChange={(v) => updateRule(index, { enabled: !!v })}
            className="border-d4-border2 data-[state=checked]:bg-d4-gold data-[state=checked]:border-d4-gold h-3.5 w-3.5"
          />
          <span className="text-xs text-d4-text3">On</span>
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={() => duplicateRule(index)}
          className="text-d4-text3 hover:text-d4-gold text-xs px-1"
          title="Duplicate rule"
        >
          ⧉
        </button>
        <button
          type="button"
          onClick={() => removeRule(index)}
          className="text-d4-text3 hover:text-red-400 text-base leading-none px-1"
          title="Remove rule"
        >
          ×
        </button>
      </div>

      {/* Color presets */}
      <div className="flex gap-1 px-3 py-1.5 border-b border-d4-border">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => updateRule(index, { color: { hex: c, isDefault: false } })}
            className="w-4 h-4 rounded border border-d4-border/60 hover:scale-110 transition-transform"
            style={{ background: c }}
            title={c}
          />
        ))}
        <button
          type="button"
          onClick={() => updateRule(index, { color: { hex: "#0000ff", isDefault: true } })}
          className="text-xs text-d4-text3 hover:text-d4-gold font-cinzel uppercase tracking-wide ml-1"
          title="Reset to default color"
        >
          default
        </button>
      </div>

      {/* Conditions */}
      <div className="p-3 space-y-2">
        {rule.conditions.length === 0 && (
          <p className="text-xs text-d4-text3 italic">No conditions — rule matches all items.</p>
        )}
        {rule.conditions.map((cond, ci) => (
          <ConditionEditor
            // biome-ignore lint/suspicious/noArrayIndexKey: conditions have no stable IDs
            key={ci}
            cond={cond}
            onChange={(patch) => updateCondition(index, ci, patch)}
            onRemove={() => removeCondition(index, ci)}
          />
        ))}
        <button
          type="button"
          onClick={() => addCondition(index)}
          className="btn-secondary text-xs w-full"
        >
          + Add Condition
        </button>
      </div>
    </div>
  );
}
