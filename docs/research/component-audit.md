# Component audit: what can render where

Audited 2026-10-03 on `feat/tanstack-start-migration` (still Remix 3 code). For every UI module this records which state, events, browser APIs and TOC lookups it actually uses. That decides its target under the "RSC first, SSR second, client last" direction. Line references point at the Remix code.

## Target per module

| Module | Hydrated today? | Target | Why client JS is needed (if at all) |
|---|---|---|---|
| `HomePage` (`app/actions/home/page.tsx`) | no | Server | — |
| `HomeApp` (`app/actions/home/app.tsx`, 345 lines) | yes (whole page) | Server, plus one client child | Only the sidebar open/close state and its `motion` animation (`:42-62`) need JS. That state affects the `aside`, the `main` grid column and the backdrop, so the client part wraps the layout and takes server-rendered content as children. Alternative: a single `data-sidebar` attribute that CSS reacts to. |
| `app/actions/home/bind-dom.ts` | part of the island | **Deleted** | Parse/Example/Undo become a native `<form method="get">`, links, and browser history. |
| `EditPage` (`app/actions/edit/page.tsx`) | no | Server | — |
| `EditApp` (`app/actions/edit/app.tsx`, 801 lines) | yes | Client (SSR + hydrate) inside a server shell | Editor store CRUD + undo, `selectedRuleIndex`, drag-and-drop, import/export modals with focus trap, clipboard, `motion` |
| `app/actions/edit/bind-dom.ts` | part of the island | Folded into the editor component | blur→`setFilterName`, undo/redo buttons |
| `Document` (`app/ui/document.tsx`) | no | Server (`__root.tsx` shell + `head()`) | — |
| `SiteFooter`, icons | no | Server / shared | — |
| `StatusBar` | inside HomeApp | Server | The "Loading index…" state goes away, because the server always has the TOC. |
| `RuleCard` | yes (nested island, props passed as a `ruleJson` string) | Server, using `<details>/<summary>` for expand/collapse | None. Styles driven by `open` move to `[open]` selectors. |
| `ConditionBlock`, `AffixChip` | inside RuleCard | Server | Today they look names up in the client `tocStore`. These become server-side index lookups. |
| `rule-tags.ts`, `quality-glow.ts` | — | Shared, pure | — |
| `RuleEditor`, `ConditionEditor` | yes | Client | Every input reads and writes `editorStore`. |
| `MultiPicker` | yes | Client | `open`/`query` state and focus. Needs TOC lists for search; these can come from a server function (`searchToc`), with loader-provided labels for already-selected ids. |
| `filterStore` | — | **Deleted**: the URL holds the viewer state | — |
| `editorStore`, `subscribe.ts` | — | Client store (via `useSyncExternalStore`) | Mutable working copy plus 50-step history |
| `toc-store.ts` | — | Server-side memoized index over `getCachedTocData()` | — |

## Findings

- **Today's server render is only a shell.** The stores are empty on the server, so the HTML has an empty main area and "Loading index…". All real content renders in the browser after the 518 KB `/api/toc` download.
- **`app/filter/proto.ts` is server-safe.** It uses only `atob`/`btoa`/`TextDecoder`/zod, all of which Node ≥24 has globally.
- **The viewer → editor handoff only exists in memory.** It works because the Remix runtime intercepts same-origin links through the Navigation API. It breaks on refresh, on direct links to `/edit`, and in browsers without the Navigation API.
- **Existing bugs** (verified in the code):
  1. **Edits are lost on edit → view → edit.** `EditApp` init calls `syncEditorFromViewer()`, which overwrites the editor with the viewer's filter (`edit/app.tsx:116`, `edit/bind-dom.ts:15-18`).
  2. **The wrong rule shows after moving one.** `RuleEditor`'s ▲/▼ calls `moveRule` without updating the parent's `selectedRuleIndex` (`ui/editor/rule-editor.tsx:94-112`). The sidebar arrows do update it.
  3. **Stale views after navigating back.** Store subscriptions are registered once per module (`homeStoresSubscribed`/`editStoresSubscribed`) and tied to the first page instance. A page re-created after navigation may not re-render on store changes. Using `useSyncExternalStore` removes this.
- **Dead code:** the `data-home-action="edit"` case (no element uses it), the no-op `homeSetInput`, and the unused `editorStore.exportFilter`/`clearExport`.
- **`<details>` trade-off:** collapsed panel content is always in the HTML, so pages get larger for big filters. On the plus side, it's searchable with Ctrl-F. Animating the open state needs `::details-content` (Chromium), or the animation is dropped.
