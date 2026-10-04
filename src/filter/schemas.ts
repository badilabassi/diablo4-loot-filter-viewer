import { z } from 'zod'

export const AffixCategorySchema = z.enum(['stat', 'offense', 'defense', 'utility'])
export const AffixEntrySchema = z.object({
  name: z.string(),
  cat: AffixCategorySchema,
  raw: z.string(),
})
export const AffixDbSchema = z.record(z.coerce.number(), AffixEntrySchema)

export const ParsedColorSchema = z.object({ hex: z.string() })

export const FilterConditionSchema = z.object({
  filterType: z.number(),
  qualityFlags: z.number().optional(),
  minPower: z.number().optional(),
  maxPower: z.number().optional(),
  /** filterType=2 (Item Properties): bitmask, see ITEM_PROPERTIES. */
  itemProperties: z.number().optional(),
  minGaCount: z.number().optional(),
  subtypeIds: z.array(z.number()),
  affixIds: z.array(z.number()),
  /** filterType=6/7 (Has Required/Optional Affixes): how many of the listed
   * affixes the item must have ("Must have at least N"). Condition field 4. */
  minFromList: z.number().optional(),
  itemIds: z.array(z.number()),
  talismanSetIds: z.array(z.number()),
  /** filterType=7 (Has Optional Affixes) affix SNOs. */
  optionalAffixIds: z.array(z.number()),
  /** filterType=6: the required affixes that must roll as Greater Affixes,
   * as SNO min/max ranges (min === max in every observed filter). Field 3. */
  affixRanges: z.array(z.object({ min: z.number(), max: z.number() })).optional(),
  /** Condition field 6. For filterType=4 (Greater Affix Check) it is the
   * direction: 1 = "at least" minGaCount, anything else = "fewer than".
   * Also seen on filterType=3. Preserved for lossless round-trips. */
  field6: z.number().optional(),
})

export const FilterRuleSchema = z.object({
  name: z.string(),
  type: z.number(),
  /** Absent when the rule's wire message genuinely omits field 3, or when
   * the rule isn't a Recolor rule (type !== 2) — color only has an in-game
   * effect for Recolor rules, so it's not shown or edited otherwise. */
  color: ParsedColorSchema.optional(),
  enabled: z.boolean(),
  conditions: z.array(FilterConditionSchema),
})

export const ParsedFilterSchema = z.object({
  name: z.string(),
  rules: z.array(FilterRuleSchema),
  /** Opaque top-level varint fields (e.g. field 3 and 4 in Raxx's filter) preserved for lossless round-trips. */
  topLevelFlags: z.array(z.object({ f: z.number(), v: z.number() })).optional(),
})

export type AffixCategory = z.infer<typeof AffixCategorySchema>
export type AffixEntry = z.infer<typeof AffixEntrySchema>
export type AffixDb = z.infer<typeof AffixDbSchema>
export type ParsedColor = z.infer<typeof ParsedColorSchema>
export type FilterCondition = z.infer<typeof FilterConditionSchema>
export type FilterRule = z.infer<typeof FilterRuleSchema>
export type ParsedFilter = z.infer<typeof ParsedFilterSchema>
