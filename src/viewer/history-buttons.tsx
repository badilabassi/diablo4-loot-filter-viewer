import { useEffect, useState } from 'react'

import { cx } from '../ui/cx.ts'
import shared from '../ui/styles.module.css'
import layout from './viewer-layout.module.css'

interface NavigationLike extends EventTarget {
  canGoBack: boolean
  canGoForward: boolean
}

/**
 * Undo/Redo for the viewer. Each parse is a URL, so these are the browser's Back
 * and Forward (approved behavior change #1).
 *
 * Rendered disabled on the server, as the Remix buttons were on a fresh page.
 * After hydration they follow the Navigation API's canGoBack/canGoForward where
 * the browser supports it, and are simply enabled elsewhere.
 */
export function HistoryButtons() {
  const [can, setCan] = useState({ back: false, forward: false })

  useEffect(() => {
    const nav = (window as { navigation?: NavigationLike }).navigation
    if (!nav || typeof nav.canGoBack !== 'boolean') {
      setCan({ back: true, forward: true })
      return
    }
    const sync = () => setCan({ back: nav.canGoBack, forward: nav.canGoForward })
    sync()
    nav.addEventListener('currententrychange', sync)
    return () => nav.removeEventListener('currententrychange', sync)
  }, [])

  return (
    <div className={layout.history} role="group" aria-label="History">
      <button
        type="button"
        className={cx(shared.iconBtn, shared.btnSecondary, layout.historyButton)}
        disabled={!can.back}
        aria-label="Undo"
        onClick={() => history.back()}
      >
        ↩ Undo
      </button>
      <button
        type="button"
        className={cx(shared.iconBtn, shared.btnSecondary, layout.historyButton)}
        disabled={!can.forward}
        aria-label="Redo"
        onClick={() => history.forward()}
      >
        ↪ Redo
      </button>
    </div>
  )
}
