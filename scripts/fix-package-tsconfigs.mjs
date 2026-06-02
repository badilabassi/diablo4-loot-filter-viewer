/**
 * @vercel/analytics and @vercel/speed-insights ship a tsconfig.json with
 * `"extends": "../../tsconfig.json"` — a path that only resolves inside the
 * Vercel monorepo. When @remix-run/assets compiles the client bundle at
 * runtime it uses get-tsconfig to locate configs for every file it touches,
 * including files inside node_modules. Finding one of these broken configs
 * causes a 500 on the first page load.
 *
 * Deleting them makes get-tsconfig continue walking up to the project-root
 * tsconfig.json, which has no extends and resolves cleanly.
 */
import { rmSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const packages = ['@vercel/analytics', '@vercel/speed-insights']

for (const pkg of packages) {
  let tsconfigPath
  try {
    tsconfigPath = require.resolve(`${pkg}/package.json`).replace(
      /package\.json$/,
      'tsconfig.json',
    )
  } catch {
    continue
  }
  rmSync(tsconfigPath, { force: true })
  console.log(`Removed broken tsconfig: ${tsconfigPath}`)
}
