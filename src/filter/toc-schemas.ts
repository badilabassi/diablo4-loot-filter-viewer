import { z } from 'zod'

import { AffixCategorySchema } from './schemas.ts'

export const TocAffixSchema = z.object({
  id: z.number(),
  name: z.string(),
  cat: AffixCategorySchema,
  raw: z.string(),
})

export const TocItemTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const TocItemSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const TocTalismanSetSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const TocDataSchema = z.object({
  affixes: z.array(TocAffixSchema),
  itemTypes: z.array(TocItemTypeSchema),
  items: z.array(TocItemSchema),
  talismanSets: z.array(TocTalismanSetSchema).default([]),
  ts: z.number(),
  commitHash: z.string().optional(),
})

export function parseTocData(json: unknown) {
  return TocDataSchema.parse(json)
}
