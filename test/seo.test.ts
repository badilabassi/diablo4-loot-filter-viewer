import * as assert from 'node:assert/strict'

import { describe, it } from 'vitest'

import { DEFAULT_DESCRIPTION, SITE_NAME, canonicalFor, canonicalUrl, seo } from '../src/ui/seo.ts'

const tag = (meta: Record<string, string>[], key: string) =>
  meta.find((m) => m.name === key || m.property === key)?.content

describe('seo (contract C4)', () => {
  it('emits the same page tags as the Remix DocumentHead', () => {
    const { meta, links } = seo({
      title: 'D4 Loot Filter Viewer — Diablo IV',
      description: 'Viewer description',
      canonical: 'https://example.test/',
    })
    assert.deepEqual(meta, [
      { title: 'D4 Loot Filter Viewer — Diablo IV' },
      { name: 'description', content: 'Viewer description' },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:title', content: 'D4 Loot Filter Viewer — Diablo IV' },
      { property: 'og:description', content: 'Viewer description' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:url', content: 'https://example.test/' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'D4 Loot Filter Viewer — Diablo IV' },
      { name: 'twitter:description', content: 'Viewer description' },
    ])
    assert.deepEqual(links, [{ rel: 'canonical', href: 'https://example.test/' }])
  })

  it('falls back to the site description and omits URL tags without a canonical', () => {
    const { meta, links } = seo({ title: 'T' })
    assert.equal(tag(meta, 'description'), DEFAULT_DESCRIPTION)
    assert.equal(tag(meta, 'og:url'), undefined)
    assert.deepEqual(links, [])
  })

  it('switches to the large-image card and adds image tags when an og image is set', () => {
    const { meta } = seo({ title: 'T', ogImage: '/og.png' })
    assert.equal(tag(meta, 'twitter:card'), 'summary_large_image')
    assert.equal(tag(meta, 'og:image'), '/og.png')
    assert.equal(tag(meta, 'twitter:image'), '/og.png')
  })
})

describe('canonical URLs', () => {
  it('join the origin and path without query or hash', () => {
    assert.equal(canonicalUrl('https://example.test', '/edit'), 'https://example.test/edit')
  })

  it('read the origin from the root match loader data', () => {
    assert.equal(canonicalFor([{ loaderData: { origin: 'https://example.test' } }], '/'), 'https://example.test/')
  })

  it('are omitted when the root match has no origin yet', () => {
    assert.equal(canonicalFor([{ loaderData: undefined }], '/'), undefined)
    assert.equal(canonicalFor([], '/'), undefined)
  })
})
