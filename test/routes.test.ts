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
    assert.match(await response.text(), /Diablo IV/)
    assert.match(await response.text(), /Filter share code/)
  })

  it('GET /edit returns the editor', async () => {
    const router = createAppRouter()
    const response = await router.fetch(
      new Request(`http://localhost${routes.edit.href()}`),
    )

    assert.equal(response.status, 200)
    assert.match(await response.text(), /Filter Editor/)
    assert.match(await response.text(), /filter-name/)
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
