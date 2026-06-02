import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { run } from 'remix/ui'

inject()
injectSpeedInsights()

run({
  async loadModule(moduleUrl, exportName) {
    const mod = await import(moduleUrl)
    return mod[exportName]
  },
  async resolveFrame(src, signal) {
    const response = await fetch(src, {
      headers: { accept: 'text/html' },
      signal,
    })
    if (!response.ok) {
      throw new Error(`Failed to load page: ${response.status} ${response.statusText}`)
    }
    return response.body ?? (await response.text())
  },
})
