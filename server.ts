import 'remix/node-tsx'
import './vercel/trace-deps.js'

import { createRequire } from 'node:module'
import * as http from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'

const require = createRequire(import.meta.url)

// Linux native bindings for @remix-run/assets (optional on local macOS/Windows).
const linuxNativePackages = [
  'lightningcss-linux-x64-gnu',
  'lightningcss-linux-arm64-gnu',
  '@oxc-parser/binding-linux-x64-gnu',
  '@oxc-parser/binding-linux-arm64-gnu',
  '@oxc-transform/binding-linux-x64-gnu',
  '@oxc-transform/binding-linux-arm64-gnu',
  '@oxc-minify/binding-linux-x64-gnu',
  '@oxc-minify/binding-linux-arm64-gnu',
  '@oxc-resolver/binding-linux-x64-gnu',
  '@oxc-resolver/binding-linux-arm64-gnu',
]

for (const pkg of linuxNativePackages) {
  try {
    require.resolve(pkg)
  } catch {
    // Not installed on this platform.
  }
}

/** Load app sources at runtime so each clientEntry(import.meta.url) stays a real file path. */
let routerPromise: Promise<Awaited<ReturnType<typeof getRouterModule>>['router']> | undefined

function getRouterModule() {
  return import('./app/router.ts')
}

function getRouter() {
  routerPromise ??= getRouterModule().then((module) => module.router)
  return routerPromise
}

async function handleRequest(request: Request): Promise<Response> {
  try {
    return await (await getRouter()).fetch(request)
  } catch (error) {
    if (!(request.signal.aborted && error === request.signal.reason)) {
      console.error(error)
    }
    return new Response('Internal Server Error', { status: 500 })
  }
}

export default {
  async fetch(request: Request) {
    return handleRequest(request)
  },
}

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000

// Local `npm run dev` / `npm start` — Vercel invokes the fetch export above.
if (!process.env.VERCEL) {
  const server = http.createServer(createRequestListener(handleRequest))

  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`)
  })

  let shuttingDown = false

  function shutdown() {
    if (shuttingDown) return
    shuttingDown = true
    server.close(() => process.exit(0))
    server.closeAllConnections()
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
