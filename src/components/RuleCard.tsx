import { memo, useState } from "react";
import { TAG_CLASSES } from "../lib/constants";
import type { FilterRule } from "../lib/types";
import { ConditionBlock } from "./ConditionBlock";

interface Tag {
  key: string;
  label: string;
}

function inferTags(rule: FilterRule): Tag[] {
  const n = rule.name.toLowerCase();
  const tags: Tag[] = [];
  if (n.includes("mythic")) tags.push({ key: "mythic", label: "Mythic" });
  if (n.includes("unique")) tags.push({ key: "unique", label: "Unique" });
  if (n.includes("leg")) tags.push({ key: "leg", label: "Legendary" });
  if (n.includes("set")) tags.push({ key: "set", label: "Set" });
  if (n.includes("ancestral")) tags.push({ key: "ancestral", label: "Ancestral" });
  if (n.includes(" ga") || n.includes("greater affix")) tags.push({ key: "ga", label: "GA" });
  if (n.includes("codex")) tags.push({ key: "codex", label: "Codex" });
  if (n.includes("select")) tags.push({ key: "select", label: "SELECT" });
  if (rule.type === 1) tags.push({ key: "hidetext", label: "Hide Text" });
  if (rule.type === 2) tags.push({ key: "recolor", label: "Recolor" });
  if (rule.type === 3) tags.push({ key: "hide", label: "Hide All" });
  return tags;
}

interface Props {
  rule: FilterRule;
  delay: number;
}

export const RuleCard = memo(function RuleCard({ rule, delay }: Props) {
  const [open, setOpen] = useState(false);

  const swatchColor = rule.color.isDefault ? "#4060c0" : rule.color.hex;
  const highlightHex = rule.color.isDefault ? "#0000FF" : rule.color.hex;
  const tags = inferTags(rule);

  return (
    <div
      className={["card animate-fade-in", open ? "card-open" : ""]
        .filter(Boolean)
        .join(" ")}
      style={{ animationDelay: `${Math.min(delay, 600)}ms` }}
    >
      {/* ── Header ── */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer select-none group"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Color swatch */}
        <span
          className="size-3 rounded-full shrink-0 ring-1 ring-white/10"
          style={{ background: swatchColor, boxShadow: `0 0 8px ${swatchColor}88` }}
        />

        {/* Enabled dot */}
        <span
          className="size-1.5 rounded-full shrink-0"
          style={{
            background: rule.enabled ? "#4caf50" : "#3a3a3a",
            boxShadow: rule.enabled ? "0 0 5px #4caf5088" : "none",
          }}
          title={rule.enabled ? "Enabled" : "Disabled"}
        />

        {/* Name */}
        <span
          className="font-cinzel text-md font-semibold tracking-[.03em] flex-1 leading-tight text-d4-text"
        >
          {rule.name.trim() || (rule.type === 3 ? "HIDE ALL" : rule.type === 1 ? "HIDE TEXT LABEL" : "—")}
        </span>

        {/* Tags */}
        {tags.length > 0 && (
          <span className="flex gap-1.5 flex-wrap items-center">
            {tags.map((t) => (
              <span key={t.key} className={`text-xs tag ${TAG_CLASSES[t.key] ?? ""}`}>
                {t.label}
              </span>
            ))}
          </span>
        )}

        {/* Condition count badge */}
        {rule.conditions.length > 0 && (
          <span className="font-cinzel text-xs text-d4-text3 bg-d4-bg px-1.5 py-0.5 rounded-full border border-d4-border shrink-0">
            {rule.conditions.length}
          </span>
        )}

        {/* Chevron */}
        <span
          className="text-d4-text3 text-xs shrink-0 transition-transform duration-200 group-hover:text-d4-gold2"
          style={{ transform: open ? "rotate(90deg)" : undefined }}
        >
          ›
        </span>
      </button>

      {/* ── Body ── */}
      {open && (
        <div
          className="border-t px-4 py-4 animate-slide-down"
          style={{ borderColor: "rgba(175,135,50,0.12)", background: "rgba(0,0,0,0.25)" }}
        >
          {/* Meta row */}
          <div
            className="flex items-center gap-5 flex-wrap mb-4 pb-3 border-b"
            style={{ borderColor: "rgba(175,135,50,0.1)" }}
          >
            <div className="flex items-center gap-2">
              <span className="meta-label">Status</span>
              <span
                className="text-xs font-cinzel font-semibold"
                style={{ color: rule.enabled ? "#4caf50" : "#666" }}
              >
                {rule.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="meta-label">Color</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-4 rounded-full ring-1 ring-white/15 shrink-0"
                  style={{ background: highlightHex, boxShadow: `0 0 8px ${highlightHex}66` }}
                />
                <code className="text-xs text-d4-text2 font-mono">
                  {highlightHex.toUpperCase()}
                </code>
              </span>
            </div>
          </div>

          {rule.conditions.length === 0 ? (
            <em className="text-xs text-d4-text3">No conditions decoded</em>
          ) : (
            <div className="space-y-2">
              {rule.conditions.map((c, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: conditions have no stable IDs
                <ConditionBlock key={i} cond={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
