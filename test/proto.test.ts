import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { parseFilterB64 } from '../app/filter/proto.ts'

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
