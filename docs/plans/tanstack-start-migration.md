# Migration plan: Remix 3 → TanStack Start

Branch: `feat/tanstack-start-migration`. It is cut from `chore/remix-3-stable`, so the baseline has the fixed test suite (15 passing tests).

**Research** (primary sources only, 2026-10-03). The plan cites these by tag:

| Tag       | File                                                                 | Covers                                              |
| --------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| **[R§n]** | [`docs/research/tanstack-start.md`](../research/tanstack-start.md)   | TanStack Start; §14 is about RSC                    |
| **[V]**   | [`docs/research/vercel-platform.md`](../research/vercel-platform.md) | Vercel limits, CDN caching, Nitro preset, Analytics |
| **[A]**   | [`docs/research/component-audit.md`](../research/component-audit.md) | What each current module needs at runtime           |

## Goal

The same app on TanStack Start (React 19, Vite, Nitro on Vercel), following one rule:

> **Render on the server as much as possible: RSC first, SSR second, client-side last.**

Today the server renders an empty shell. All content renders in the browser after a 518 KB index download [A]. After the migration:

- **The viewer is fully server-rendered**, with names already resolved and no index download.
- **The editor stays a client app**, because it is genuinely interactive state, inside a server-rendered shell. Its index lookups move to the server.

Out of scope:

- Visual redesign. Styles move 1:1 (D1).
- The filter format and the parsing logic in `src/filter/`.
- Data sources.

## Rendering strategy

