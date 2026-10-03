import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { run } from 'remix/component'

inject()
injectSpeedInsights()

run({
  async loadModule(moduleUrl, exportName) {
    const mod = await import(moduleUrl)
    return mod[exportName]
  },
})
