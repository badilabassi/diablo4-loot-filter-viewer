# TanStack Start (React): research notes for the Remix 3 to Start migration

Researched 2026-10-03, using primary sources only.

**Citation keys**

- `[repo: <path>]` is a file in `github.com/TanStack/router` at commit `1f0f20a3206a28365d74fd2485b9a8eedbf74dd0` (main, 2026-10-01). Full URL: `https://github.com/TanStack/router/blob/1f0f20a/<path>`. The docs on tanstack.com/start are rendered from `docs/start/**` in this repo.
- `[npm: <cmd>]` is output from the npm registry, run on 2026-10-03.
- Other URLs are cited inline.

---

## TL;DR

- **Status:** TanStack Start is a **Release Candidate**. The docs say: "considered feature-complete and its API is considered stable" [repo: docs/start/framework/react/overview.md]. The RC started at v1.132.0 on 2025-09-23 [GitHub release v1.132.0, "Start RC (#5189)"]. As of 2026-10-03 there is no "stable" or "1.0 GA" label in the docs.
- **Versions (npm `latest`):**
  - `@tanstack/react-start` 1.168.60 (2026-09-30)
  - `@tanstack/react-router` 1.170.41 (2026-09-30)
  - `@tanstack/router-plugin` 1.168.42 (2026-09-30). This is a transitive dependency; you don't install it yourself.
  - `@tanstack/react-router-devtools` 1.167.2 (2026-09-13)
  - `@tanstack/react-router-ssr-query` 1.167.3 (2026-09-16)
  - `nitro` **3.0.260903-beta** (2026-09-03). This is still a beta, even though it is the `latest` tag.
  - `react`/`react-dom` 19.3.0 and `vite` 8.3.2 [npm].
- **Peer dependencies:** `react`/`react-dom` `>=18 || >=19`. `vite >=7.0.0` (optional, because Rsbuild is the alternative). The engine is `node >=22.12.0` [npm].
- **Deploying to Vercel:** add the `nitro/vite` plugin. TanStack's docs say "Follow the Nitro deployment instructions", and Vercel's docs say the same [repo: docs/start/framework/react/guide/hosting.md; vercel.com/docs/frameworks/full-stack/tanstack-start]. Vercel auto-detects the framework. `vercel.json` with `{"framework":"tanstack-start"}` is only needed if detection fails.
- **`GET /api/toc`:** write it as a file route `src/routes/api/toc.ts` with `server: { handlers: { GET } }` that returns a `Response` with your `Cache-Control` header [repo: docs/start/framework/react/guide/server-routes.md].
- **SSR is on by default**, and loaders are **isomorphic**: they run on the server for the first request and in the browser on client navigation. For browser-only state there are three tools:
  - `ssr: false` or `'data-only'` per route, or `defaultSsr: false` for the whole app
  - `<ClientOnly>`
  - `useHydrated()`
- **TanStack Query is optional.** You add it with `@tanstack/react-router-ssr-query` only if you want a query cache.
- **Head tags:** use the route `head()` option. The root shell must render `<HeadContent />` and `<Scripts />`.
- **TypeScript 7:** the TanStack monorepo and the Start examples install `typescript@^7.0.2`. They alias it as `@typescript/native` and alias `typescript` itself to `@typescript/typescript6`. Core packages run type tests against TS 5.6 through 7.0. No doc page talks about TS7 or tsgo.
- **Server function API change:** the canonical validator method is now `.validator()`. `.inputValidator()` has been deprecated since `@tanstack/react-start` 1.168.25 (2026-06-06) [repo: packages/react-start/CHANGELOG.md].
- **No Remix migration guide yet.** The docs list "Remix 2 / React Router 7 'Framework Mode' (coming soon!)". There is a Next.js guide, and a Router-level "Migrate from React Router v7" guide.

---

## 1. Version and release status

