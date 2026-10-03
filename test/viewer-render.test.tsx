import * as assert from 'node:assert/strict'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it } from 'vitest'

import type { FilterCondition, FilterRule } from '../src/filter/schemas.ts'
import { ConditionBlock } from '../src/viewer/condition-block.tsx'
import type { FilterNames } from '../src/viewer/names.ts'
import { RuleCard } from '../src/viewer/rule-card.tsx'
import { RuleList } from '../src/viewer/rule-list.tsx'
import { StatusBar, seededAge } from '../src/viewer/status-bar.tsx'

const NO_NAMES: FilterNames = { affixes: {}, itemTypes: {}, items: {}, talismanSets: {} }
const cond = (patch: Partial<FilterCondition>): FilterCondition => ({
  filterType: 5,
  subtypeIds: [],
  affixIds: [],
  itemIds: [],
  talismanSetIds: [],
  optionalAffixIds: [],
  ...patch,
})
const rule = (patch: Partial<FilterRule>): FilterRule => ({ name: 'Rule', type: 0, enabled: true, conditions: [], ...patch })

describe('RuleList', () => {
  it('renders the empty state without a filter', () => {
    const html = renderToStaticMarkup(<RuleList filter={null} names={NO_NAMES} editHref="/edit" />)
    assert.match(html, /🜏/)
    assert.doesNotMatch(html, /<details/)
  })

  it('renders the header and one native <details> card per rule (no client JS needed)', () => {
    const filter = { name: 'My Filter', rules: [rule({ name: 'A' }), rule({ name: 'B', type: 3 })] }
    const html = renderToStaticMarkup(<RuleList filter={filter} names={NO_NAMES} editHref="/edit?code=abc" />)
    assert.equal(html.match(/<details/g)?.length, 2)
    assert.equal(html.match(/<summary/g)?.length, 2)
    assert.match(html, /My Filter/)
    assert.match(html, /1 rules/, 'Hide All rules are not counted, as in the Remix viewer')
    assert.match(html, /href="\/edit\?code=abc"/)
  })
})

describe('RuleCard', () => {
  it('starts collapsed and marks disabled rules', () => {
    const html = renderToStaticMarkup(<RuleCard rule={rule({ enabled: false })} names={NO_NAMES} delay={0} />)
    assert.doesNotMatch(html, /<details[^>]* open/)
    assert.match(html, />OFF</)
    assert.match(html, /Disabled/)
  })

  it('shows the recolor swatch and hex only for Recolor rules', () => {
    const recolor = renderToStaticMarkup(<RuleCard rule={rule({ type: 2, color: { hex: '#abcdef' } })} names={NO_NAMES} delay={0} />)
    assert.match(recolor, /#ABCDEF/)
    const plain = renderToStaticMarkup(<RuleCard rule={rule({ color: { hex: '#abcdef' } })} names={NO_NAMES} delay={0} />)
    assert.doesNotMatch(plain, /#ABCDEF/)
  })

  it('names unnamed rules by type, as the Remix viewer did', () => {
    assert.match(renderToStaticMarkup(<RuleCard rule={rule({ name: ' ', type: 3 })} names={NO_NAMES} delay={0} />), /HIDE ALL/)
    assert.match(renderToStaticMarkup(<RuleCard rule={rule({ name: '', type: 1 })} names={NO_NAMES} delay={0} />), /HIDE TEXT LABEL/)
  })

  it('sets the glow tag for rules whose name implies a quality', () => {
    assert.match(renderToStaticMarkup(<RuleCard rule={rule({ name: 'Mythic drops' })} names={NO_NAMES} delay={0} />), /data-glow="mythic"/)
  })
})

describe('ConditionBlock', () => {
  it('renders resolved names', () => {
    const names: FilterNames = {
      affixes: { 7: { name: 'Maximum Life', cat: 'defense', raw: 'Life' } },
      itemTypes: { 1: 'Helm' },
      items: { 2: 'Harlequin Crest' },
      talismanSets: { 3: 'Wolf Set' },
    }
    const html = renderToStaticMarkup(
      <ConditionBlock cond={cond({ affixIds: [7, 7], subtypeIds: [1], itemIds: [2], talismanSetIds: [3] })} names={names} />,
    )
    assert.equal(html.match(/Maximum Life/g)?.length, 1, 'duplicate ids are shown once')
    assert.match(html, /data-cat="defense"/)
    for (const name of ['Helm', 'Harlequin Crest', 'Wolf Set']) assert.match(html, new RegExp(name))
  })

  it('falls back to the hex id for ids missing from the index', () => {
    const html = renderToStaticMarkup(
      <ConditionBlock cond={cond({ affixIds: [255], itemIds: [16], talismanSetIds: [17] })} names={NO_NAMES} />,
    )
    assert.match(html, /Unknown affix/)
    assert.match(html, /Unknown item/)
    assert.match(html, /Unknown set/)
    assert.match(html, /0x<!-- -->FF|0xFF/)
  })

  it('shows "Condition active" when a condition has nothing else to show', () => {
    assert.match(renderToStaticMarkup(<ConditionBlock cond={cond({ filterType: 6 })} names={NO_NAMES} />), /Condition active/)
  })
})

describe('StatusBar', () => {
  it('formats counts with a fixed locale and shows the given age', () => {
    const html = renderToStaticMarkup(<StatusBar status={{ affixes: 4366, items: 1133, ts: 0 }} age="3d ago" />)
    assert.match(html, /4,366/)
    assert.match(html, /1,133/)
    assert.match(html, /seeded 3d ago/)
  })

  it('computes the age like the Remix status bar', () => {
    const h = 60 * 60 * 1000
    assert.equal(seededAge(0, 0.4 * h), 'just now')
    assert.equal(seededAge(0, 5 * h), '5h ago')
    assert.equal(seededAge(0, 50 * h), '2d ago')
  })
})
