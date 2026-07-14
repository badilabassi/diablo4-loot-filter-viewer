import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { parseFilterB64, serializeFilter } from '../app/filter/proto.ts'

/**
 * Builds a minimal top-level filter message containing:
 *   - rule "A" (field 1, length-delimited)
 *   - an unknown fixed64 field (field 7, wire type 1) — not part of any
 *     known schema, but must be skipped rather than aborting the parse
 *   - rule "B" (field 1, length-delimited)
 *   - filter name "Test" (field 2, length-delimited)
 *
 * Regression test for: a fixed64 field used to hit the decodeMsg `else`
 * branch and `break` out of the loop entirely, silently dropping every
 * field after it (including rule "B" and the filter name here).
 */
function buildFixtureBytes(): Uint8Array {
  const rule = (name: string) => {
    const nameBytes = new TextEncoder().encode(name)
    // field 1, wire type 2 (length-delimited): tag = (1 << 3) | 2 = 0x0a
    return [0x0a, nameBytes.length, ...nameBytes]
  }

  const ruleA = rule('A')
  const ruleB = rule('B')
  const filterName = new TextEncoder().encode('Test')

  return new Uint8Array([
    // rule A, wrapped as top-level field 1 (wire type 2)
    0x0a, ruleA.length, ...ruleA,
    // unknown fixed64 field: field 7, wire type 1 -> tag = (7 << 3) | 1 = 0x39
    0x39, 0, 0, 0, 0, 0, 0, 0, 0,
    // rule B, wrapped as top-level field 1 (wire type 2)
    0x0a, ruleB.length, ...ruleB,
    // filter name, top-level field 2 (wire type 2) -> tag = (2 << 3) | 2 = 0x12
    0x12, filterName.length, ...filterName,
  ])
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

describe('proto: decodeMsg wire type 1 (fixed64)', () => {
  it('skips an unknown fixed64 field instead of aborting the rest of the message', () => {
    const b64 = toBase64(buildFixtureBytes())
    const parsed = parseFilterB64(b64)

    assert.equal(parsed.name, 'Test')
    assert.equal(parsed.rules.length, 2)
    assert.equal(parsed.rules[0]?.name, 'A')
    assert.equal(parsed.rules[1]?.name, 'B')
  })
})

// ── filterType=9 (Talisman Set Bonus) ────────────────────────────────────────

function encodeVarint(field: number, value: number): number[] {
  const bytes: number[] = [(field << 3) | 0]
  let v = value >>> 0
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80)
    v >>>= 7
  }
  bytes.push(v)
  return bytes
}

function encodeFixed32(field: number, value: number): number[] {
  const buf = new ArrayBuffer(4)
  new DataView(buf).setUint32(0, value >>> 0, true)
  return [(field << 3) | 5, ...new Uint8Array(buf)]
}

function encodeString(field: number, str: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(str))
  return [(field << 3) | 2, bytes.length, ...bytes]
}

function encodeBytes(field: number, bytes: number[]): number[] {
  return [(field << 3) | 2, bytes.length, ...bytes]
}

/**
 * Builds a filter with one rule containing a single filterType=9 condition
 * carrying two Talisman Set SNO IDs, using the same fixed32 field-2 encoding
 * already used by filterType 5/6/8.
 */
function buildTalismanSetFixture(setIds: number[]): string {
  const condition = [
    ...encodeVarint(1, 9), // filterType = 9 (Talisman Set Bonus)
    ...setIds.flatMap((id) => encodeFixed32(2, id)),
  ]
  const rule = [
    ...encodeString(1, 'My Charm Sets'),
    ...encodeVarint(2, 0),
    ...encodeBytes(4, condition),
    ...encodeVarint(5, 1),
  ]
  const top = [...encodeBytes(1, rule), ...encodeString(2, 'Talisman Test')]
  return toBase64(new Uint8Array(top))
}

/**
 * Builds a filter with one rule containing a single filterType=7 condition
 * (Has Optional Affixes), using the same fixed32 field-2 encoding already
 * used by filterType 6/9. Only the ID list is confirmed for this filterType —
 * no field-3 range or field-4 scalar is exercised here.
 */
function buildOptionalAffixFixture(affixIds: number[]): string {
  const condition = [
    ...encodeVarint(1, 7), // filterType = 7 (Has Optional Affixes)
    ...affixIds.flatMap((id) => encodeFixed32(2, id)),
  ]
  const rule = [
    ...encodeString(1, 'Optional Affix Rule'),
    ...encodeVarint(2, 0),
    ...encodeBytes(4, condition),
    ...encodeVarint(5, 1),
  ]
  const top = [...encodeBytes(1, rule), ...encodeString(2, 'Optional Affix Test')]
  return toBase64(new Uint8Array(top))
}

describe('proto: filterType=7 Has Optional Affixes', () => {
  it('captures field-2 SNO IDs into optionalAffixIds instead of discarding them', () => {
    const b64 = buildOptionalAffixFixture([1829570, 1829574])
    const parsed = parseFilterB64(b64)

    const cond = parsed.rules[0]?.conditions[0]
    assert.equal(cond?.filterType, 7)
    assert.deepEqual(cond?.optionalAffixIds, [1829570, 1829574])
    assert.deepEqual(cond?.affixIds, [])
  })

  it('round-trips optionalAffixIds through the encoder', () => {
    const b64 = buildOptionalAffixFixture([1829570, 1829574])
    const reParsed = parseFilterB64(serializeFilter(parseFilterB64(b64)))

    assert.deepEqual(reParsed.rules[0]?.conditions[0]?.optionalAffixIds, [1829570, 1829574])
  })
})

describe('proto: filterType=9 Talisman Set Bonus', () => {
  it('captures field-2 SNO IDs into talismanSetIds instead of discarding them', () => {
    const b64 = buildTalismanSetFixture([2245567, 2292501])
    const parsed = parseFilterB64(b64)

    assert.equal(parsed.rules.length, 1)
    const cond = parsed.rules[0]?.conditions[0]
    assert.ok(cond)
    assert.equal(cond?.filterType, 9)
    assert.deepEqual(cond?.talismanSetIds, [2245567, 2292501])
  })

  it('round-trips talismanSetIds through the encoder', () => {
    const b64 = buildTalismanSetFixture([2245567, 2292501])
    const parsed = parseFilterB64(b64)

    const reEncoded = serializeFilter(parsed)
    const reParsed = parseFilterB64(reEncoded)

    assert.deepEqual(reParsed.rules[0]?.conditions[0]?.talismanSetIds, [2245567, 2292501])
  })

  it('handles an empty ID list (matches any Talisman Set, as seen in real exports)', () => {
    const b64 = buildTalismanSetFixture([])
    const parsed = parseFilterB64(b64)

    assert.equal(parsed.rules[0]?.conditions[0]?.filterType, 9)
    assert.deepEqual(parsed.rules[0]?.conditions[0]?.talismanSetIds, [])
  })
})