**Status**
- The overview says: "TanStack Start is currently in the **Release Candidate** stage! This means it is considered feature-complete and its API is considered stable." [https://tanstack.com/start/latest/docs/framework/react/overview; repo: docs/start/framework/react/overview.md]
- The RC began with GitHub release `v1.132.0` (published 2025-09-23), whose only feature line is "Start RC (#5189)" [`gh api repos/TanStack/router/releases/tags/v1.132.0`].
- The first non-prerelease 1.x of `@tanstack/react-start` on npm was 1.111.10, published 2025-02-25 [npm: `npm view @tanstack/react-start time --json`]. That was during the beta.

**Current versions** [npm: `npm view <pkg> version dist-tags time --json`]

| Package | latest | Published | Other tags |
|---|---|---|---|
| @tanstack/react-start | 1.168.60 | 2026-09-30T17:48Z | pre 1.168.33-pre.0 |
| @tanstack/react-router | 1.170.41 | 2026-09-30T17:48Z | pre 1.170.19-pre.0 |
| @tanstack/router-plugin | 1.168.42 | 2026-09-30T17:48Z | |
| @tanstack/react-router-devtools | 1.167.2 | 2026-09-13T13:20Z | |
| @tanstack/react-router-ssr-query | 1.167.3 | 2026-09-16T21:13Z | |
| nitro | 3.0.260903-beta | 2026-09-03T22:57Z | `latest` is a beta |
| react / react-dom | 19.3.0 | 2026-09-09 | |
| vite | 8.3.2 | 2026-10-01 | previous 7.3.6 |
| @vercel/analytics | 2.0.1 | n/a | |
| @vercel/speed-insights | 2.0.0 | n/a | |

Releases are frequent. Every package was republished on 2026-09-30, and `@tanstack/react-start` has had 670 non-prerelease 1.x versions so far. That means **pinning exact versions is advisable**.

**Breaking changes and migration notes (from the CHANGELOG)** [repo: packages/react-start/CHANGELOG.md]
- **1.168.25** (2026-06-06): "Add `validator()` as the canonical server function and middleware validator method. Deprecate `inputValidator()` and emit compiler warnings for remaining uses." (#7566)
- **1.168.0** (2026-05-15): "Clean minor bump, fresh start" (#7395). This entry describes no API changes.
- **1.167.0** (2026-03-20): "remove pendingMatches, cachedMatches … move to signal-based reactivity" (#6704).

**Vinxi to Vite plugin**
- GitHub release `v1.121.0` (2025-06-10) says "Please follow the migration guide to upgrade", and links to discussion #2863 ("Start BETA - Tracking").
- The current docs don't mention Vinxi at all (I grepped `docs/` and found nothing). Every current setup uses `tanstackStart()` from `@tanstack/react-start/plugin/vite`, or the Rsbuild plugin [repo: docs/start/framework/react/build-from-scratch.md].
- This is irrelevant for a fresh migration. Ignore any Vinxi-era tutorials, such as ones using `app.config.ts` or `@tanstack/start`.

**Other notes**
- React Server Components are "available as an experimental feature" [repo: docs/start/framework/react/overview.md].
- Rsbuild is now supported as an alternative bundler [repo: docs/start/framework/react/build-from-scratch.md].

## 2. Required packages and peer dependencies

**Install** [repo: docs/start/framework/react/build-from-scratch.md]
- `npm i @tanstack/react-start @tanstack/react-router react react-dom`
- `npm i -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node`

**Peer dependencies of `@tanstack/react-start@1.168.60`** [npm: `npm view @tanstack/react-start@1.168.60 peerDependencies peerDependenciesMeta engines`]
- `react`: `>=18.0.0 || >=19.0.0`, and `react-dom` the same
- `vite`: `>=7.0.0` (optional), `@rsbuild/core`: `^2.0.0` (optional), `@vitejs/plugin-rsc` (optional)
- `engines.node`: `>=22.12.0`. The project's Node >=24.3 satisfies this.
- `@tanstack/router-plugin` peers allow `vite >=5 … >=8` [npm].
- The examples use `vite ^8.0.14`, `@vitejs/plugin-react ^6.0.1`, `react ^19.0.0` and `zod ^4.4.3` [repo: examples/react/start-basic/package.json].

**`@tanstack/router-plugin` is not something you install.** It is a direct dependency of `@tanstack/start-plugin-core@1.171.49`, which `react-start` pulls in [npm: `npm view @tanstack/start-plugin-core@1.171.49 dependencies`]. None of the Start docs mention installing it.

**TypeScript settings**
- Minimum tsconfig from the docs: `jsx: react-jsx`, `moduleResolution: Bundler`, `module: ESNext`, `target: ES2022`, `skipLibCheck`, `strictNullChecks` [repo: docs/start/framework/react/build-from-scratch.md].
- Warning in the same doc: "Enabling `verbatimModuleSyntax` can result in server bundles leaking into client bundles. It is recommended to keep this option disabled." **Check the current repo's tsconfig for this flag.**

**TypeScript 7 / tsgo.** There is no doc page about it, but the repo shows strong evidence it works:
- The example `package.json` files declare `"@typescript/native": "npm:typescript@^7.0.2"` and `"typescript": "npm:@typescript/typescript6@^6.0.2"` [repo: examples/react/start-basic/package.json, start-bare, start-basic-react-query]. The repo root does the same [repo: package.json].
- Core packages run type tests on a TS matrix that includes 7.0. For example, `packages/router-core/package.json` has `"test:types:ts70": "tsc"` and `"test:types:ts60": "tsc6"`, and `react-router` and `start-client-core` look the same [`gh api repos/TanStack/router/contents/packages/<pkg>/package.json`].
- On npm, `typescript@7.0.2` is `latest` and ships bin `tsc`. `@typescript/typescript6@6.0.2` ships bin `tsc6` [npm].
- **Why** `typescript` is aliased to the TS6 package is not documented. One possibility is that some tooling still needs the TS JS API, but I couldn't confirm that. See Open questions.

## 3. Project structure and canonical files

**File tree** [repo: docs/start/framework/react/build-from-scratch.md]
```
src/routes/__root.tsx
src/router.tsx
src/routeTree.gen.ts      # generated on first dev/build
vite.config.ts
package.json              # "type": "module", scripts: "dev": "vite dev", "build": "vite build"
tsconfig.json
```
- Optional `src/start.ts` holds `createStart()` global configuration, for things like `defaultSsr` and request middleware [repo: docs/start/framework/react/guide/selective-ssr.md, server-functions.md].
- Optional `src/server.ts` is a custom server entry [repo: docs/start/framework/react/guide/server-entry-point.md].
- The examples commit `routeTree.gen.ts` [repo: examples/react/start-basic/src/routeTree.gen.ts].

**`vite.config.ts`** [repo: docs/start/framework/react/build-from-scratch.md]
```ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
})
```

**`src/router.tsx`**
- The routing guide says: "You must export a getRouter function that returns a new router instance each time" [repo: docs/start/framework/react/guide/routing.md].
```tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createRouter({ routeTree, scrollRestoration: true })
}
```
- start-basic also sets `defaultPreload: 'intent'`, `defaultErrorComponent` and `defaultNotFoundComponent` [repo: examples/react/start-basic/src/router.tsx].

**`src/routes/__root.tsx`**
- The example uses `shellComponent` for the `<html>` document [repo: examples/react/start-basic/src/routes/__root.tsx]. build-from-scratch instead wraps `component`.
```tsx
/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    links: [{ rel: 'stylesheet', href: appCss }, { rel: 'icon', href: '/favicon.ico' }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html><head><HeadContent /></head>
      <body>{children}<Scripts /></body></html>
  )
}
```

**Path aliases**
- The examples use `"paths": { "~/*": ["./src/*"] }` plus `resolve.tsconfigPaths: true` in the Vite config [repo: examples/react/start-basic/tsconfig.json, vite.config.ts].
- There is a dedicated guide [repo: docs/start/framework/react/guide/path-aliases.md].

**Mapping this app's routes to files**
- `/` → `src/routes/index.tsx`
- `/edit` → `src/routes/edit.tsx`
- `/api/toc` → `src/routes/api/toc.ts`

These follow the file conventions in [repo: docs/start/framework/react/guide/server-routes.md] and [routing.md].

## 4. Server routes (`GET /api/toc`)

- **API:** add a `server` property to `createFileRoute`. It contains `handlers`, which is either a method→handler object or `({ createHandlers }) => …`, plus an optional `middleware` array. Handlers receive `{ request, params, context }` and return a `Response` [repo: docs/start/framework/react/guide/server-routes.md].
- **Files:** `/routes/api/file/$.ts` maps to `/api/file/$`. Each path can have only one handler file [same].
- **Server routes vs server functions:** server routes "are meant for HTTP endpoints that need to be called from outside your TanStack Start application" [same].

Sketch for `/api/toc`, using `Response.json` with a headers init. The doc shows `Response.json` and the headers init separately; combining them is standard Fetch API.
```ts
// src/routes/api/toc.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/toc')({
  server: {
    handlers: {
      GET: async () => {
        const data = await getTocCached() // server-only module
        return Response.json(data, {
          headers: {
            'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400',
          },
        })
      },
    },
  },
})
```

**Related patterns**
- The ISR guide uses exactly this pattern (`Response.json(..., { headers: { 'Cache-Control': ... } })` in a server route GET) [repo: docs/start/framework/react/guide/isr.md, "ISR with Server Functions"].
- It also shows a `createMiddleware().server(...)` that sets `result.response.headers.set('Cache-Control', ...)` [same, "Using Middleware for Cache Headers"].
- For **page** routes there is a `headers: () => ({ 'Cache-Control': ... })` route option [same].
- The Vercel section of that guide recommends `s-maxage` for the Vercel edge cache, for example `'public, s-maxage=3600, stale-while-revalidate=86400'` [repo: docs/start/framework/react/guide/isr.md#vercel]. **Decision point:** the current header has no `s-maxage`.
- The start-basic example's `/api/users` server route calls an external `fetch` and returns `Response.json` [repo: examples/react/start-basic/src/routes/api/users.ts].

## 5. Server functions (`createServerFn`)

**What they are**
- `createServerFn({ method: 'GET' | 'POST' }).validator(...).handler(async ({ data }) => …)`. GET is the default [repo: docs/start/framework/react/guide/server-functions.md].
- You call one with `fn({ data })`. They are "same-origin RPC endpoints". Start installs `createCsrfMiddleware()` automatically **unless you define `src/start.ts`**, in which case you add it yourself [same].

**When to use them**
- Use server functions for logic called from your own app (loaders, components, event handlers), where Start handles serialization.
- Use server routes for public or external HTTP endpoints [same; server-routes.md note].
- Route loaders are isomorphic, so "Privileged reads belong in a server function" [repo: docs/start/framework/react/guide/tanstack-query.md].

**Zod validation** [repo: docs/start/framework/react/guide/server-functions.md]
```ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const UserSchema = z.object({ name: z.string().min(1), age: z.number().min(0) })

export const createUser = createServerFn({ method: 'POST' })
  .validator(UserSchema)
  .handler(async ({ data }) => `Created user: ${data.name}, age ${data.age}`)
```

**Other details** [same]
- File convention: `*.functions.ts` holds the `createServerFn` wrappers and is safe to import anywhere. `*.server.ts` is server-only. Plain `.ts` is client-safe.
- Avoid dynamic `import()` of server functions.
- Inputs and outputs are type-checked for serializability (`strict` mode). Returning a `Response` is allowed.
- `setResponseHeader` and `getCookie` are available from `@tanstack/react-start/server` inside handlers [repo: docs/start/framework/react/guide/tanstack-query.md].

**Relevance to this app:** `/api/toc` is fetched by the browser and is HTTP-cacheable, so a **server route** is the documented fit. A server function could wrap the same server-only fetch-and-cache helper if a loader needs it.

## 6. SSR and hydration

- **Defaults:** "routes matching the initial request are rendered on the server by default." `beforeLoad` and `loader` run on the server, and the HTML is then hydrated [repo: docs/start/framework/react/guide/selective-ssr.md].
- **Isomorphic code:** "All code in TanStack Start is isomorphic by default". "Route `loader`s are isomorphic - they run on both server and client" [repo: docs/start/framework/react/guide/execution-model.md].

**Per-route `ssr` option** [repo: docs/start/framework/react/guide/selective-ssr.md]

| Value | `beforeLoad` / `loader` on the server | Component rendered on the server |
|---|---|---|
| `true` (default) | yes | yes |
| `'data-only'` | yes | no |
| `false` | no | no |
| a function `({ params, search }) => …` | decided at runtime | decided at runtime |

- **Global default:** set `defaultSsr` in `createStart(() => ({ defaultSsr: false }))` in `src/start.ts`.
- **Inheritance:** a child can only be *more* restrictive than its parent.
- **Fallback:** for the first non-SSR route, the server renders `pendingComponent` (or `defaultPendingComponent`).
- **Root route:** you can set `ssr: false` on the root, but `shellComponent`, which holds `<html>`, is always SSR'd.

**Browser-only code**
- `<ClientOnly fallback={…}>` from `@tanstack/react-router` renders its children only after hydration [repo: docs/start/framework/react/guide/execution-model.md, hydration-errors.md].
- `useHydrated()` from `@tanstack/react-router` returns a boolean [repo: execution-model.md].
- `createClientOnlyFn(fn)` from `@tanstack/react-start` throws if called on the server, for example a localStorage writer. `createServerOnlyFn` and `createIsomorphicFn().server(...).client(...)` also exist [repo: execution-model.md, code-execution-patterns.md].
- **SPA mode** disables server execution and SSR for the whole app [repo: docs/start/framework/react/guide/spa-mode.md, referenced from selective-ssr.md].
- **Relevance:** the viewer and editor's heavy client stores, undo/redo and base64 parsing could run under `ssr: false` or `'data-only'` on `/` and `/edit` while the shell and head stay SSR'd. Otherwise the stores must be SSR-safe.

## 7. Data loading

- **Route options:** `loader`, `loaderDeps`, `staleTime`, `gcTime` and `shouldReload` on routes, and `defaultStaleTime` and related options on the router [repo: docs/router/guide/data-loading.md].
- **Defaults** [same]:
  - `staleTime` is **0**, so data revalidates in the background on re-entry.
  - Preloaded data stays fresh for **30s**.
  - `gcTime` is **5 min**.
  - `staleTime: Infinity` (per route) or `defaultStaleTime: Infinity` (on the router) turns off stale reloads.
  - `gcTime: 0` plus `shouldReload: false` gives Remix-like "load on entry only".
- **Reading loader data:** `Route.useLoaderData()` [repo: docs/start/framework/react/build-from-scratch.md].
- **Router context:** `createRootRouteWithContext<{ queryClient: QueryClient }>()` plus `createRouter({ context: { … } })` [repo: docs/start/framework/react/guide/tanstack-query.md; docs/router/guide/router-context.md].
- **TanStack Query is optional, not required.** The docs say: "Use them together when your application needs a query cache across routes, background updates, or mutation-driven invalidation" [repo: docs/start/framework/react/guide/tanstack-query.md]. If you do use it:
  - Install `@tanstack/react-query` (>=5.102) and `@tanstack/react-router-ssr-query`.
  - Create the `QueryClient` **inside `getRouter`**, never at module scope (otherwise it leaks across requests).
  - Call `setupRouterSsrQueryIntegration({ router, queryClient })`, which supplies the provider and dehydration.
  - Set `defaultPreloadStaleTime: 0`.

  The peer dependencies are `@tanstack/react-query >=5.102.0` and `@tanstack/react-router >=1.170.33` [npm].

## 8. Head and meta management

- **Required pieces:** render `<HeadContent />` in `<head>` and `<Scripts />` in `<body>`. `head()` returns `{ meta, links, styles, scripts }` [repo: docs/router/guide/document-head-management.md].
- **Merging:** "TanStack Router will dedupe `title` and `meta` tags, preferring the **last** occurrence of each tag found in nested routes" [same]. So the root route can set defaults and leaf routes override them.
- **Per-route title, description, OG, Twitter and canonical tags.** Pattern from [repo: docs/start/framework/react/guide/seo.md]:
```tsx
export const Route = createFileRoute('/edit')({
  head: () => ({
    meta: [
      { title: 'Edit filter | D4 Filter Viewer' },
      { name: 'description', content: '…' },
      { property: 'og:title', content: '…' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://<origin>/edit' }],
  }),
})
```
- **Other `head()` inputs:** `head` also receives `{ loaderData, params }` for dynamic tags. JSON-LD goes in `scripts: [{ type: 'application/ld+json', children: … }]` [same].
- **SEO extras:** built-in sitemap generation, static and dynamic `robots.txt`, and prerendering are documented [same].
- **start-basic** uses a small `seo()` helper (`src/utils/seo.ts`) that spreads into `meta` [repo: examples/react/start-basic/src/routes/__root.tsx].

## 9. Deploying to Vercel

**TanStack docs:** the "Vercel" section says only: "Follow the `Nitro` deployment instructions. Deploy your application to Vercel using their one-click deployment process" [repo: docs/start/framework/react/guide/hosting.md#vercel]. The Nitro section adds two things:
- Install `nitro` and add `nitro()` from `nitro/vite`.
- The plugin "is still under active development … Please report any issues" [same, #nitro].

**Vercel docs** (page last updated 2026-09-22) [https://vercel.com/docs/frameworks/full-stack/tanstack-start]
- "TanStack Start works great on Vercel when paired with Nitro."
- Install: `pnpm i nitro`.
- Config:
```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';

export default defineConfig({
  plugins: [tanstackStart(), nitro(), viteReact()],
});
```
- Runtime: Vercel Functions with Fluid Compute by default.

**Vercel KB** (updated 2026-09-24) [https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel]
- Prerequisites: "Node.js 24+ and a package manager".
- The framework is auto-detected, so no build command or output directory is needed.
- `vercel.json` `{ "framework": "tanstack-start" }` is only needed when detection fails: "In a monorepo, or in a project that previously used a different framework, Vercel may not automatically detect TanStack Start." **This repo previously deployed a different framework, so check the project's Framework Preset setting.**

**Nitro Vercel preset** [https://nitro.build/deploy/providers/vercel]
- "Integration with this provider is possible with zero configuration."
- Optional `nitro.config.ts` settings: `vercel.functions` (runtime), `vercel.functionRules` (per-route `maxDuration` and `memory`), and `routeRules` with `isr`.
- Skew protection is on when enabled in the dashboard.
- **No `vercel.json` is required.**

**Plugin order:** start-basic puts `nitro()` *after* `viteReact()`, and adds `tailwindcss()` first [repo: examples/react/start-basic/vite.config.ts]. The docs put `nitro()` between the two. Both orders appear in primary sources.

**`start` script:** the start-basic example (with Nitro) uses `node .output/server/index.mjs` [repo: examples/react/start-basic/package.json]. The Nitro-less start-bare uses `srvx --prod -s ../client dist/server/server.js`.

**Analytics:** `@vercel/analytics@2.0.1` and `@vercel/speed-insights@2.0.0` export `./react` (plus next, remix, etc.). Neither has a TanStack-specific entry [npm: `npm view @vercel/analytics@2.0.1 exports`]. Neither TanStack's nor Vercel's TanStack page documents how to integrate them. See Open questions.

## 10. Static assets, fonts and CSS

**`public/`**
- The examples keep favicons and the manifest in `public/` and reference them by root path, e.g. `href: '/favicon.ico'` [repo: examples/react/start-basic/public/, src/routes/__root.tsx].
- The tutorials label `public/` "Static assets" [repo: docs/start/framework/react/tutorial/fetching-external-api.md].
- No Start doc page describes how `public/` behaves beyond that. It is Vite's standard public directory, but that is an inference.

**Fonts**
- No Start-specific font API exists.
- The Next.js migration guide says: "Replace `next/font` with self-hosted font files, a package such as Fontsource … CSS `@font-face` does not require Tailwind. Preserve font weights and subsets, set an appropriate `font-display`" [repo: docs/start/framework/react/migrate-from-next-js.md].
- So `@font-face` pointing at `/fonts/*.ttf` in `public/` fits the documented approach.

**CSS** [repo: docs/start/framework/react/guide/css-styling.md]. Three documented patterns:

| Pattern | What it does |
|---|---|
| `import css from './app.css?url'` + `head().links` | You render the `<link>` yourself through route head output. |
| Side-effect `import './global.css'` | Start attaches it to the route chunk via the manifest. It is SSR-linked and can be inlined. |
| CSS Modules `*.module.css` | Same as side-effect imports, but class names are scoped. |

- Production CSS inlining and `transformAssets` are available [same].
- Tailwind has its own guide [repo: docs/start/framework/react/guide/tailwind-integration.md], and start-basic uses `@tailwindcss/vite` v4. Plain CSS is fully supported.

## 11. Testing

- **Router-level docs** recommend **Vitest** with `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` and `jsdom` (Jest is also shown). They render with `RouterProvider` and `createMemoryHistory`. For file-based routes they use a `vitest.config.ts` that includes `tanstackRouter()` from `@tanstack/router-plugin/vite` [repo: docs/router/how-to/setup-testing.md, docs/router/how-to/test-file-based-routing.md].
- **E2E:** Playwright is documented [same]. The Start React Query example ships Playwright tests (`tests/preferences.spec.ts`, `test:e2e: playwright test`) [repo: examples/react/start-basic-react-query/package.json].
- **No documented approach for unit-testing server routes or server functions.** Neither docs/start nor docs/router covers it (I grepped for vitest and testing-library and found hits only in router how-tos and authentication.md).
- A practical option is to keep handler logic in plain functions and unit-test those directly, but **that is not documented**.

## 12. pnpm specifics

- **Nothing documented** about `shamefully-hoist`, `node-linker` or peer-dependency issues in docs/start or docs/router (I grepped).
- The docs use pnpm commands in places, e.g. `pnpm add -D @cloudflare/vite-plugin` [repo: docs/start/framework/react/guide/hosting.md].
- The monorepo itself uses `pnpm@11.21.0` [repo: package.json]. Nothing about pnpm 12.
- **Side note:** in this repo, `npm view` printed warnings about project `.npmrc` keys `shamefully-hoist` and `confirmModulesPurge`. Those are this repo's own pnpm settings, not a TanStack requirement.

## 13. Official migration guides

- **Start: "Migrate from Next.js"** [repo: docs/start/framework/react/migrate-from-next-js.md]. Transferable advice:
  - Inventory URLs and behavior (status codes, title, description, canonical, robots, sitemap) before changing anything.
  - Run Start alongside the old app and test both against the same contract.
  - Preserve paths.
  - Move privileged server reads into server functions.
  - Translate metadata into route `head`, and keep `HeadContent` in the root.
  - Self-host fonts with `@font-face`.
  - List each cache layer (browser, loader, Query, server, CDN) explicitly.
  - Keep a rollback path.

  It also states: "Use Node 24 or newer and pnpm 11" for running its reference app.
- **Start: Remix.** The getting-started page lists "Remix 2 / React Router 7 'Framework Mode' (coming soon!)" [repo: docs/start/framework/react/getting-started.md]. **There is no guide for Remix 2, React Router 7, or the non-React Remix 3.**
- **Router: "How to Migrate from React Router v7"** [repo: docs/router/how-to/migrate-from-react-router.md] and "Migrate from React Router" [repo: docs/router/installation/migrate-from-react-router.md]. These are client-routing focused: links, navigation, search params, type safety. They are only marginally relevant, since `remix/component` isn't React.
- **Comparison pages:** `comparison.md` and `start-vs-nextjs.md` [repo: docs/start/framework/react/].

## 14. React Server Components

Sources for this section:
- Docs and examples in the repo at the same commit (`1f0f20a`, which was still the tip of main on 2026-10-03).
- npm registry, GitHub releases and issues.

### 14.1 Maturity status

**Status wording (exact quotes)** [repo: docs/start/framework/react/guide/server-components.md]
- Banner at the top of the guide: "> [!WARNING] Server Components are experimental! The API may see refinements."
- "Current Status" section: "Server Components are experimental in TanStack Start and will remain so into early v1."
  - "**Serialization:** Uses React's native Flight protocol. TanStack Start's custom serialization isn't available in server components yet. Primitives, Dates, and React elements work. Custom serialization coming in a future release."
  - "**API:** The RSC helper APIs may see refinements."
- Overview: "React Server Components are available as an experimental feature" [repo: docs/start/framework/react/overview.md].
- Comparison table: "Experimental, opt-in" [repo: docs/start/framework/react/comparison.md]. The same page says: "Check Start's overview and Server Components guide for current release and experimental-feature status before adopting those features."
- I found no explicit "not for production" sentence.

**When it was introduced**
- RSC ships as a separate package, `@tanstack/react-start-rsc`, which `@tanstack/react-start` depends on (1.168.60 depends on `@tanstack/react-start-rsc` 0.1.59) [npm].
- The first publish was `0.0.0` on 2026-04-10T22:22Z. The changelog says: "Bump the initial release line … to `0.0.1` after the manual `0.0.0` publish" (#7144) [npm: `npm view @tanstack/react-start-rsc time`; repo: packages/react-start-rsc/CHANGELOG.md].
- `@tanstack/react-start` first exports `./rsc` in **1.167.21** (2026-04-10T23:45Z). Versions 1.167.20 and earlier have no `rsc` export [npm: `npm view @tanstack/react-start@<v> exports`].
- Current version is `0.1.59` (2026-09-30), with 108 versions in under 6 months. The package is still 0.x [npm].

**Notable changelog entries** [repo: packages/react-start-rsc/CHANGELOG.md, packages/react-start/CHANGELOG.md]
- react-start 1.167.22: republished the package chain, because fresh installs were not resolving the subpaths `react-start-rsc` needs.
- react-start 1.167.37 (#7180): fixed `@tanstack/react-start/server` imports inside RSC by adding a `react-server` export condition.
- react-start 1.167.53 (#7292): fixed exports so `useServerFn` is available with RSC.
- react-start 1.167.58 (#7310): "compiler-driven RSC CSS auto-injection", so CSS module dependencies are discovered for `renderServerComponent`, `createCompositeComponent` and `renderToReadableStream`.
- Rsbuild RSC support (#7228, #7509).
- 0.1.0: "Clean minor bump, fresh start" (#7395).
- 0.1.32 (#7900): raised the `@vitejs/plugin-rsc` peer to `>=0.5.30`, because 0.5.20–0.5.29 "suppress client HMR for a route component co-located with a `createServerFn`".
- 0.1.34 (#7944): RSC helpers no longer pull the Start server barrel into the RSC module graph.

### 14.2 How to enable it

The guide says "**Server Components are not enabled by default.**" and gives these steps:

**1. Install.** `pnpm add -D @vitejs/plugin-rsc`. The current version is 0.5.35 (2026-09-16), and `react-start-rsc` peers on `>=0.5.30` [npm].
- `react-server-dom-webpack` is an *optional* peer of plugin-rsc [npm: `npm view @vitejs/plugin-rsc@0.5.35 peerDependenciesMeta`]. Neither the docs nor the example install it.
- `@tanstack/react-start-rsc` comes in transitively. The example doesn't list it [repo: examples/react/start-rscs/package.json].

**2. Configure Vite.** Set the `tanstackStart({ rsc: { enabled: true } })` flag and add the `rsc()` plugin:
```ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'

export default defineConfig({
  plugins: [
    tanstackStart({ rsc: { enabled: true } }),
    rsc(),
    viteReact(),
  ],
})
```
- The official example adds `tailwindcss()` first and `nitro()` last [repo: examples/react/start-rscs/vite.config.ts].

**Requirements:** "React 19+, Vite 7+ or Rsbuild 2+" [guide]. Stable React 19 is enough; no canary is mentioned.
- The example uses `react ^19.2.0` and `vite ^8.0.14`. The RSC e2e apps use `react ^19.0.0` [repo: examples/react/start-rscs/package.json; `gh api …/e2e/react-start/rsc/package.json`].
- npm `latest` for react is 19.3.0.

### 14.3 Programming model

**No `'use server'` modules, server actions or server-component files.** RSC is opt-in **per value**: a server function renders JSX into a Flight payload, and a route `loader` returns it. The guide says "In TanStack Start, you typically create server-rendered UI in a server function, then return it through a route `loader`."

There are two helpers, both from `@tanstack/react-start/rsc`:
- `renderServerComponent(<El />)` returns a renderable you inline as `{Renderable}`. It has no slots.
- `createCompositeComponent((props) => <El />)` returns a `src` that you render with `<CompositeComponent src={…} />`. It supports slots.

**Renderable** [guide, "Renderable (no slots)"]
```tsx
import { createServerFn } from '@tanstack/react-start'
import { renderServerComponent } from '@tanstack/react-start/rsc'

const getGreeting = createServerFn().handler(async () => {
  const Renderable = await renderServerComponent(<Greeting />)
  return { Renderable }
})

export const Route = createFileRoute('/')({
  loader: async () => ({ Greeting: (await getGreeting()).Renderable }),
  component: () => <>{Route.useLoaderData().Greeting}</>,
})
```

**Embedding client UI in server output.** There are two documented mechanisms.

1. **Slots on a composite.** These are client-provided, and there are three types:
   - `children`: the server can't pass data into them.
   - Render props: e.g. `renderActions={(data) => <PostActions … />}`. The server *can* pass data.
   - Component props: e.g. `AddToCart={AddToCartButton}`, which the server renders with server data.

   The server sees slots only as opaque placeholders. `React.Children.map` and `cloneElement` don't work on them, and render-prop arguments must be Flight-serializable [guide, "Passing Props and Composition", "Rules and Limitations", "How It Works"].
   ```tsx
   const getCard = createServerFn().handler(async () => ({
     src: await createCompositeComponent((props: { children?: React.ReactNode }) => (
       <div className="card"><h2>Server-rendered header</h2>{props.children}</div>
     )),
   }))
   // client route component:
   <CompositeComponent src={Card.src}><Counter /></CompositeComponent>
   ```
   Client components passed as slots carry **no** `'use client'` directive in the example [repo: examples/react/start-rscs/src/e-Commerce/components/AddToCartButton.tsx].

2. **`'use client'` modules imported from inside server-rendered JSX.** The example's `pokemon/Button.tsx` starts with `'use client'`. `pokemon/server-functions.tsx` imports it and renders it inside `renderServerComponent(...)` [repo: examples/react/start-rscs/src/pokemon/Button.tsx, server-functions.tsx].
   - The guide itself never mentions `'use client'`.
   - The ESLint rule doc defines the boundary: "Inside these boundaries (and anything rendered from them, unless it crosses a `'use client'` boundary) you must not use client-only code" (hooks, `window`/`document`, event handlers, function props, class components) [repo: docs/start/eslint/no-client-code-in-server-component.md; also no-async-client-component.md].

**Data flow.** Server components can be `async` and fetch their own data. `React.cache` works for request-scoped memoization. Server-function `validator`/`data` feed them, e.g. `.validator(z.object({ postId }))` followed by `createCompositeComponent` [guide, "Render Props", "Using `React.cache`"].

**Caching and invalidation** [guide, "Caching", "Invalidation"]
- RSC values are cached as loader data, keyed by route path, params and `loaderDeps`, and controlled by `staleTime`.
- `router.invalidate()` refetches after a mutation.
- With TanStack Query you must set `structuralSharing: false` ("Required - RSC values must not be merged").

**Streaming and Suspense** [guide, "Advanced Patterns"]
- `<Suspense>` inside server components streams each boundary independently.
- Async generators stream components one at a time.
- Deferred loading: return a non-awaited promise from the loader plus `<Deferred>`/`Suspense`/`ErrorBoundary`.
- `Promise.all` handles parallel components.

**Router `Link`** works inside server components [guide, "Router Links in Server Components"].

**Selective SSR** [guide, "Combining with Selective SSR"]
- RSC works with `ssr: 'data-only'`: the RSC is fetched on the server and the route component renders on the client, so it can use `window` and `localStorage`.
- It also works with `ssr: false`, where the loader runs in the browser and calls the server function.

**Low-level APIs.** `renderToReadableStream` (server functions only), `createFromFetch` and `createFromReadableStream` [guide, "Low-Level Flight Stream APIs"].
- **The guide's example here uses the outdated `createAPIFileRoute` from `@tanstack/react-start/api`.** The official example does the same thing with the current `createFileRoute(...)({ server: { handlers: { GET } } })` API [repo: examples/react/start-rscs/src/routes/api/rsc.tsx].
- Treat the guide snippet as stale. `@tanstack/react-start@1.168.60` has no `./api` export at all [npm: `npm view @tanstack/react-start@1.168.60 exports`].

### 14.4 Constraints and limitations

**Documented** [guide, "Rules and Limitations", "Current Status"]
- Slots are opaque.
- Render-prop and component-prop arguments must be serializable: strings, numbers, booleans, null, plain objects, arrays.
- Start's custom serialization isn't available inside RSC.

**Server actions (`'use server'`, form actions)**
- Not documented for Start RSC. The guide's mutation pattern is a regular `createServerFn` followed by `router.invalidate()`.
- I grepped `packages/react-start-rsc/src` for `use server` and found nothing.
- The Next.js migration guide says: "Do not treat `createServerFn` as a drop-in replacement for the React form Action protocol" [repo: docs/start/framework/react/migrate-from-next-js.md].

**Open GitHub issues (as of 2026-10-03; user reports, not docs)**
- **#7943** (opened 2026-08-03, open): in RSC mode, "a module that declares a server function with `createServerFn()` but is only imported from a `'use client'` module works in `vite dev` and fails in a production build" with "Server function info not found". This directly affects a "client components call server functions" design.
- **#7500** (2026-05-28, open): with `rsc: { enabled: true }`, **all** `createServerFn` handlers resolve with the `react-server` condition, so libraries that depend on `react-dom/server` can't be used in server functions.
- **#7361** (2026-05-07, open): a dev-only SSR `SerovalUnsupportedTypeError`.

**Deployment targets**
- The hosting guide doesn't mention RSC at all [repo: docs/start/framework/react/guide/hosting.md].
- **The Nitro/Vercel combination with RSC is not documented.**
- The only evidence is the official example `start-rscs`, which includes `nitro()` in its Vite config and `"start": "node .output/server/index.mjs"`, i.e. a Nitro build [repo: examples/react/start-rscs/vite.config.ts, package.json].
- The RSC e2e suites (`e2e/react-start/rsc`, `rsc-query`, `rsc-rsbuild`, `rsc-deferred-hydration`) build **without** Nitro and serve with `node server.js` or `srvx` [`gh api …/e2e/react-start/rsc/vite.config.ts`, package.json]. So Nitro and RSC together aren't covered by CI e2e as far as I can see.
- No Vercel source mentions RSC with TanStack Start [vercel.com/docs/frameworks/full-stack/tanstack-start].

### 14.5 CSS Modules and `motion`

- **CSS Modules: documented as working.** "CSS Modules and global CSS imports work in server components. Styles are extracted and sent to the client", with a `import styles from './Card.module.css'` example inside `renderServerComponent` [guide, "CSS in Server Components"]. This is backed by the CSS auto-injection change in react-start 1.167.58 (#7310) [CHANGELOG].
- **`motion`: not documented** for RSC or client-component setups.
  - The only motion-related item is a Router example, `with-framer-motion` [repo: docs/router/config.json], which is unrelated to RSC.
  - By the ESLint rule above, motion components (hooks, event handlers) would have to live in client components (slots or `'use client'` modules). That is an inference, not something documented.

### 14.6 Official example

- **`examples/react/start-rscs`** is the official example. It has these routes:
  - `/pokemon-rsc` vs `/pokemon`, an RSC vs traditional SSR comparison
  - `/e-commerce`, with a zustand cart store in client components plus streaming comments
  - `/low-level-api`, covering Flight streams, Dexie cache, nested Suspense and parallel streams
  - `/api/rsc`

  [repo: examples/react/start-rscs/src/].
- It uses Nitro (so it could deploy to Vercel in principle), but **no source documents or demonstrates deploying it to Vercel**. Its README is a copy of start-basic's and says "It's deployed automagically with Netlify!" [repo: examples/react/start-rscs/README.md].
- `examples/react/start-basic-rsc` exists on main but contains only a `.devcontainer/` folder. It is effectively empty or stale.
- Neither RSC example is listed on the Getting Started page [repo: docs/start/framework/react/getting-started.md].

### 14.7 Assessment against "RSC first, SSR second, client-side last"

Per the sources, RSC in Start is **not production-ready in the documented sense**:
- It is labelled experimental, "will remain so into early v1", with an API that "may see refinements".
- The package is 0.x and under six months old.
- Server-function serialization is limited inside RSC.
- There are open production-build bugs at the RSC/client boundary (#7943).
- Nitro/Vercel isn't covered by docs or e2e.

The model is also narrower than Next.js-style RSC:
- Server components are *values* returned from server functions through loaders, not the default route component model.
- Every route is still a client-hydrated React tree, with RSC payloads embedded in it.

For this app the decision factors are:
- the pages are mostly client state (stores, undo/redo, in-browser parsing)
- `/api/toc` should remain a plain server route

On that basis, RSC could only cover static, server-rendered chrome or content, and an SSR-plus-client baseline is what the sources support as stable.

---

## Open questions / unverified

1. **Release status after RC.** I found nothing saying Start has left RC as of 2026-10-03. The overview still says "Release Candidate", a full year after v1.132.0. I didn't check the GitHub releases list for a later "stable" announcement, because the `gh api` list call failed due to a shell quoting issue.
2. **TS7 / tsgo.** The examples install TS 7.0.2 and the core packages type-test against it, but no doc page says "TS7 is supported", and the reason `typescript` is aliased to `@typescript/typescript6` is undocumented. Possibly some tooling needs the TS6 JS API; unverified. Before committing, try `tsgo`/`tsc` (TS7) `--noEmit` on a scaffold.
3. **`vite build && tsc --noEmit`.** This is the examples' build script. Whether TS7's `tsc` handles `routeTree.gen.ts` cleanly is not stated.
4. **Vercel Analytics and Speed Insights.** No primary source covers TanStack Start. Presumably `<Analytics />` and `<SpeedInsights />` from the `/react` entries go in the root shell, but that is not documented.
5. **Vercel caching of `/api/toc`.** TanStack's ISR guide recommends `s-maxage` for the Vercel edge. I didn't verify whether Vercel's CDN caches a Nitro function response from `max-age` plus `stale-while-revalidate` alone (Vercel caching docs not fetched).
6. **Caching of `public/` assets on Vercel via Nitro.** Nitro's docs say public asset dirs that don't fall through get a one-year Cache-Control by default, and that "fall through" is the default for non-root `baseURL`. How root `public/` fonts are cached under this preset was not confirmed.
7. **Nitro is a beta (`3.0.260903-beta`)** and is flagged "under active development" in TanStack's docs. There is no documented non-Nitro Vercel path.
8. **Testing server routes and functions.** Not documented anywhere I checked.
9. **pnpm 12.** Not mentioned in any source. The TanStack monorepo uses pnpm 11.21.
10. **`public/` semantics.** No Start doc describes them explicitly; Vite's standard behavior is assumed.
11. **The Vercel KB's "Node.js 24+".** It is stated as a prerequisite of that guide, not as a hard platform requirement. `react-start` itself requires `>=22.12.0`.
12. **RSC + Nitro on Vercel.** This is undocumented. The `start-rscs` example builds with Nitro, but the RSC e2e suites don't use Nitro and nothing shows a Vercel deployment. A Vercel preview deploy of a scaffold would settle it.
13. **RSC `'use client'` semantics.** The Start guide never mentions `'use client'`. The rules come only from the example (`pokemon/Button.tsx`) and the ESLint rule docs. Whether slot-passed client components ever need the directive is inferred from the example (they don't carry it).
14. **RSC with `createServerFn` called from `'use client'` modules.** Open issue #7943 reports production-only failures ("Server function info not found"). I didn't check whether a fix is pending in an open PR.
15. **RSC changes how all server functions resolve.** Issue #7500 says `rsc.enabled` makes every server-function handler resolve under the `react-server` condition. That would affect any server-side library that imports `react-dom/server`. It is reported by a user and not documented.
16. **RSC + `motion`, and TS7 with RSC.** Neither is documented. The `start-rscs` example still uses `typescript ^5.7.2`, not the TS7 alias the other examples use.
17. **Stale RSC doc snippet.** The low-level Flight example in the server-components guide uses `createAPIFileRoute` from `@tanstack/react-start/api`. That doesn't match the current server-routes API (`createFileRoute(...)({ server: { handlers } })`, which the official example uses). Confirmed: `@tanstack/react-start@1.168.60` has no `./api` export [npm: `npm view @tanstack/react-start@1.168.60 exports`], so the snippet would not run as written.
18. **When RSC leaves experimental.** "Into early v1" has no date or version attached. Start itself is still RC.
