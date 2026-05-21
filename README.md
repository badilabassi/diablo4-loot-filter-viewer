# Diablo IV — Filter Viewer

A single-page web app that decodes **Diablo IV in-game loot filter share codes** and renders a styled, browsable view of every rule, condition, item type, affix, and Greater Affix the filter contains.

Filter codes pasted into the in-game dialog are base64-encoded protobuf messages. This tool reverse-decodes that payload, resolves Affix and Item Type SNO IDs against live community game-data dumps, and presents the result in a Diablo-themed UI built with React 19, Vite 8, and Tailwind v4.

The app runs entirely in the browser — no server, no API key, no data leaves the page (except cached HTTP requests to GitHub for game-data lookups).

---

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
- [Project layout](#project-layout)
- [How it works](#how-it-works)
  - [1. The share code is base64](#1-the-share-code-is-base64)
  - [2. The payload is wire-format protobuf](#2-the-payload-is-wire-format-protobuf)
  - [3. Top-level filter schema](#3-top-level-filter-schema)
  - [4. Rule schema](#4-rule-schema)
  - [5. Condition schema (the hardest part)](#5-condition-schema-the-hardest-part)
  - [6. Color encoding](#6-color-encoding)
- [Affix database (`useAffixDb`)](#affix-database-useaffixdb)
  - [Bootstrap layer](#bootstrap-layer)
  - [Live-fetch layer](#live-fetch-layer)
  - [Cache layer](#cache-layer)
  - [Name humanization & category inference](#name-humanization--category-inference)
- [UI architecture](#ui-architecture)
- [Styling system](#styling-system)
- [Build & deployment](#build--deployment)
- [Extending the project](#extending-the-project)
- [Known limitations](#known-limitations)
- [Credits](#credits)

---

## Features

- **Paste-and-decode** any Diablo IV filter share code (base64 protobuf).
- **Per-rule cards** showing the rule name, highlight color swatch, enabled state, and inferred tags (`Mythic`, `Unique`, `Legendary`, `Set`, `Ancestral`, `GA`, `Codex`, `Section`, `SELECT`).
- **Decoded conditions** with friendly labels for all 9 known filter types (Item Type, Has Affixes, Item Rarity, Codex Upgrade, Greater Affix Count, Item Subtype, Greater Affixes, Is Ancestral, Talisman Set Bonus).
- **Live affix resolution.** SNO IDs are looked up against a built-in bootstrap table and progressively enriched from the [`blizzhackers/d4data`](https://github.com/blizzhackers/d4data) and [`DiabloTools/d4data`](https://github.com/DiabloTools/d4data) GitHub repositories.
- **6-hour `localStorage` cache** of fetched affix data — subsequent loads are instant and offline-capable.
- **Single-file build** via [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile) — `dist/index.html` is a fully self-contained ~few-hundred-KB drop-in.
- **Diablo-themed UI** — Cinzel + Crimson Pro typography, gold/parchment palette, animated entry, expandable rule cards.

---

## Quick start

```bash
pnpm install         # or npm install / yarn
pnpm dev             # Vite dev server on http://localhost:5173
pnpm build           # produces dist/index.html as a single bundle
pnpm preview         # preview the production build
```

Linting/formatting uses [Biome](https://biomejs.dev):

```bash
pnpm check           # lint + format check (no writes)
pnpm lint            # lint + format with --write
pnpm format          # format only with --write
```

Then open the app and click **Example** to see a real filter (Raxx’s Torment 6+ Filter) decoded end-to-end.

---

## Project layout

```text
src/
├── App.tsx                     # Top-level layout, paste/parse UX, status bar
├── main.tsx                    # React 19 entry point
├── index.css                   # Tailwind v4 theme tokens + components
├── global.d.ts                 # Ambient TS declarations
├── components/
│   ├── StatusBar.tsx           # Bootstrap → fetching → ready progress strip
│   ├── RuleCard.tsx            # Collapsible card per filter rule
│   ├── ConditionBlock.tsx      # Renders one condition (rarity / tier / power / GA / subtype / affix)
│   └── AffixChip.tsx           # Single resolved affix pill (name, hex SNO, category color)
└── lib/
    ├── proto.ts                # Hand-written protobuf wire-format decoder + filter parser
    ├── types.ts                # All shared TypeScript types
    ├── constants.ts            # Quality flags, item types, condition labels, example filter, CSS class maps
    ├── bootstrap.ts            # Built-in SNO → affix metadata table (~250 entries)
    └── affixDb.ts              # useAffixDb hook: cache + live GitHub fetch pipeline
```

---

## How it works

### 1. The share code is base64

A filter exported from the in-game UI is just a base64 string. The app decodes it with `atob` and converts to a `Uint8Array`:

```ts
// src/lib/proto.ts
const binary = atob(b64.trim())
const bytes  = Uint8Array.from(binary, c => c.charCodeAt(0))
```

### 2. The payload is wire-format protobuf

There is **no `.proto` schema** — Blizzard does not publish one. Instead, [`proto.ts`](src/lib/proto.ts) implements just enough of the [protobuf wire format](https://protobuf.dev/programming-guides/encoding/) to walk the message:

- **Wire type 0** — varint (`uint64`)
- **Wire type 2** — length-delimited (string / bytes / nested message)
- **Wire type 5** — fixed32 (used for SNO IDs and packed RGBA)

Every length-delimited field is opportunistically tried as UTF-8 first, falling back to raw bytes if decoding fails. This means a single decoder can be reused for every layer of the message.

### 3. Top-level filter schema

The top-level message contains:

| Field | Wire type | Meaning |
| ----- | --------- | ------- |
| `1`   | bytes     | Repeated **rule** sub-message (one per rule) |
| `2`   | string    | Filter name (e.g. `"Raxx's Torment 6+ Filter"`) |

```ts
const name  = (getV(top, 2, 's') as string | undefined) ?? 'Unknown Filter'
const rules = top.filter(f => f.f === 1 && f.t === 'b').map(...)
```

### 4. Rule schema

Each rule sub-message contains:

| Field | Wire type | Meaning |
| ----- | --------- | ------- |
| `1`   | string    | Rule display name |
| `2`   | varint    | Rule **type** (`0` = normal, `2` = section header, `3` = separator) |
| `3`   | fixed32   | Highlight color, packed `0x00BBGGRR` (Windows COLORREF style) |
| `4`   | bytes     | Repeated **condition** sub-message |
| `5`   | varint    | Enabled flag (`0`/`1`) |

Separator rules (`type === 3`) render as a decorative divider; section headers (`type === 2`) are styled with a gold gradient and an extra `Section` tag.

### 5. Condition schema (the hardest part)

Each condition sub-message reuses just **three field numbers** but their meaning depends on the value of `field 1` (`filterType`). This was the single most non-obvious thing to reverse-engineer:

| `filterType` | Label                | `field 4` (varint) | `field 2` (fixed32, repeated) |
| -----------: | -------------------- | ------------------ | ----------------------------- |
| **0**        | Item Type            | Min item power (e.g. `850`) | — |
| **1**        | Has Affixes / Rarity | **Bit-flags** of allowed rarities (see below) | — |
| **2**        | Item Rarity          | Min quality **tier index** (0..6, see below) | — |
| **3**        | Codex Upgrade        | — | — |
| **4**        | Greater Affix Count  | Min number of GAs required | — |
| **5**        | Item Subtype         | — | **ItemType SNO IDs** |
| **6**        | Greater Affixes      | — | **Affix SNO IDs** |
| **8**        | Is Ancestral         | — | — |
| **9**        | Talisman Set Bonus   | — | — |

**Critical gotcha** — `field 4` carries different *kinds* of integer depending on `filterType`. Filter type `1` uses bit-flags; filter type `2` uses a 0-indexed enum. They are **not** interchangeable:

```ts
// Bit-flags (filterType=1)
QUALITY_FLAGS = [
  [1,  'Normal'],       [2,  'Magic'],     [4,  'Rare'],     [8,  'Legendary'],
  [16, 'Unique'],       [32, 'Mythic'],    [64, 'Set'],
]

// Enum (filterType=2 / Ancestral)
QUALITY_TIERS = {
  0: 'Normal', 1: 'Magic', 2: 'Rare', 3: 'Sacred',
  4: 'Legendary', 5: 'Unique', 6: 'Mythic Unique',
}
```

The parser ([`parseCondition`](src/lib/proto.ts)) discriminates on `filterType` and only populates the relevant sub-field on `FilterCondition`:

```ts
return {
  filterType,
  qualityFlags:   filterType === 1 ? field4 : undefined,
  minPower:       filterType === 0 ? field4 : undefined,
  minQualityTier: filterType === 2 ? field4 : undefined,
  minGaCount:     filterType === 4 ? field4 : undefined,
  subtypeIds:     filterType === 5 ? fixed32s : [],
  affixIds:       filterType === 6 ? fixed32s : [],
}
```

The discriminated shape lets [ConditionBlock.tsx](src/components/ConditionBlock.tsx) render each condition unambiguously.

### 6. Color encoding

Highlight colors are packed as a 32-bit unsigned little-endian integer in the order `0x00BBGGRR`:

```ts
function decodeColor(uint: number): ParsedColor {
  const r = uint & 0xff
  const g = (uint >> 8) & 0xff
  const b = (uint >> 16) & 0xff
  const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
  return { hex, isDefault: uint === 0xffff_0000 }
}
```

`0xFFFF0000` is treated as the in-game **default** sentinel and is rendered as a neutral blue swatch in the UI rather than the literal red.

---

## Affix database (`useAffixDb`)

Affix and Item Type IDs in the binary payload are raw 32-bit **SNO IDs** — the internal numeric identifiers Blizzard uses for every game asset. Resolving them to human names requires either a big static table or a live data source. This project uses both.

### Bootstrap layer

[`src/lib/bootstrap.ts`](src/lib/bootstrap.ts) ships ~250 hand-curated `SNO → { name, cat, raw }` entries covering the common stat / offense / defense / utility affixes (S04 through X2). This means the app works fully offline on first load with zero network traffic.

### Live-fetch layer

On mount, [`useAffixDb`](src/lib/affixDb.ts) checks `localStorage` for a fresh cache and, if missing, kicks off a background fetch:

1. Lists the contents of `json/base/meta/Affix/` from the GitHub Contents API for each repo:
   - `DiabloTools/d4data@master`
2. Filters out junk (`Unique_`, `UBERUNIQUE`, `TEST`, `DONOTSHIP`, `Legacy`, `PACT`, `Paragon`, `QA_`).
3. Downloads the raw `.aff.json` for each remaining file in **batches of 25** with `Promise.allSettled`, so transient network errors never block the rest.
4. Extracts only `__snoID__` via regex (avoids parsing the entire JSON).
5. Skips IDs already present in the bootstrap table.
6. Persists discovered entries to `localStorage` under key `d4_affix_v5`.

The hook exposes a phase machine so the UI can show progress:

```text
bootstrap → listing → fetching (0–100%) → ready
                                        ↘ error
```

All fetches respect an `AbortController` that fires on unmount, so navigating away mid-download is safe.

### Cache layer

```ts
const CACHE_KEY = 'd4_affix_v5'
const CACHE_TTL = 6 * 60 * 60 * 1000   // 6 hours
```

The cache version (`v5`) is part of the key so bumping `BOOTSTRAP` or the fetch logic only requires changing the version string to invalidate every client.

### Name humanization & category inference

Raw filenames look like `S04_CD_Reduction.aff.json`. [`humanize()`](src/lib/affixDb.ts) applies:

- An explicit `NAME_FIXES` overrides table for irregular names (`S04_Luck` → `Lucky Hit Chance`).
- Season-prefix stripping (`S04_`, `X2_`, …).
- Special-case formatting for `CoreStat_*`, `SkillRankBonus_*`, `DamageType_*`, `WeaponDamage`.
- camelCase splitting and abbreviation expansion (`Crit` → `Critical Strike`, `C D` → `Cooldown`).

[`inferCat()`](src/lib/affixDb.ts) classifies into `stat | offense | defense | utility` based on substring heuristics. The category drives the chip color in [AffixChip.tsx](src/components/AffixChip.tsx) via `CAT_CLASSES` in [constants.ts](src/lib/constants.ts).

---

## UI architecture

```text
App
├── header (title + subtitle)
├── textarea + Parse / Example buttons
├── StatusBar      ← reflects useAffixDb() phase + pct
└── filter result
    ├── meta bar (filter name, active badge, rule count)
    └── RuleCard (×N)
        ├── header (color swatch · enabled dot · name · tags · chevron)
        └── body (when expanded)
            ├── meta strip (status, highlight hex)
            └── ConditionBlock (×N)
                ├── rarity pills          (filterType 1)
                ├── min quality tier      (filterType 2)
                ├── min item power        (filterType 0)
                ├── min greater affixes   (filterType 4)
                ├── item type chips       (filterType 5)
                └── AffixChip (×N)        (filterType 6)
```

State is intentionally minimal — the only stateful pieces are:

- `App` — the textarea content, the parsed filter, and any parse error.
- `RuleCard` — a per-card `open` boolean.
- `useAffixDb` — `{ db, phase, pct, newIds }`.

Everything else is derived during render.

---

## Styling system

The app uses **Tailwind CSS v4** via the `@tailwindcss/vite` plugin. The whole design system lives in [`src/index.css`](src/index.css):

- A `@theme {}` block defines a **Diablo gold/parchment palette** (`d4-bg`, `d4-gold`, `d4-text`, etc.) and rarity colors (`d4-mythic`, `d4-unique`, `d4-set`, `d4-leg`, `d4-ga`).
- Affix category colors (`d4-stat / offense / defense / utility`) drive `AffixChip` accents.
- Two custom keyframes (`fadeIn`, `pulse`) surface as `--animate-fade-in` and `--animate-pulse-slow` utilities.
- A small `@layer components` block defines `.btn-primary`, `.btn-secondary`, `.card`, `.tag`, `.cond-block`, and `.meta-label` so JSX stays compact.
- The body has a layered radial-gradient + an inline-SVG diamond pattern background for the Diablo "parchment" feel.

Typography:

- `font-cinzel` — display / headings / tags (Cinzel from Google Fonts).
- `font-crimson` — body copy (Crimson Pro from Google Fonts).

---

## Build & deployment

[`vite.config.ts`](vite.config.ts) is configured so `pnpm build` produces a **single self-contained `dist/index.html`**:

```ts
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [tailwindcss(), react(), viteSingleFile()],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100_000_000,   // inline everything
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
```

That single HTML file can be:

- Hosted on any static host (GitHub Pages, S3, Netlify, Cloudflare Pages…).
- Opened directly with `file://` (no build server required at runtime).
- Distributed as an attachment / archive / Discord upload.

The runtime still makes outbound `fetch` calls to `api.github.com` and `raw.githubusercontent.com` for live affix enrichment, but every request is opportunistic — the bootstrap data alone keeps the UI fully functional.

---

## Extending the project

### Add a new affix to the bootstrap table

Open [`src/lib/bootstrap.ts`](src/lib/bootstrap.ts) and add an entry to the `RAW` map:

```ts
"1234567": ["My Affix Name", "offense", "S99_MyAffix_Internal"],
```

Bump the cache version (`d4_affix_v5` → `d4_affix_v6`) in [`affixDb.ts`](src/lib/affixDb.ts) so existing clients pick it up.

### Support a new condition `filterType`

1. Extend `FilterCondition` in [`types.ts`](src/lib/types.ts) with the new discriminated field.
2. Populate it in `parseCondition` in [`proto.ts`](src/lib/proto.ts).
3. Add a label/icon entry to `COND_TYPES` in [`constants.ts`](src/lib/constants.ts).
4. Add a render branch to [`ConditionBlock.tsx`](src/components/ConditionBlock.tsx).

### Point the live-fetch at a different mirror

Edit the `REPOS` array at the top of [`affixDb.ts`](src/lib/affixDb.ts). Anything that mirrors the same `json/base/meta/Affix/*.aff.json` layout will work.

---

## Known limitations

- **No `.proto` source.** The decoder is reverse-engineered from real share codes; if Blizzard adds a new `filterType` or repurposes `field 4` again, parsing for that condition will silently degrade to `Condition active`.
- **GitHub API rate limits.** Unauthenticated callers get 60 requests/hour per IP. The Contents API call counts as 1; the per-file `raw.githubusercontent.com` downloads do not. The 6-hour cache normally keeps a single client well under the limit.
- **No support for newly added Item Types** until they are added to `ITEM_TYPES` in [`constants.ts`](src/lib/constants.ts) (the live-fetch layer only enriches affix data, not item-type data).
- **Browser only.** `atob`, `localStorage`, and DOM APIs are required — there is no Node-side parser exposed.

---

## Credits

- **Game data** — [`blizzhackers/d4data`](https://github.com/blizzhackers/d4data) and [`DiabloTools/d4data`](https://github.com/DiabloTools/d4data).
- **Wire-format reference** — [protobuf.dev encoding guide](https://protobuf.dev/programming-guides/encoding/).
- **Example filter** — *Raxx's Torment 6+ Filter* (bundled in [`constants.ts`](src/lib/constants.ts) as `EXAMPLE_FILTER`).
- **Stack** — Vite 8 · React 19 · TypeScript · Tailwind v4 · Biome · `vite-plugin-singlefile`.

Diablo® IV is © Blizzard Entertainment. This project is a fan-made, unaffiliated viewer for community filter share codes.
