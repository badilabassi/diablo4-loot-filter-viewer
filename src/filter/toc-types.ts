import type { AffixCategory } from './schemas.ts'

export interface TocAffix {
  id: number
  name: string
  cat: AffixCategory
  raw: string
}

export interface TocItemType {
  id: number
  name: string
}

export interface TocItem {
  id: number
  name: string
}

export interface TocTalismanSet {
  id: number
  name: string
}

export interface TocData {
  affixes: TocAffix[]
  itemTypes: TocItemType[]
  items: TocItem[]
  talismanSets: TocTalismanSet[]
  ts: number
  commitHash?: string
}
