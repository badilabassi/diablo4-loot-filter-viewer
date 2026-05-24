import { assetServer } from '../assets.ts'

let cachedHref: string | undefined

/** Public URL for the browser bootstrap script (resolved via the asset server). */
export async function getClientEntryHref(): Promise<string> {
  if (cachedHref === undefined) {
    cachedHref = await assetServer.getHref('app/assets/entry.ts')
  }
  return cachedHref
}
