/**
 * Per-page head tags, reproducing the Remix app's DocumentHead output
 * (contract C4). Routes spread the result into their `head()` return value; the
 * root route supplies the tags that don't vary per page.
 */

export const SITE_NAME = 'D4 Filter Viewer'
export const THEME_COLOR = '#100c0b'
export const DEFAULT_DESCRIPTION =
  'View and edit Diablo IV loot filters in your browser — inspect rules, conditions, affixes, and item types, then export filter code for the game.'
const DEFAULT_ROBOTS = 'index, follow'

export interface SeoOptions {
  title: string
  description?: string
  /** Absolute URL of this page without query or hash. */
  canonical?: string
  robots?: string
  /** Absolute or root-relative image for Open Graph / Twitter. */
  ogImage?: string
}

type Meta = Record<string, string>

export function seo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  robots = DEFAULT_ROBOTS,
  ogImage,
}: SeoOptions) {
  const meta: Meta[] = [
    { title },
    { name: 'description', content: description },
    { name: 'robots', content: robots },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    ...(canonical ? [{ property: 'og:url', content: canonical }] : []),
    ...(ogImage ? [{ property: 'og:image', content: ogImage }] : []),
    { name: 'twitter:card', content: ogImage ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    ...(ogImage ? [{ name: 'twitter:image', content: ogImage }] : []),
  ]
  const links = canonical ? [{ rel: 'canonical', href: canonical }] : []
  return { meta, links }
}

/** The canonical URL for a path: the request origin plus the path, no query or hash. */
export function canonicalUrl(origin: string, pathname: string): string {
  return new URL(pathname, origin).href
}

/**
 * Canonical URL for a route's `head()`, using the origin the root route's loader
 * resolved. `matches[0]` is always the root match.
 */
export function canonicalFor(
  matches: ReadonlyArray<{ loaderData?: unknown }>,
  pathname: string,
): string | undefined {
  const origin = (matches[0]?.loaderData as { origin?: string } | undefined)?.origin
  return origin ? canonicalUrl(origin, pathname) : undefined
}
