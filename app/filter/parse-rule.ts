import { FilterRuleSchema, type FilterRule } from './schemas.ts'

export function parseRuleJson(ruleJson: string): FilterRule {
  const json: unknown = JSON.parse(ruleJson)
  return FilterRuleSchema.parse(json)
}
