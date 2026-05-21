import { temporal } from "zundo";
import { create } from "zustand";
import { serializeFilter } from "../lib/proto";
import type { FilterCondition, FilterRule, ParsedFilter } from "../lib/schemas";

interface EditorState {
  filter: ParsedFilter;
  exportedB64: string | null;

  // Filter-level
  setFilterName: (name: string) => void;

  // Rule-level
  addRule: () => void;
  duplicateRule: (index: number) => void;
  removeRule: (index: number) => void;
  updateRule: (index: number, patch: Partial<Omit<FilterRule, "conditions">>) => void;
  moveRule: (from: number, to: number) => void;

  // Condition-level
  addCondition: (ruleIndex: number) => void;
  removeCondition: (ruleIndex: number, condIndex: number) => void;
  updateCondition: (ruleIndex: number, condIndex: number, patch: Partial<FilterCondition>) => void;

  // Export
  exportFilter: () => string;
  clearExport: () => void;
}

const BLANK_CONDITION: FilterCondition = {
  filterType: 1,
  qualityFlags: 16,
  subtypeIds: [],
  affixIds: [],
  itemIds: [],
};

const BLANK_RULE: FilterRule = {
  name: "New Rule",
  type: 0,
  color: { hex: "#b8841e", isDefault: false },
  enabled: true,
  conditions: [{ ...BLANK_CONDITION }],
};

const BLANK_FILTER: ParsedFilter = {
  name: "My Filter",
  rules: [{ ...BLANK_RULE, conditions: [{ ...BLANK_CONDITION }] }],
};

function patchRule(
  filter: ParsedFilter,
  index: number,
  fn: (r: FilterRule) => FilterRule,
): ParsedFilter {
  const rules = [...filter.rules];
  rules[index] = fn(rules[index]);
  return { ...filter, rules };
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      filter: structuredClone(BLANK_FILTER),
      exportedB64: null,

      setFilterName: (name) => set((s) => ({ filter: { ...s.filter, name } })),

      addRule: () =>
        set((s) => ({
          filter: {
            ...s.filter,
            rules: [...s.filter.rules, structuredClone(BLANK_RULE)],
          },
        })),

      duplicateRule: (index) =>
        set((s) => {
          const rules = [...s.filter.rules];
          const copy = structuredClone(rules[index]);
          copy.name = `${copy.name} (copy)`;
          rules.splice(index + 1, 0, copy);
          return { filter: { ...s.filter, rules } };
        }),

      removeRule: (index) =>
        set((s) => ({
          filter: { ...s.filter, rules: s.filter.rules.filter((_, i) => i !== index) },
        })),

      updateRule: (index, patch) =>
        set((s) => ({
          filter: patchRule(s.filter, index, (r) => ({ ...r, ...patch })),
        })),

      moveRule: (from, to) =>
        set((s) => {
          const rules = [...s.filter.rules];
          const [moved] = rules.splice(from, 1);
          rules.splice(to, 0, moved);
          return { filter: { ...s.filter, rules } };
        }),

      addCondition: (ruleIndex) =>
        set((s) => ({
          filter: patchRule(s.filter, ruleIndex, (r) => ({
            ...r,
            conditions: [...r.conditions, structuredClone(BLANK_CONDITION)],
          })),
        })),

      removeCondition: (ruleIndex, condIndex) =>
        set((s) => ({
          filter: patchRule(s.filter, ruleIndex, (r) => ({
            ...r,
            conditions: r.conditions.filter((_, i) => i !== condIndex),
          })),
        })),

      updateCondition: (ruleIndex, condIndex, patch) =>
        set((s) => ({
          filter: patchRule(s.filter, ruleIndex, (r) => {
            const conditions = [...r.conditions];
            conditions[condIndex] = { ...conditions[condIndex], ...patch };
            return { ...r, conditions };
          }),
        })),

      exportFilter: () => {
        const b64 = serializeFilter(get().filter);
        set({ exportedB64: b64 });
        return b64;
      },

      clearExport: () => set({ exportedB64: null }),
    }),
    { partialize: (s) => ({ filter: s.filter }) },
  ),
);

export function loadFilterIntoEditor(filter: ParsedFilter) {
  useEditorStore.setState({ filter: structuredClone(filter), exportedB64: null });
  useEditorStore.temporal.getState().clear();
}
