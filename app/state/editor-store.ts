import { serializeFilter } from '../filter/proto.ts'
import type { FilterCondition, FilterRule, ParsedFilter } from '../filter/schemas.ts'
import { createTemporalStore } from './subscribe.ts'

interface EditorState {
  filter: ParsedFilter
  exportedB64: string | null
}

const BLANK_CONDITION: FilterCondition = {
  filterType: 1,
  qualityFlags: 16,
  subtypeIds: [],
  affixIds: [],
  itemIds: [],
  talismanSetIds: [],
}

const BLANK_RULE: FilterRule = {
  name: 'New Rule',
  type: 0,
  color: { hex: '#b8841e', isDefault: false },
  enabled: true,
  conditions: [{ ...BLANK_CONDITION }],
}

const BLANK_FILTER: ParsedFilter = {
  name: 'My Filter',
  rules: [{ ...BLANK_RULE, conditions: [{ ...BLANK_CONDITION }] }],
}

function patchRule(
  filter: ParsedFilter,
  index: number,
  fn: (r: FilterRule) => FilterRule,
): ParsedFilter {
  const rules = [...filter.rules]
  rules[index] = fn(rules[index]!)
  return { ...filter, rules }
}

const store = createTemporalStore<EditorState>(
  { filter: structuredClone(BLANK_FILTER), exportedB64: null },
  (s) => ({ filter: s.filter }),
)

export const editorStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  setFilterName: (name: string) =>
    store.mutate((s) => {
      s.filter = { ...s.filter, name }
    }),
  addRule: () =>
    store.mutate((s) => {
      s.filter = {
        ...s.filter,
        rules: [...s.filter.rules, structuredClone(BLANK_RULE)],
      }
    }),
  duplicateRule: (index: number) =>
    store.mutate((s) => {
      const rules = [...s.filter.rules]
      const copy = structuredClone(rules[index]!)
      copy.name = `${copy.name} (copy)`
      rules.splice(index + 1, 0, copy)
      s.filter = { ...s.filter, rules }
    }),
  removeRule: (index: number) =>
    store.mutate((s) => {
      s.filter = {
        ...s.filter,
        rules: s.filter.rules.filter((_, i) => i !== index),
      }
    }),
  updateRule: (index: number, patch: Partial<Omit<FilterRule, 'conditions'>>) =>
    store.mutate((s) => {
      s.filter = patchRule(s.filter, index, (r) => ({ ...r, ...patch }))
    }),
  moveRule: (from: number, to: number) =>
    store.mutate((s) => {
      const rules = [...s.filter.rules]
      const [moved] = rules.splice(from, 1)
      rules.splice(to, 0, moved!)
      s.filter = { ...s.filter, rules }
    }),
  addCondition: (ruleIndex: number) =>
    store.mutate((s) => {
      s.filter = patchRule(s.filter, ruleIndex, (r) => ({
        ...r,
        conditions: [...r.conditions, structuredClone(BLANK_CONDITION)],
      }))
    }),
  removeCondition: (ruleIndex: number, condIndex: number) =>
    store.mutate((s) => {
      s.filter = patchRule(s.filter, ruleIndex, (r) => ({
        ...r,
        conditions: r.conditions.filter((_, i) => i !== condIndex),
      }))
    }),
  updateCondition: (ruleIndex: number, condIndex: number, patch: Partial<FilterCondition>) =>
    store.mutate((s) => {
      s.filter = patchRule(s.filter, ruleIndex, (r) => {
        const conditions = [...r.conditions]
        conditions[condIndex] = { ...conditions[condIndex]!, ...patch }
        return { ...r, conditions }
      })
    }),
  exportFilter: () => {
    const b64 = serializeFilter(store.getState().filter)
    store.setState({ ...store.getState(), exportedB64: b64 })
    return b64
  },
  clearExport: () => store.setState({ ...store.getState(), exportedB64: null }),
  undo: store.undo,
  redo: store.redo,
  canUndo: store.canUndo,
  canRedo: store.canRedo,
}

export function loadFilterIntoEditor(filter: ParsedFilter) {
  store.setState({ filter: structuredClone(filter), exportedB64: null })
  store.clearHistory()
}
