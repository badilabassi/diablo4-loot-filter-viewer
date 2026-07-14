import {
  ParsedFilterSchema,
  type FilterCondition,
  type FilterRule,
  type ParsedColor,
  type ParsedFilter,
} from './schemas.ts'

// ── Wire-format protobuf decoder ─────────────────────────────────────────

type FieldType = "v" | "s" | "b" | "f"; // varint | string | bytes | fixed32

interface Field {
  f: number;
  t: FieldType;
  v: number | string | Uint8Array;
  raw?: Uint8Array; // bytes when t === 's'
}

function readVarint(data: Uint8Array, pos: number): [value: number, nextPos: number] {
  let result = 0;
  let shift = 0;
  for (;;) {
    const byte = data[pos++];
    result |= (byte & 0x7f) << shift;
    if (!(byte & 0x80)) return [result >>> 0, pos];
    shift += 7;
  }
}

function decodeMsg(data: Uint8Array): Field[] {
  const fields: Field[] = [];
  let pos = 0;

  while (pos < data.length) {
    let tag: number;
    try {
      [tag, pos] = readVarint(data, pos);
    } catch {
      break;
    }
    const fn = tag >>> 3;
    const wt = tag & 7;

    if (wt === 0) {
      const [v, next] = readVarint(data, pos);
      pos = next;
      fields.push({ f: fn, t: "v", v });
    } else if (wt === 2) {
      const [len, next] = readVarint(data, pos);
      pos = next;
      const chunk = data.slice(pos, pos + len);
      pos += len;
      try {
        const s = new TextDecoder("utf-8", { fatal: true }).decode(chunk);
        fields.push({ f: fn, t: "s", v: s, raw: chunk });
      } catch {
        fields.push({ f: fn, t: "b", v: chunk });
      }
    } else if (wt === 5) {
      const v = new DataView(data.buffer, data.byteOffset + pos, 4).getUint32(0, true);
      pos += 4;
      fields.push({ f: fn, t: "f", v });
    } else if (wt === 1) {
      // fixed64 — not used by any known field in this schema, but must be skipped
      // (not aborted) so later fields in the same message still get parsed.
      pos += 8;
    } else {
      break;
    }
  }

  return fields;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getV(fields: Field[], f: number, t: FieldType) {
  return fields.find((x) => x.f === f && x.t === t)?.v;
}

function decodeColor(uint: number): ParsedColor {
  const r = uint & 0xff;
  const g = (uint >> 8) & 0xff;
  const b = (uint >> 16) & 0xff;
  const hex = "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  return { hex, isDefault: uint === 0xffff_0000 };
}

function parseCondition(raw: Uint8Array): FilterCondition {
  const sub = decodeMsg(raw);
  const filterType = (getV(sub, 1, "v") as number | undefined) ?? -1;

  // field=4: lower bound (min power, rarity flags, quality tier, GA count, GA from list)
  // field=5: upper bound for power range (when both present, field4=max, field5=min)
  const field4 = getV(sub, 4, "v") as number | undefined;
  const field5 = getV(sub, 5, "v") as number | undefined;

  // field=6: opaque varint (observed in filterType=3 and filterType=4, always 1)
  const field6 = getV(sub, 6, "v") as number | undefined;

  // field=2 fixed32s carry SNO IDs for item types, affixes, or specific items.
  // Try individual fixed32 wire type first; fall back to packed blob (length-delimited).
  const fixed32s = sub.filter((x) => x.f === 2 && x.t === "f").map((x) => x.v as number);
  if (!fixed32s.length) {
    const blob = sub.find((x) => x.f === 2 && x.t === "b");
    if (blob && blob.v instanceof Uint8Array && blob.v.length > 0 && blob.v.length % 4 === 0) {
      for (let i = 0; i < blob.v.length; i += 4) {
        fixed32s.push(new DataView(blob.v.buffer, blob.v.byteOffset + i, 4).getUint32(0, true));
      }
    }
  }

  // field=3: sub-messages containing min/max SNO ID ranges (present in filterType=6).
  // Each sub-message: { field1: minSno (fixed32), field2: maxSno (fixed32) }.
  // In known filters min === max (exact match), but we parse and preserve the structure
  // so the editor can round-trip without losing game-required data.
  const affixRanges: Array<{ min: number; max: number }> = [];
  for (const entry of sub.filter((x) => x.f === 3)) {
    const blob = entry.t === "b" ? (entry.v as Uint8Array) : entry.raw;
    if (!blob) continue;
    try {
      const inner = decodeMsg(blob);
      const min = inner.find((x) => x.f === 1 && x.t === "f")?.v as number | undefined;
      const max = inner.find((x) => x.f === 2 && x.t === "f")?.v as number | undefined;
      if (min != null && max != null) affixRanges.push({ min, max });
    } catch {
      // ignore malformed sub-messages
    }
  }

  const minPow = filterType === 0 ? (field5 ?? field4) : undefined;
  const maxPow =
    filterType === 0 && field4 != null && field5 != null && field4 !== field5 ? field4 : undefined;

  return {
    filterType,
    qualityFlags: filterType === 1 ? field4 : undefined,
    minPower: minPow,
    maxPower: maxPow,
    minQualityTier: filterType === 2 ? field4 : undefined,
    minGaCount: filterType === 4 ? field4 : undefined,
    subtypeIds: filterType === 5 ? fixed32s : [],
    affixIds: filterType === 6 ? fixed32s : [],
    minGaFromList: filterType === 6 ? (field4 ?? 1) : undefined,
    itemIds: filterType === 8 ? fixed32s : [],
    talismanSetIds: filterType === 9 ? fixed32s : [],
    affixRanges: affixRanges.length > 0 ? affixRanges : undefined,
    field6,
  };
}

function parseRule(data: Uint8Array): FilterRule {
  const F = decodeMsg(data);
  const name = (getV(F, 1, "s") as string | undefined) ?? "";
  const type = (getV(F, 2, "v") as number | undefined) ?? 0;
  const enabled = !!((getV(F, 5, "v") as number | undefined) ?? 0);
  const color = decodeColor((getV(F, 3, "f") as number | undefined) ?? 0xffff_0000);

  const conditions = F.filter((x) => x.f === 4).flatMap((ff) => {
    const raw = ff.t === "b" ? (ff.v as Uint8Array) : ff.raw;
    if (!raw) return [];
    try {
      return [parseCondition(raw)];
    } catch {
      return [];
    }
  });

  return { name, type, color, enabled, conditions };
}

// ── Wire-format protobuf encoder ─────────────────────────────────────────

function writeVarint(value: number): number[] {
  const bytes: number[] = [];
  value = value >>> 0;
  while (value > 0x7f) {
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  bytes.push(value);
  return bytes;
}

function encodeTag(field: number, wireType: number): number[] {
  return writeVarint((field << 3) | wireType);
}

function encodeVarintField(field: number, value: number): number[] {
  return [...encodeTag(field, 0), ...writeVarint(value)];
}

function encodeStringField(field: number, str: string): number[] {
  const encoded = new TextEncoder().encode(str);
  return [...encodeTag(field, 2), ...writeVarint(encoded.length), ...encoded];
}

function encodeBytesField(field: number, bytes: Uint8Array): number[] {
  return [...encodeTag(field, 2), ...writeVarint(bytes.length), ...bytes];
}

function encodeFixed32Field(field: number, value: number): number[] {
  const buf = new ArrayBuffer(4);
  new DataView(buf).setUint32(0, value, true);
  return [...encodeTag(field, 5), ...new Uint8Array(buf)];
}

function encodeColor(color: ParsedColor): number[] {
  if (color.isDefault) return encodeFixed32Field(3, 0xffff_0000);
  const hex = color.hex.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  // High byte = 0xff (alpha, always fully opaque)
  const uint = ((r & 0xff) | ((g & 0xff) << 8) | ((b & 0xff) << 16) | 0xff00_0000) >>> 0;
  return encodeFixed32Field(3, uint);
}

function serializeCondition(cond: FilterCondition): Uint8Array {
  const bytes: number[] = [];

  bytes.push(...encodeVarintField(1, cond.filterType));

  // field=2: individual fixed32 entries, one per ID — matches game wire format.
  // (Packed encoding works in theory but the game produces individual fixed32s.)
  const ids =
    cond.filterType === 5
      ? cond.subtypeIds
      : cond.filterType === 6
        ? cond.affixIds
        : cond.filterType === 8
          ? cond.itemIds
          : cond.filterType === 9
            ? cond.talismanSetIds
            : [];
  for (const id of ids) bytes.push(...encodeFixed32Field(2, id));

  // field=3: affix range sub-messages (filterType=6). Each sub-message has
  // field1=minSno and field2=maxSno. In practice min===max (exact match).
  if (cond.filterType === 6 && cond.affixRanges?.length) {
    for (const { min, max } of cond.affixRanges) {
      const sub: number[] = [
        ...encodeFixed32Field(1, min),
        ...encodeFixed32Field(2, max),
      ];
      bytes.push(...encodeBytesField(3, new Uint8Array(sub)));
    }
  }

  // field=4: lower scalar (qualityFlags, minPower, quality tier, GA count, GA from list)
  const f4 =
    cond.filterType === 0
      ? (cond.maxPower ?? cond.minPower)
      : cond.filterType === 1
        ? cond.qualityFlags
        : cond.filterType === 2
          ? cond.minQualityTier
          : cond.filterType === 4
            ? cond.minGaCount
            : cond.filterType === 6
              ? (cond.minGaFromList ?? 1)
              : undefined;
  if (f4 != null) bytes.push(...encodeVarintField(4, f4));

  // field=5: upper bound for power range
  if (cond.filterType === 0 && cond.minPower != null && cond.minPower !== cond.maxPower) {
    bytes.push(...encodeVarintField(5, cond.minPower));
  }

  // field=6: opaque varint (filterType=3 Codex and filterType=4 GA count conditions)
  if (cond.field6 != null) bytes.push(...encodeVarintField(6, cond.field6));

  return new Uint8Array(bytes);
}

function serializeRule(rule: FilterRule): Uint8Array {
  const bytes: number[] = [];

  bytes.push(...encodeStringField(1, rule.name));
  bytes.push(...encodeVarintField(2, rule.type));
  bytes.push(...encodeColor(rule.color));

  for (const cond of rule.conditions) {
    const condBytes = serializeCondition(cond);
    bytes.push(...encodeBytesField(4, condBytes));
  }

  bytes.push(...encodeVarintField(5, rule.enabled ? 1 : 0));

  return new Uint8Array(bytes);
}

// ── Public ────────────────────────────────────────────────────────────────

export function serializeFilter(filter: ParsedFilter): string {
  const bytes: number[] = [];

  for (const rule of filter.rules) {
    const ruleBytes = serializeRule(rule);
    bytes.push(...encodeBytesField(1, ruleBytes));
  }
  bytes.push(...encodeStringField(2, filter.name));

  // Restore any top-level varint flags that were present in the original filter
  // (e.g. field 3 and field 4 seen in community filters) so round-trips are lossless.
  for (const { f, v } of filter.topLevelFlags ?? []) {
    bytes.push(...encodeVarintField(f, v));
  }

  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

export function parseFilterB64(b64: string): ParsedFilter {
  const binary = atob(b64.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const top = decodeMsg(bytes);

  const name = (getV(top, 2, "s") as string | undefined) ?? "Unknown Filter";

  // Accept rule blobs regardless of whether decodeMsg classified them as "b" (binary)
  // or "s" (valid UTF-8 string). A divider rule with a zero-alpha color or short name
  // can produce all-ASCII bytes, causing it to be tagged "s" and silently dropped if
  // we filtered strictly on "b". We always use the raw Uint8Array for parseRule.
  const rules = top
    .filter((f) => f.f === 1 && (f.t === "b" || f.t === "s"))
    .map((f) => {
      const raw = f.t === "b" ? (f.v as Uint8Array) : (f.raw as Uint8Array);
      return parseRule(raw);
    });

  if (!rules.length) throw new Error("No rules found in this filter code");

  // Preserve top-level varint flags (fields 3, 4, …) so the serializer can write
  // them back verbatim and the re-encoded filter is byte-compatible with the original.
  const topLevelFlags = top
    .filter((f) => f.f !== 1 && f.f !== 2 && f.t === "v")
    .map((f) => ({ f: f.f, v: f.v as number }));

  const decoded: ParsedFilter = {
    name,
    rules,
    topLevelFlags: topLevelFlags.length ? topLevelFlags : undefined,
  }
  return ParsedFilterSchema.parse(decoded)
}
