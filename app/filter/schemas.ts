import { z } from "zod";

export const AffixCategorySchema = z.enum(["stat", "offense", "defense", "utility"]);
export const AffixEntrySchema = z.object({
  name: z.string(),
  cat: AffixCategorySchema,
  raw: z.string(),
});
export const AffixDbSchema = z.record(z.coerce.number(), AffixEntrySchema);

export const ParsedColorSchema = z.object({ hex: z.string(), isDefault: z.boolean() });

export const FilterConditionSchema = z.object({
  filterType: z.number(),
  qualityFlags: z.number().optional(),
  minPower: z.number().optional(),
  maxPower: z.number().optional(),
  minQualityTier: z.number().optional(),
  minGaCount: z.number().optional(),
  subtypeIds: z.array(z.number()),
  affixIds: z.array(z.number()),
  minGaFromList: z.number().optional(),
  itemIds: z.array(z.number()),
  talismanSetIds: z.array(z.number()),
  /** filterType=7 (Has Optional Affixes) affix SNOs. Only the field-2 ID list
   * is confirmed against real data; unlike filterType=6 there's no confirmed
   * min-from-list scalar or field-3 range structure for this type. */
  optionalAffixIds: z.array(z.number()),
  /** SNO ID min/max ranges from condition field 3 (filterType=6). Preserved for lossless round-trips. */
  affixRanges: z.array(z.object({ min: z.number(), max: z.number() })).optional(),
  /** Opaque varint from condition field 6 (seen in filterType=3 and filterType=4). Preserved for lossless round-trips. */
  field6: z.number().optional(),
});

export const FilterRuleSchema = z.object({
  name: z.string(),
  type: z.number(),
  color: ParsedColorSchema,
  enabled: z.boolean(),
  conditions: z.array(FilterConditionSchema),
});

export const ParsedFilterSchema = z.object({
  name: z.string(),
  rules: z.array(FilterRuleSchema),
  /** Opaque top-level varint fields (e.g. field 3 and 4 in Raxx's filter) preserved for lossless round-trips. */
  topLevelFlags: z.array(z.object({ f: z.number(), v: z.number() })).optional(),
});

export type AffixCategory = z.infer<typeof AffixCategorySchema>;
export type AffixEntry = z.infer<typeof AffixEntrySchema>;
export type AffixDb = z.infer<typeof AffixDbSchema>;
export type ParsedColor = z.infer<typeof ParsedColorSchema>;
export type FilterCondition = z.infer<typeof FilterConditionSchema>;
export type FilterRule = z.infer<typeof FilterRuleSchema>;
export type ParsedFilter = z.infer<typeof ParsedFilterSchema>;
