import * as assert from 'node:assert/strict'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it } from 'vitest'

import { affixDisplayName } from '../src/data/toc.server.ts'
import { COND_TYPES, ITEM_TYPES } from '../src/filter/constants.ts'
import type { FilterCondition } from '../src/filter/schemas.ts'
import { ConditionBlock } from '../src/viewer/condition-block.tsx'
import { type FilterNames, referencedIds } from '../src/viewer/names.ts'

// Wording follows other Diablo IV filter tools, e.g. diablofilter.com.

const cond = (patch: Partial<FilterCondition>): FilterCondition => ({
  filterType: 6,
  subtypeIds: [],
  affixIds: [],
  itemIds: [],
  talismanSetIds: [],
  optionalAffixIds: [],
  ...patch,
})
const NO_NAMES: FilterNames = { affixes: {}, itemTypes: {}, items: {}, talismanSets: {} }
const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

describe('affixDisplayName', () => {
  const name = (Description: string, DescriptionClean = '') => affixDisplayName({ Description, DescriptionClean })

  it('keeps the sign and unit, dropping only the value placeholder', () => {
    assert.equal(name('+#% Movement Speed'), '+% Movement Speed')
    assert.equal(name('+# to Blazing Scream'), '+ to Blazing Scream')
    assert.equal(name('#% Resource Generation'), '% Resource Generation')
    assert.equal(name('+# Resistance to All Elements'), '+ Resistance to All Elements')
  })

  it('uses only the first line and falls back to the clean description', () => {
    assert.equal(name('+# Armor\nsecond line'), '+ Armor')
    assert.equal(name('#', 'Willpower'), 'Willpower')
  })
})

describe('labels', () => {
  it('names condition types as filter tools do', () => {
    assert.equal(COND_TYPES[3]!.label, 'Codex Upgrade Check')
    assert.equal(COND_TYPES[4]!.label, 'Greater Affix Check')
    assert.equal(COND_TYPES[5]!.label, 'Item Match Type')
    assert.equal(COND_TYPES[6]!.label, 'Has Required Affixes')
    assert.equal(COND_TYPES[7]!.label, 'Has Optional Affixes')
    assert.equal(COND_TYPES[8]!.label, 'Is Specific Unique')
  })

  it('names item types with their in-game names', () => {
    assert.equal(ITEM_TYPES[446802], 'Two-Handed Axe')
    assert.equal(ITEM_TYPES[446825], 'Crossbow')
    assert.equal(ITEM_TYPES[446827], 'Totem')
    assert.equal(ITEM_TYPES[446829], 'Chest Armor')
    assert.equal(ITEM_TYPES[446831], 'Pants')
  })
})

describe('ConditionBlock wording', () => {
  it('words Greater Affix Check as a sentence, singular and plural', () => {
    assert.match(text(renderToStaticMarkup(<ConditionBlock cond={cond({ filterType: 4, minGaCount: 3, field6: 1 })} names={NO_NAMES} />)), /Must have at least 3 Greater Affixes/)
    assert.match(text(renderToStaticMarkup(<ConditionBlock cond={cond({ filterType: 4, minGaCount: 1, field6: 1 })} names={NO_NAMES} />)), /Must have at least 1 Greater Affix(?!es)/)
  })

  it('reads Greater Affix Check field 6 as the direction: 1 = at least, else fewer than', () => {
    // e.g. a "NOT TOP ITEMS" hide rule: hide items with fewer than 2 Greater Affixes.
    assert.match(text(renderToStaticMarkup(<ConditionBlock cond={cond({ filterType: 4, minGaCount: 2 })} names={NO_NAMES} />)), /Must have fewer than 2 Greater Affixes/)
    assert.match(text(renderToStaticMarkup(<ConditionBlock cond={cond({ filterType: 4, minGaCount: 2, field6: 0 })} names={NO_NAMES} />)), /fewer than 2/)
  })

  it('shows Item Properties as a bitmask: 36 = Ancestral + Mythic', () => {
    const t = text(renderToStaticMarkup(<ConditionBlock cond={cond({ filterType: 2, itemProperties: 36 })} names={NO_NAMES} />))
    assert.match(t, /Item Properties/)
    assert.match(t, /Ancestral/)
    assert.match(t, /Mythic/)
    assert.doesNotMatch(t, /None|Sacred|Tier/)
  })

  it('shows unassigned Item Properties bits by value instead of hiding them', () => {
    assert.match(text(renderToStaticMarkup(<ConditionBlock cond={cond({ filterType: 2, itemProperties: 4 | 8 })} names={NO_NAMES} />)), /Ancestral.*Other \(8\)/)
  })

  it('shows how many listed affixes are required, for required and optional affixes', () => {
    assert.match(text(renderToStaticMarkup(<ConditionBlock cond={cond({ affixIds: [1], minFromList: 3 })} names={NO_NAMES} />)), /Must have at least 3 of:/)
    assert.match(text(renderToStaticMarkup(<ConditionBlock cond={cond({ filterType: 7, optionalAffixIds: [1], minFromList: 2 })} names={NO_NAMES} />)), /Must have at least 2 of:/)
    assert.doesNotMatch(text(renderToStaticMarkup(<ConditionBlock cond={cond({ filterType: 7, optionalAffixIds: [1] })} names={NO_NAMES} />)), /Must have/)
  })

  it('lists the required affixes that must be greater under "Greater Affixes:"', () => {
    const names: FilterNames = {
      ...NO_NAMES,
      affixes: {
        1: { name: '+% Critical Strike Chance', cat: 'offense', raw: 'a' },
        2: { name: '+ to All Skills', cat: 'stat', raw: 'b' },
      },
    }
    const html = renderToStaticMarkup(
      <ConditionBlock cond={cond({ affixIds: [1, 2], affixRanges: [{ min: 2, max: 2 }] })} names={names} />,
    )
    const t = text(html)
    assert.match(t, /Has Required Affixes/)
    assert.ok(t.indexOf('Greater Affixes:') > t.indexOf('+% Critical Strike Chance'), 'sub-list follows the required affixes')
    assert.equal(t.split('Greater Affixes:')[1]!.includes('+ to All Skills'), true)
    assert.equal(t.split('Greater Affixes:')[1]!.includes('Critical Strike Chance'), false)
  })

  it('resolves names for the greater-affix sub-list on the server', () => {
    const ids = referencedIds({ name: 'F', rules: [{ name: 'R', type: 0, enabled: true, conditions: [cond({ affixRanges: [{ min: 9, max: 9 }] })] }] })
    assert.ok(ids.affixes.has(9))
  })
})
