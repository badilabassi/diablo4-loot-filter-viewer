# D4 Filter Viewer Agent Guide

A TanStack Start app (React 19, Vite, Nitro on Vercel). The migration from Remix 3 and the
reasoning behind these conventions are in `docs/plans/tanstack-start-migration.md`; research
notes are in `docs/research/`.

## Commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm typecheck
```

Pin dependency versions exactly: TanStack Start and Nitro publish very frequently, and Nitro is
still a beta.

## Rendering: server first, client last

- **RSC first.** The viewer's rule list (`src/viewer/`) is a React Server Component, rendered by
  the `getViewer` server function. Its code and data never reach the browser. RSC in Start is
  experimental; keep server components server-safe (no hooks, no browser APIs, data in through
  props) so they can fall back to plain SSR.
- **SSR second.** Every page is server-rendered. Page state lives in the URL (`?code=`), so
  pages work without JavaScript where possible (native forms, links, `<details>`).
- **Client last.** Only genuinely interactive state is client-side: the sidebar toggle and the
  editor (`src/editor/`).

## Layout

- `src/routes/` file routes: `__root.tsx` (document shell, head tags, analytics), `index.tsx`
  (viewer), `edit.tsx` (editor), `api/toc.ts` (JSON server route).
- `src/filter/` filter format: parse/serialize, schemas, constants. Isomorphic.
- `src/data/` TOC index: `*.server.ts` are server-only; `toc.functions.ts` holds the
  `searchToc`/`resolveToc` server functions; `toc-kinds.ts` holds types shared with the client.
- `src/viewer/` server-safe viewer components plus the `getViewer` server function.
- `src/editor/` client editor: stores (`editor-store.ts`, `history.ts`), hydration-safe state
  hooks (`editor-state.tsx`), components, and the `getEditor` server function.
- `src/ui/` shared UI: shell pieces, head tags (`seo.ts`), shared styles, small helpers.
- `src/styles/theme.css` design tokens, fonts, keyframes, globals.
- `test/` Vitest tests. `public/` static files served from the root.

## Conventions

- **Server-only code** lives in `*.server.ts`. Client modules must not import them, not even
  types: put shared types in a neutral module (e.g. `src/data/toc-kinds.ts`).
- **Server-side singletons go on `globalThis`** (see `src/data/toc-cache.server.ts`). With RSC
  enabled, server functions and server routes run in separate build environments, so a module
  is instantiated twice and module-level state would be duplicated.
- **Never write client stores on the server.** Server rendering reads loader data; editor
  components read state through `useEditor`/`useTocLabel`, which use loader data on the server
  and during hydration.
- **Styling is CSS Modules.** Component `.module.css` files wrap their rules in
  `@layer ui.component`; shared styles are in `src/ui/styles.module.css` (`@layer ui.base`).
  Global rules in `theme.css` are unlayered, so they win. Per-value colors go in inline styles
  or custom properties.
- **Caching:** set CDN lifetimes with `Vercel-CDN-Cache-Control` and keep browser `max-age`
  short. Don't use Nitro `swr` route rules (on Vercel they become never-expiring ISR). Never set
  cookies on cached responses.
- Test pure logic directly (e.g. `buildViewerModel`, `searchTocEntries`) and keep server
  functions as thin wrappers around it; server functions can't run under Vitest.
