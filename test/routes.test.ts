import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createAppRouter } from '../app/router.ts'
import { routes } from '../app/routes.ts'

describe('routes', () => {
  it('GET / returns the filter viewer', async () => {
    const router = createAppRouter()
    const response = await router.fetch(
      new Request(`http://localhost${routes.home.href()}`),
    )

    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, /Diablo IV/)
    assert.match(html, /Filter Code/)
    // Client modules keep bare imports; without an import map entry they fail to hydrate.
    assert.match(html, /<script[^>]*type="importmap"[^>]*>[^<]*"zod":"\/assets\//)
  })

  it('GET /edit returns the editor', async () => {
    const router = createAppRouter()
    const response = await router.fetch(
      new Request(`http://localhost${routes.edit.href()}`),
    )

    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, /Filter Editor/)
    assert.match(html, /filter-name/)
  })

  it('GET /api/toc returns JSON', async () => {
    const router = createAppRouter()
    const response = await router.fetch(
      new Request(`http://localhost${routes.tocApi.href()}`),
    )

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Content-Type'), 'application/json')
    const body = await response.json()
    assert.ok(body && typeof body === 'object')
  })
})
