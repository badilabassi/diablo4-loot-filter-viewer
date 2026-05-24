# D4 Filter Viewer

Diablo IV loot filter viewer and editor, built with [Remix 3.0.0-beta.2](https://api.remix.run/api/remix/overview/) and `remix/ui`.

See **[AGENTS.md](./AGENTS.md)** for project conventions, layout, and how to extend the app.

## Requirements

- **Node.js >= 24.3.0**

## Starter Shape

- `app/actions/controller.tsx` owns the top-level route actions.
- `app/routes.ts` defines the route contract.
- `app/router.ts` wires routes to handlers.
- `app/middleware/render.tsx` installs the request-scoped renderer used by actions.
- `app/ui/` holds the shared document shell and home page UI.
- `app/assets.ts` owns the server-side asset pipeline used by the asset route and renderer.
- `public/` contains static files served from the app root.

## Growing The App

- Put top-level route actions in `app/actions/controller.tsx`.
- Add `app/actions/<route-key>/controller.tsx` when a nested route map needs its own actions or middleware.
- Add directories like `app/data/` or `test/` when the app actually needs them.
- Move shared UI into `app/ui/` once more than one route needs it.

## Commands

```sh
npm install
npm run dev      # http://localhost:3000
npm run start
npm test
npm run typecheck
npm run seed     # refresh public/data/toc.json from upstream
```

## Routes

| Path | Description |
|------|-------------|
| `/` | View / parse filter codes |
| `/edit` | Rule editor |
| `/api/toc` | Affix & item index JSON |
