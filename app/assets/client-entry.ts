import type { ScriptEntry } from 'remix/assets'

import { assetServer } from '../assets.ts'

/**
 * Browser bootstrap script: its public URL, the import map that resolves its bare
 * imports, and modulepreload hints. Not cached here — the asset server caches the
 * compiled graph and keeps the import map current as dependencies change in dev.
 */
export function getClientEntry(): Promise<ScriptEntry> {
  return assetServer.getScriptEntry('app/assets/entry.ts')
}