| Tier       | Status in Start                                                                                                                                                                                                                                          | What uses it                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **RSC**    | **Experimental**: "API may see refinements", "will remain so into early v1". Shipped as `@tanstack/react-start-rsc` 0.1.59 (first release 2026-04-10). RSC with Nitro on Vercel is undocumented, and two open issues are relevant (#7943, #7500) [R§14]. | The viewer's rule list (D2). Gated by the Phase 0 spike.                                                               |
| **SSR**    | Stable, the default [R§6]                                                                                                                                                                                                                                | Everything else. Also the fallback for the viewer if RSC fails the gate.                                               |
| **Client** | —                                                                                                                                                                                                                                                        | Only interactivity that can't be done with HTML: the sidebar toggle with its `motion` animation, and the whole editor. |

The viewer's rule components are written as **server-safe shared components** (no hooks, no browser APIs, data in through props). That way the RSC/SSR choice is a wiring decision at the route, not a rewrite. If RSC fails Phase 0, or regresses later, the same components render through plain SSR.

## Behavior contract

Before writing any code, inventory the URLs and behavior, then test both apps against the same contract [R§13]. **Changes on purpose are marked Δ**, and each one is listed under "Intentional behavior changes" below for sign-off.

| #   | Contract                                                                                                                                                                                                    | How we verify it                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| C1  | `GET /` returns 200; title "D4 Loot Filter Viewer — Diablo IV"                                                                                                                                              | route test                                       |
| C1Δ | `GET /?code=<b64>` returns 200 **with the rule cards in the HTML** (names resolved on the server). An invalid code renders the error banner in the HTML.                                                    | route test, viewing the page with JS disabled    |
| C2  | `GET /edit` returns 200; title "D4 Loot Filter Editor — Diablo IV"                                                                                                                                          | route test                                       |
| C2Δ | `GET /edit?code=<b64>` opens the editor seeded with that filter, so it **survives refresh**                                                                                                                 | route test + browser                             |
| C3Δ | `GET /api/toc` returns 200 JSON with: `Cache-Control: public, max-age=1800` (browser), `Vercel-CDN-Cache-Control: max-age=2592000, stale-while-revalidate=86400` (CDN) and `Vercel-Cache-Tag: toc`. See D4. | route test; `x-vercel-cache: HIT` on the preview |
| C4  | Head tags on both pages: description, robots, theme-color, canonical (current URL without query or hash), og:\*, twitter:\*, favicon                                                                        | head snapshot test                               |
| C5Δ | Viewer: Parse, Load Example and Undo/Redo. Each parse is a URL, so Undo/Redo map to browser history. Works without JS.                                                                                      | browser, with JS on and off                      |
| C6Δ | View → Edit carries the filter through the URL (`/edit?code=…`), and Edit → View carries the **edited** filter back                                                                                         | browser                                          |
| C7  | Editor: add, duplicate, remove and move rules; edit conditions and pickers; import and export base64; undo/redo; the export round-trips through `parseFilterB64`                                            | unit + browser                                   |
| C8  | Sidebar collapse/expand with the `motion` animation; mobile layout at ≤700px; status bar shows "Index ready · N affixes · M items"                                                                          | browser (desktop + 390px)                        |
| C9  | Fonts (Exocet, Old Fenris) and favicon load; no console errors or hydration warnings; Vercel Analytics and Speed Insights load in production                                                                | browser + Vercel preview                         |
| C10 | `pnpm seed` regenerates the TOC seed                                                                                                                                                                        | run it                                           |

### Intentional behavior changes (all approved 2026-10-03)

1. **The viewer state lives in the URL.**
   - Parse navigates to `/?code=…`, so a filter becomes a shareable, bookmarkable link that survives refresh.
   - Undo/Redo become browser Back/Forward. The buttons stay and call `history.back()`/`history.forward()`.
   - Filter codes above Vercel's **14 KB URL limit** [V] can't use the URL; see D3.
2. **Handoff through the URL instead of memory.** **Fix bug #1: approved 2026-10-03.** Edit → view → edit must no longer overwrite your edits with the viewer's filter [A]. This fix is required even if change 1 is not approved; in that case, the editor only loads the viewer's filter when you explicitly hand it over.
3. **Viewer cards use native `<details>`.** Collapsed content becomes searchable with Ctrl-F. The open animation is kept only where `::details-content` is supported (Chromium) [A].
4. **Fix bug #2: approved 2026-10-03.** After `RuleEditor`'s ▲/▼, the moved rule stays selected, matching the sidebar arrows.
5. **The `<noscript>` text** changes from "requires JavaScript" to say only the editor needs JavaScript.

## Target stack

Pin exact versions, because Start publishes almost daily [R§1].

| Package                                            | Version                                                                                                                                                                                                           | Notes                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `@tanstack/react-start`                            | 1.168.60                                                                                                                                                                                                          | Release Candidate. The docs call its API "considered stable" [R§1]. |
| `@tanstack/react-router`                           | 1.170.41                                                                                                                                                                                                          |                                                                     |
| `@tanstack/react-start-rsc` + `@vitejs/plugin-rsc` | 0.1.59 + 0.5.35                                                                                                                                                                                                   | **Only if the Phase 0 RSC gate passes** [R§14]                      |
| `react`, `react-dom`                               | 19.3.0                                                                                                                                                                                                            | Stable releases are enough for RSC; no canary needed [R§14]         |
| `vite` + `@vitejs/plugin-react`                    | 8.3.2 + ^6                                                                                                                                                                                                        |                                                                     |
| `nitro`                                            | 3.0.260903-beta                                                                                                                                                                                                   | The documented Vercel path, and a **beta** [R§9]                    |
| `vitest`, `@testing-library/react`, `jsdom`        | latest                                                                                                                                                                                                            | Replaces `remix test` [R§11]                                        |
| Kept                                               | `zod` 4, `motion` (client components only [R§14]), `@vercel/analytics/react`, `@vercel/speed-insights/react` [V]                                                                                                  |                                                                     |
| Removed                                            | `remix`, `@oxc-project/runtime`, all 10 `optionalDependencies` (Linux native bindings), `scripts/fix-package-tsconfigs.mjs`, `scripts/sync-vercel-traces.mjs`, `server.ts`, `vercel.json`, `.agents/skills/remix` |                                                                     |

## Target structure

```
src/
  router.tsx                     # getRouter(): new router per request [R§3]
  start.ts                       # createStart() only if needed (adds CSRF middleware manually) [R§5]
  routeTree.gen.ts               # generated, committed
  routes/
    __root.tsx                   # shellComponent: <html>, <HeadContent/>, <Scripts/>, theme.css, <Analytics/>, <SpeedInsights/>
    index.tsx                    # /      validateSearch {code?, example?} → loader parses on server → RuleList (RSC or SSR)
    edit.tsx                     # /edit  validateSearch {code?} → loader seeds editor + resolves labels → <Editor/> (client)
    api/toc.ts                   # GET /api/toc server route (D4)
  filter/                        # ← app/filter/** unchanged (isomorphic)
  data/
    toc.server.ts                # ← app/data/toc.ts (upstream fetch/build)
    toc-cache.server.ts          # ← app/data/toc-cache.ts (stale-while-revalidate cache, bundled seed)
    toc-index.server.ts          # memoized id→entry Maps over getCachedTocData() (← toc-store.ts lookups)
    toc-seed.json                # ← public/data/toc.json (D5)
    toc.functions.ts             # createServerFn: searchToc(kind, query), resolveLabels(ids) (D6)
  viewer/                        # server-safe shared components (no hooks, no browser APIs)
    rule-list.tsx, rule-card.tsx, condition-block.tsx, affix-chip.tsx, status-bar.tsx  + *.module.css
    sidebar-shell.tsx            # 'use client': sidebar state + motion; server content as children
  editor/                        # client components
    editor.tsx, rule-editor.tsx, condition-editor.tsx, multi-picker.tsx, modals.tsx  + *.module.css
    editor-store.ts, history.ts  # ← app/state/editor-store.ts, subscribe.ts (+ useStore hook)
  ui/                            # shared server-safe: site-footer, icons, rule-tags, quality-glow, seo
  styles/theme.css               # tokens, @font-face, keyframes, globals
test/                            # vitest
public/                          # fonts, favicon, icons.svg
vite.config.ts
```

Deleted, with nothing replacing them:

- `app/state/filter-store.ts`: the URL is the viewer state.
- `app/state/toc-store.ts`: replaced by the server-side index.
- both `bind-dom.ts` files [A].

## Decisions

**D1. Styling: CSS Modules plus CSS custom properties.** Decided 2026-10-03.

- Each of the 177 `css({...})` mixins becomes a class in a co-located `*.module.css`. The nesting and the two media queries are native CSS.
- Dynamic styles (`qualityGlow` per tag, rule color, `animationDelay`) become `data-*` attributes and custom properties.
- CSS Modules are documented as working inside server components [R§14].
- Chosen to keep the migration mechanical. It may limit future styling choices, but the future isn't known yet, and Tailwind can still be added alongside later.

**D2. The viewer is server-rendered, as RSC if the gate passes.**

- **Loader:** the `/` loader validates `?code` with zod and parses it on the server with `parseFilterB64` (`proto.ts` is server-safe [A]). It resolves every affix, item, item-type and talisman-set name from `toc-index.server.ts`. A parse error becomes loader output, rendered as the `role="alert"` banner.
- **With RSC:** the loader returns `renderServerComponent(<RuleList …/>)`. The rule-card, condition-block and affix-chip code, the zod schemas and the name data never reach the browser [R§14].
- **Fallback (SSR):** the same components render from loader data. The HTML stays the same, but the component code and the resolved data are also shipped for hydration.
- **Client part:** a single client component, `SidebarShell` (open/closed state plus `motion`), takes the server-rendered sidebar and main content as children (the "client layout with server children" pattern) [A].
- **No client JS for:** rule-card expand/collapse (`<details>`), Parse (`<form method="get">`), Load Example (`?example=1`), or the Edit/View links.

**D3. Large filter codes (over 14 KB).**

- `GET /?code=` covers typical codes (the example is 1.3 KB) [V].
- For larger codes, the form POSTs to a server function that renders the same result. A POST response isn't CDN-cacheable or shareable, which is acceptable for rare oversize filters [V]. The URL keeps a short marker.
- **Open:** how large do real filters get? If no real filter comes close to 14 KB, drop the POST path.

**D4. `/api/toc` caching: server-side as much as possible.** Decided 2026-10-03, header form refined by [V].

- Separate browser and CDN headers. This avoids Vercel's ambiguous `s-maxage` handling inside plain `Cache-Control` [V]:
  ```
  Cache-Control:            public, max-age=1800
  Vercel-CDN-Cache-Control: max-age=2592000, stale-while-revalidate=86400
  Vercel-Cache-Tag:         toc
  ```
- **CDN: one month.** Browsers: 30 minutes. Vercel compresses the JSON itself, so the app must not [V].
- **Refreshing after a game patch:** run `vercel cache invalidate --tag toc`, with no redeploy needed. A deploy also starts with a cold cache, because the cache is per deployment [V].
- The response must never set cookies, because any `set-cookie` disables CDN caching [V].
- After this migration no part of the app fetches `/api/toc` itself (D2, D6). It stays as a public endpoint for compatibility, and as the cheap path for a client-side index if one is ever needed.
- **Do not** use Nitro `swr` route rules: on Vercel they become never-expiring ISR [V].

**D5. Bundle the seed data.**

- `toc-cache.ts` currently reads `public/data/toc.json` through `fs` at runtime, which only works because of `vercel.json`'s `includeFiles`. Under Nitro, `public/` goes to the CDN [R§9].
- The server module imports `toc-seed.json` instead: 518 KB raw, 63 KB gzipped. This also avoids the cold-start blocking fetch the audit flags [A].
- `pnpm seed` writes to `src/data/toc-seed.json`.

**D6. The editor is a client app inside a server shell, and its index lookups move to the server.**

- **What stays client-side:** the editor's working state (rules, 50-step undo/redo, selection, drag-and-drop, modals, clipboard) [A]. It is SSR'd from loader data and then hydrated.
- **Loader:** the `/edit` loader parses `?code` and resolves labels for the ids already in the filter.
- **`MultiPicker` search:** calls a server function, `searchToc(kind, query)`, debounced and returning the top 80 matches, which is the current cap [A]. This replaces the client index download.
- **Risk:** issue **#7943** (a server function imported only from `'use client'` modules is missing in production builds) hits exactly this pattern [R§14].
  - Phase 0 tests it.
  - Mitigation: also import `searchToc` from the route module.
  - Fallback if needed: load `/api/toc` lazily on `/edit` only. It's CDN-cached, so this is cheap.

**D7. Keep SSR as the default and keep the stores out of the server.**

- Module-level client stores (`editorStore`) are only touched in client components and effects.
- Server rendering reads only loader data.
- `useSyncExternalStore` replaces the subscribe-once flags, which fixes the audit's existing bug #3 [A].

**D8. TypeScript and tsconfig.**

- Follow Start's tsconfig: `moduleResolution: Bundler` and `jsx: react-jsx`.
- **Drop `verbatimModuleSyntax`.** It can leak server bundles into client bundles [R§2].
- Keep TS 7, as the examples do [R§2]. Phase 0 verifies it.

**D9. Fix CI.**

- `.github/workflows/ci.yml` uses npm, but the repo has only `pnpm-lock.yaml`. CI has failed on every run since at least August 2026.
- Switch it to `pnpm/action-setup` + `pnpm install --frozen-lockfile`.

**D10. Static asset caching.**

- With Nitro's default output, `public/` files and Vite chunks get no `Cache-Control` [V].
- Add explicit route rules for hashed assets (`immutable`) and the fonts, then verify the headers on the preview.

**D11. In-place rewrite on this branch, in phases.**

- Each phase ends green (typecheck plus tests), so the branch can be bisected.
- `main` stays deployable on Remix 3 until Phase 8 passes.

## File-by-file mapping

| Current                                                                                    | Target                                                                             | Effort       |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------ |
| `app/filter/*`                                                                             | `src/filter/*`                                                                     | Move only    |
| `app/state/subscribe.ts`, `editor-store.ts`                                                | `src/editor/history.ts`, `editor-store.ts` + `useStore` hook                       | Small        |
| `app/state/filter-store.ts`, `toc-store.ts`                                                | Deleted. Replaced by URL state and `toc-index.server.ts`.                          | Removes code |
| `app/actions/*/bind-dom.ts`                                                                | Deleted                                                                            | Removes code |
| `app/data/toc.ts`, `toc-cache.ts`                                                          | `src/data/*.server.ts` + `toc-index.server.ts`, `toc.functions.ts`                 | Small–medium |
| `app/actions/controller.tsx`                                                               | `routes/index.tsx`, `edit.tsx`, `api/toc.ts` (loaders + server route)              | Small        |
| `app/ui/document.tsx`                                                                      | `__root.tsx` `head()` + `shellComponent`, `styles/theme.css`, `ui/seo.ts`          | Medium       |
| `app/actions/home/app.tsx` + `ui/rule-card`, `condition-block`, `affix-chip`, `status-bar` | `src/viewer/*` (server-safe components) + `sidebar-shell.tsx`                      | **Large**    |
| `app/actions/edit/app.tsx` (801 lines) + `ui/editor/*`                                     | `src/editor/*`, split along its existing sections (rule list, editor pane, modals) | **Largest**  |
| `test/proto.test.ts`                                                                       | Vitest, assertions unchanged                                                       | Trivial      |
| `test/routes.test.ts`                                                                      | Vitest: loaders, server route, rendered head and HTML                              | Small        |
| `AGENTS.md`, README                                                                        | Rewritten for Start                                                                | Small        |

## Phases

Each phase ends with typecheck plus tests green and its own commit. **Bold** items are go/no-go gates.

0. **Spike: prove the platform (go/no-go).**
   - Scaffold Start next to Remix: `vite.config.ts` (`tanstackStart({ rsc: { enabled: true } })`, `rsc()`, `nitro()`, `viteReact()`), `__root.tsx`, `router.tsx`, and three probes:
     - **(a)** `/spike-rsc`: a loader returning `renderServerComponent(...)` that uses a CSS Module and embeds a `'use client'` child using `motion`.
     - **(b)** a `'use client'` component calling a server function imported _only_ there, to reproduce #7943.
     - **(c)** `api/toc` with the D4 headers.
   - Verify that `vite dev` and `vite build` work, that TS 7 `tsc --noEmit` passes on `routeTree.gen.ts`, and that pnpm 12 installs with no peer-dependency problems.
   - **Deploy a Vercel preview.** I'll ask before deploying. Check:
     - that the Framework Preset is detected [R§9];
     - that (a) renders in production;
     - (b)'s outcome;
     - `x-vercel-cache` turns HIT on repeated `/api/toc` requests, the browser sees `max-age=1800`, and the response is compressed [V];
     - `Cache-Control` on the fonts and chunks.
   - **Outcomes:**
     - **RSC gate passes:** D2 as written.
     - **RSC gate fails:** D2's SSR fallback (drop the RSC packages). No other part of the plan changes.
     - **Nitro or the deploy fails:** stop and reassess before writing any UI.
       **Phase 0 results: local (2026-10-03)**
   - ✅ **Install:** pnpm 12 installs the pinned stack (React 19.3.0, Vite 8.3.2, Start 1.168.60, Router 1.170.41, plugin-rsc 0.5.35, Nitro 3.0.260903-beta) with no peer-dependency warnings. The Remix suite still passes 15/15 alongside it.
   - ✅ **Build and typecheck:** `vite build` succeeds, and so does TS **7.0.2** `tsc -p src --noEmit` on `routeTree.gen.ts`. No TS 6 alias is needed.
   - ⚠️ **Finding: Nitro auto-detects a root `server.ts` as a catch-all server entry that runs before the renderer.** The first build bundled the Remix server, so it would have served Remix. Fixed with `nitro({ serverEntry: false })` while Remix still lives in the repo. Phase 7 deletes `server.ts`.
   - ✅ **(a) RSC:** passes in the production build, and dev SSR renders it too.
     - The server HTML contains the server component's markup with scoped CSS Module classes, and its stylesheet is linked.
     - The embedded `'use client'` child hydrates, and its `motion` animation runs.
     - Client-side navigation into the route works (the loader runs in the browser, then the server function, then Flight).
     - No console errors.
   - ✅ **(b) #7943 does not reproduce** for our pattern: a server function imported only from a `'use client'` component in the hydrated tree, which is where `MultiPicker` lives. It works in the production build. Not tested: a client component nested _inside_ an RSC that calls a server function.
   - ✅ **(c) `/api/toc`:** serves the full 518,211-byte bundled seed with the D4 headers locally. CDN behavior is verified on the preview.
     **Phase 0 results: Vercel preview (2026-10-03)** → **gate PASSED: proceed with D2 as RSC.**
   - ✅ **Build:** succeeds with `vercel.json` `{"framework":"tanstack-start","buildCommand":"pnpm start:build"}` on this branch. The explicit build command is needed because the preset runs `build`, which is still the Remix trace script until Phase 7. `main` and the dashboard preset are untouched. Previews are behind Deployment Protection, so checks use a bypass header.
   - ✅ **(a), (a′) and (b) pass on Vercel**, identical to local, with no console or network errors.
   - ✅ **D4 verified:**
     - `/api/toc` goes `x-vercel-cache: MISS → HIT → HIT` with an increasing `age`.
     - Browsers receive only `cache-control: public, max-age=1800`. Vercel consumes `Vercel-CDN-Cache-Control`.
     - The CDN compresses the response with Brotli (`content-encoding: br`).
     - This resolves research open questions Q5 and [V]'s "what the browser receives".
   - ✅ **Hashed `/assets/*` chunks** already get `public, max-age=31536000, immutable`.
   - ⚠️ **D10 confirmed:** `public/` files (fonts, favicon) get `public, max-age=0, must-revalidate`, so browsers revalidate the fonts on every visit. Phase 3 adds caching rules for them.

1. **Core move.**
   - `git mv` `app/filter` → `src/filter`.
   - Move the editor store and history, and add `useStore`.
   - Port `proto.test.ts` to Vitest. Add store tests for undo/redo and `loadFilterIntoEditor`.
2. **Data and API.**
   - Write `toc-*.server.ts` with the bundled seed (D5), `toc-index.server.ts`, and `toc.functions.ts`.
   - Write `routes/api/toc.ts` (D4).
   - Tests: index lookups, `searchToc`, the `/api/toc` headers (C3Δ), and `pnpm seed` (C10).
     **Phase 2 results (2026-10-03)**
   - ✅ **Moves:** `app/data/{toc,toc-cache}.ts` → `src/data/*.server.ts` and `public/data/toc.json` → `src/data/toc-seed.json`, all as `git mv`. The seed is a bundled JSON import (D5). Remix's `/api/toc` keeps working on the moved cache.
   - ✅ **New files:** `toc-index.server.ts` (memoized index, plus search and label resolution matching the old picker: case-insensitive substring, selected ids excluded, index order, cap 80), `toc.functions.ts` (`searchToc` and `resolveToc`, zod-validated and bounded), and the real `routes/api/toc.ts` with the D4 headers.
   - ✅ **Production build:** the client bundle contains no server-only code. The real `searchToc` works from a client component (#7943 probe).
   - ⚠️ **Finding: RSC mode instantiates server modules twice.** Server functions run in the react-server build environment and server routes in SSR, so `toc-cache.server.ts` was bundled into both, each with its own module-level cache (two seed parses, two background revalidations, possibly different data served).
     - Fixed by keeping the cache on `globalThis` under `Symbol.for('d4-filter-viewer.toc-cache')`.
     - `test/toc-cache.test.ts` simulates two module instances. It fails with a module-level cache and passes with the fix.
     - **Rule for later phases:** any server-side singleton state must live on `globalThis` this way.
   - ✅ **`pnpm seed [output-path]`** writes `src/data/toc-seed.json` (C10), verified against live upstream data.
     - It also shows the committed seed is 81 days stale: 4,251 affixes / 1,088 items vs 4,366 / 1,133 upstream. Refreshing it is a data change, so it's left to you.
   - ℹ️ **Many affixes share a label** ("Critical Strike Chance" appears 22 times, with different ids). The old picker shows the same duplicates; kept for parity and raised for Phase 6.

3. **Shell.**
   - `__root.tsx`: `head()` defaults, per-route title and canonical overrides, `theme.css` and fonts, Analytics and Speed Insights.
   - D10 route rules.
   - Head snapshot test (C4).
     **Phase 3 results (2026-10-03)**
   - ✅ **C4:** the `<head>` of `/` and `/edit` is **identical** to the live Remix app, 16 of 16 tags compared after normalizing the origin.
     - Canonical and `og:url` drop the query (`/?code=abc` → `/`), using the request origin, which the root loader resolves with `createIsomorphicFn` (server: `getRequestUrl()`, client: `location.origin`).
     - `src/ui/seo.ts` reproduces `DocumentHead`, and `test/seo.test.ts` locks it in.
   - ✅ **Shell:** `__root.tsx` renders the skip link, the `<noscript>` text (change #5), the footer (ported to a CSS Module), `<Analytics/>` and `<SpeedInsights/>`.
     - Browser check on both pages: theme tokens, body styles, both fonts loaded, no console errors.
     - The `/_vercel/*` analytics scripts 404 locally, as expected; they only exist on Vercel.
   - ✅ **`theme.css`:** ported 1:1 from `document.tsx`'s global styles plus `themeVars` and `pageStyle`. Tokens are on `:root` instead of a `body` class, which cascades the same way.
   - ✅ **D10, revised:**
     - **Fonts** are referenced from `theme.css` by relative path, so Vite fingerprints them into `/assets/`, which Vercel serves `immutable`. That's better than a short cache rule on unhashed files.
     - The **favicon** can't be hashed, so it gets a Nitro route rule: `max-age=86400, stale-while-revalidate=604800`.
     - The font files are _copies_ in `src/styles/fonts/`; Remix still serves the `public/` originals.
   - ⏳ **Preview checks** (favicon header, `immutable` on the fonts, analytics scripts loading) wait for the next push, or Phase 8.

4. **Viewer, server side.**
   - `src/viewer/*` as server-safe components with CSS Modules, the `/` loader (parse plus name resolution), the form, `?example=1`, `<details>` cards, the error banner, the status bar, and the D3 oversize path.
   - Route tests on the HTML (C1Δ, C5Δ with JS disabled).
     **Phase 4 results (2026-10-03)**
   - ✅ **Server-rendered viewer, `/?code=…` (C1Δ):** the `getViewer` server function parses on the server, resolves names (`namesForFilter`), and renders `RuleList` as an RSC (D2).
     - The example's 16 cards are in the server HTML as `<details>`, with 0 unresolved names.
     - An invalid code renders the `role="alert"` banner. No code renders the empty glyph.
     - Works with JS disabled; checked with plain HTTP.
   - ✅ **Parity with the live Remix app:**
     - The **text of all 16 cards (expanded) and the header is identical**.
     - Screenshots at 1400×1000 are visually identical, except the collapse button and Undo/Redo, which come in Phase 5.
   - ✅ **RSC payoff:** none of the card, condition or chip components, tag rules, parser or name data is in the client JS. Total client JS is 158 KB gzip across all chunks; Phase 8 compares it with Remix.
   - ✅ **With JS:** hydration is clean (no console warnings). `<details>` toggles, Parse (native GET form) and Load Example (a link) work, and browser Back restores the previous filter (change #1).
   - **Design notes:**
     - **`FilterNames`:** components take a small per-filter name map instead of the index, so the SSR fallback stays viable.
     - **Cascade layers** (`ui.base` < `ui.component` < unlayered globals) reproduce Remix's mixin cascade.
     - **Status bar:** the age and count formatting are computed on the server with a fixed `en-US` locale, avoiding hydration mismatches. Remix formatted counts in the viewer's own locale.
     - **"Unknown affix" replaces "resolving…"**, since the server always has the index.
   - ⏭️ **Moved to Phase 5** (both need client JS):
     - **The mobile sidebar toggle.** Without JS the sidebar stays hidden at ≤700px, as in Remix, where the hamburger also needs JS.
     - **D3's oversize path** for codes over the 14 KB URL limit.

5. **Viewer, client side.**
   - `SidebarShell` with `motion`, and the Undo/Redo buttons using history.
   - Browser checks: C5Δ and C8 with JS enabled.
     **Phase 5 results (2026-10-03)**
   - ✅ **Client shell in the route component:** the route component is a normal hydrated component, so no `'use client'` boundary is needed; only `RuleList` is an RSC. `useSidebar` ports HomeApp's three-state sidebar and its `motion` animations: mobile top bar, hamburger, backdrop, desktop collapse and reopen.
   - ✅ **In-app navigation:** Parse (`navigate`), Load Example and Edit (`<Link>`), Undo and Redo ran with **0 full document loads**. The form keeps `method="get"`, so without JS it still works as in Phase 4.
   - ✅ **Undo/Redo** are `history.back()`/`history.forward()`. They render disabled on the server, as Remix's did on a fresh page, then follow the Navigation API's `canGoBack`/`canGoForward`, or are simply enabled where it's unsupported.
   - ✅ **D3:** codes whose encoded URL is over 12,000 characters go through `postViewer`. A generated 192-rule, 16 KB code rendered all 192 cards.
     - Known limitation: the address bar keeps the previous URL while an oversized result is shown, and that result isn't linkable or editable through `/edit?code=`.
   - ✅ **Checked in headless Chrome:** desktop (1400×1000) and mobile (390×844) interactions, with no console errors. Mobile screenshots with the drawer open are identical to Remix.
   - `/edit` now validates `?code`, ready for Phase 6.

6. **Editor.**
   - The `/edit` loader (C2Δ) and the client components. Split `EditApp` and add `MultiPicker` → `searchToc`.
   - Add the View link carrying the edited code (C6Δ).
   - Covers C7.
   - **Bug #1 fix + regression test:** load a filter, edit it, go to View, go back to Edit, and assert the edits are still there.
   - **Bug #2 fix + regression test:** with rule _i_ selected, press its ▲/▼ in `RuleEditor`, and assert that the selection is now _i∓1_ and shows the same rule.
     **Phase 6 results (2026-10-03)**
   - ✅ **Server-rendered editor (C2Δ).** `getEditor` parses `?code` and resolves picker labels on the server.
     - `/edit?code=…` HTML contains all 16 rule rows and the filter name, with 0 hex-fallback labels.
     - An invalid code renders the error banner.
   - ✅ **Hydration-safe state (`editor-state.tsx`).** Components read `useEditor`/`useTocLabel`. The server and the hydration pass use the loader's data; afterwards the live client stores take over. Server-side stores are never written (D7).
     - On client navigation the loader loads the editor store before render; on full page loads the first render does.
     - No console warnings.
   - ✅ **Bug #1 fixed.** Edit → View → Edit keeps edits _and_ undo history: the View link carries the edited code, and the bootstrap skips reloading an identical filter. Verified in a browser (one Undo after the round trip restores the old name) and in `test/editor-state.test.ts`.
   - ✅ **Bug #2 fixed.** `RuleEditor`'s ▲/▼ call `onMove`, and the moved rule stays selected. Verified in a browser and in `selectionAfterMove` tests.
   - ✅ **Pickers (D6).** They search with the `searchToc` server function (debounced, stale responses dropped) and resolve missing labels with `resolveToc`. The 518 KB TOC is no longer downloaded on any page.
   - ✅ **Ports:** EditApp (sidebar with drag-and-drop and keyboard reordering, toolbar, footer, main pane) and its Import/Export dialogs (focus on open, Tab trap, Escape, focus return). The three leaf components were ported by a sub-agent and reviewed. In-app steps made 0 full document loads.
   - ✅ **Screenshots** at 1400×1000 are identical to Remix with one exception, a **Remix bug the port fixes**: Remix's condition-type `<select>` displayed "Item Power" for a rarity condition (filterType 1, which the viewer labels "Item Rarity"); React's controlled `value` shows the right option.
   - **Removed** the Import dialog's "import from the Viewer" link. The viewer's state is now its URL, and View → Edit carries it.
   - Tests: 77 Vitest + 3 Remix.

7. **Cleanup.**
   - Delete `app/`, `server.ts`, `vercel.json` (keep `{"framework":"tanstack-start"}` only if Phase 0 needed it), the workaround scripts, the Remix and native-binding deps, and `.agents/skills/remix`.
   - Rewrite `AGENTS.md` and the README.
   - Fix CI (D9).
   - Also delete:
     - the spike probes (`src/spike/`, `routes/spike-*`);
     - the `public/` font originals (copied to `src/styles/fonts/` in Phase 3);
     - `public/icons.svg`, which nothing references;
     - `nitro({ serverEntry: false })` once `server.ts` is gone;
     - `test/remix/`, the `remix test` half of `pnpm test`, and the root Remix tsconfig.
       **Phase 7 results (2026-10-03)**
   - ✅ **Deleted:** `app/`, `server.ts`, the Remix tests, the spike probes, the two workaround scripts, the `public/` font originals, the unused `icons.svg`, the beta Remix agent skill, and `nitro({ serverEntry: false })`.
   - ✅ **Dependencies:** removed `remix`, `@oxc-project/runtime` and all 10 native-binding `optionalDependencies`, plus their `minimumReleaseAgeExclude` entries.
     - `.npmrc` (`shamefully-hoist`, a Remix-template leftover) is gone. A clean install, build, typecheck and all tests pass without hoisting, so no undeclared dependencies were hiding behind it.
   - ✅ **One root `tsconfig.json`** (Start settings, TS 7), replacing the Remix, `src/` and `test/` configs.
   - ✅ **Scripts are plain Start:** `dev`, `build` (`vite build`), `start`, `test` (`vitest run`), `typecheck`, and `seed`, which now runs on Node 24's native TypeScript support (verified against live upstream).
   - ✅ **`vercel.json`** keeps only `framework: tanstack-start` and a pnpm install command; the build is the default `pnpm build`.
   - ✅ **CI (D9)** uses pnpm (`pnpm/action-setup`, version from `packageManager`) and runs typecheck, test and build.
   - ✅ **`AGENTS.md` and the README** are rewritten for Start, with the conventions learned during the migration: `*.server.ts`, `globalThis` singletons, loader-driven hydration, cascade layers, cache headers.

8. **Verification (merge gate).**
   - Run the full C1–C10 contract in a real browser at desktop and 390px widths, and with JS disabled for the viewer.
   - Vercel preview: Analytics events, no console errors or hydration warnings, the `/api/toc` cache headers and HIT, and the static-asset headers.
   - Compare JS and CSS transfer size and Lighthouse scores against the Remix deploy. Expect much less JS on `/`, and no 518 KB index download on either page.
   - The PR includes the results.

   **Phase 8 results, local part (2026-10-03).** Remix production (`diablo4-loot-filter-viewer.vercel.app`) vs the Start production build, both in headless Chrome at 1400×1000 with the cache disabled. Sizes are uncompressed, because the local build isn't behind Vercel's compression:

   | Per page                  | Remix                 | Start                        |
   | ------------------------- | --------------------- | ---------------------------- |
   | JS                        | 1,213 KB in 427 files | 461–479 KB in 5 files (−62%) |
   | `/api/toc` download       | 506 KB on every page  | 0 KB on every page           |
   | Requests                  | ~430                  | ~11                          |
   | Rule cards in server HTML | none                  | all                          |

   FCP isn't comparable (remote vs localhost); it is measured on the preview. Still pending on the preview: the full C1–C10 run, Analytics events, cache headers for the favicon, fonts and `/api/toc`, and Lighthouse.

   **Phase 8 results, Vercel preview (2026-10-03)** → **merge gate PASSED.**
   - ✅ **C1–C9 in headless Chrome** on the preview: the Phase 4–6 viewer, client-shell, editor and bug-#1 scripts re-ran unchanged, with results identical to local, 0 full page loads, and no console errors.
   - ✅ **C4:** the `<head>` of both pages is identical to Remix _production_ (16 of 16 tags).
   - ✅ **C3Δ / D4:** `/api/toc` is served `x-vercel-cache: HIT` with an increasing `age`; browsers see `max-age=1800`, Brotli-compressed.
   - ✅ **D10:** CSS, JS and fonts are `public, max-age=31536000, immutable` (Remix production serves its fonts with `max-age=0`). The favicon gets `max-age=86400, stale-while-revalidate=604800`.
   - ✅ **C9 Analytics:** the Insights and Speed Insights scripts load (200) and initialize (`window.va`).
     - Neither Remix production nor the preview sends a page-view beacon to headless Chrome, so the setup matches production. Confirm real page views in the Vercel dashboard after a normal browser visit.
   - ✅ **Performance on Vercel** (median of 3, cache disabled, Remix production vs Start preview):
     - Transferred: 881–885 KB → **456–462 KB**, about half.
     - The 518 KB index download is gone from every page.
     - FCP/LCP is roughly even (viewer 252 vs 284 ms, editor 228 vs 204 ms). Start's viewer paint already contains the rule cards, which Remix renders later in the browser after downloading the index. Lighthouse was not run.
   - C10 (`pnpm seed`) was verified in Phase 7.

## Risks

| Risk                                                                                  | Likelihood | Mitigation                                                                                                                     |
| ------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| RSC is experimental: an unstable API, an undocumented Vercel path, open issues [R§14] | **High**   | Use it only for the viewer's rule list, behind the Phase 0 gate. Keep the components server-safe so SSR is a drop-in fallback. |
| #7943 breaks `searchToc` from `MultiPicker` in production [R§14]                      | Medium     | Reproduced in Phase 0 (b). Import the function from the route module too. Fallback: lazy `/api/toc` on `/edit`.                |
| #7500: server functions can't use `react-dom/server` when RSC is on [R§14]            | Low        | The app's server functions don't need it. Watch for libraries that do.                                                         |
| Nitro beta, flagged "under active development" [R§9]                                  | Medium     | Phase 0 deploys before any UI work. Pin the version.                                                                           |
| Start RC with near-daily releases [R§1]                                               | Medium     | Pin exact versions and upgrade on purpose.                                                                                     |
| Vercel misdetects the framework because of the Remix history [R§9]                    | Medium     | Check the dashboard preset in Phase 0. `vercel.json` `framework` is the fallback.                                              |
| Filter codes over 14 KB [V]                                                           | Unknown    | D3's POST path. Measure real filter sizes.                                                                                     |
| Styling drift across 177 mixins                                                       | Medium     | Move CSS one-to-one. Compare screenshots before and after.                                                                     |
| Hydration mismatches in the editor (`Date.now()`, store state)                        | Medium     | Server rendering reads only loader data. Watch the console in Phase 8.                                                         |
| TS 7 tooling gaps [R§2]                                                               | Low        | Verified in Phase 0. Fallback is the examples' TS 6 alias.                                                                     |

## Open questions for you

1. ~~D1 styling~~: decided, CSS Modules.
2. ~~D4 `/api/toc` cache~~: decided, CDN one month and browser 30 minutes. The header form follows [V].
3. ~~Sign off on the intentional behavior changes 1–5~~: all approved 2026-10-03.
4. **D3:** do you know roughly how large real filter codes get? If none come near 14 KB, I'll drop the POST path.
5. Are the commented-out Analytics/Speed Insights calls in `app/assets/entry.ts` and the `trace-deps` import in `server.ts` intentional? The plan keeps Analytics (C9), and Phase 7 deletes both files either way.
