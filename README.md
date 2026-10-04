# D4 Filter Viewer

Diablo IV loot filter viewer and editor, built with [TanStack Start](https://tanstack.com/start) (React 19, Vite, Nitro) and deployed on Vercel.

See **[AGENTS.md](./AGENTS.md)** for project conventions, layout, and how to extend the app.

## Requirements

- **Node.js >= 24.3.0**
- **pnpm** (the version is pinned in `package.json` `packageManager`)

## Commands

```sh
pnpm install
pnpm dev         # http://localhost:3000
pnpm build       # production build into .output/
pnpm start       # serve the production build
pnpm test
pnpm typecheck
pnpm seed        # refresh src/data/toc-seed.json from upstream
```

## Routes

| Path       | Description                                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
| `/`        | Viewer. `/?code=<base64>` renders the filter on the server; works without JavaScript |
| `/edit`    | Rule editor. `/edit?code=<base64>` opens that filter                                 |
| `/api/toc` | Affix & item index JSON (CDN-cached for a month)                                     |

## After a game patch

Run `pnpm seed` to refresh the bundled affix/item index, commit, and deploy. To refresh the
CDN copy of `/api/toc` without a deploy, run `vercel cache invalidate --tag toc`.
