import { useSyncExternalStore } from 'react'

import { cx } from '../ui/cx.ts'
import shared from '../ui/styles.module.css'
import layout from './viewer-layout.module.css'

interface NavigationLike extends EventTarget {
  canGoBack: boolean
  canGoForward: boolean
}

function navigationApi(): NavigationLike | undefined {
  const nav = (window as { navigation?: NavigationLike }).navigation
  return nav && typeof nav.canGoBack === 'boolean' ? nav : undefined
}

function subscribe(onChange: () => void) {
  const nav = navigationApi()
  nav?.addEventListener('currententrychange', onChange)
  return () => nav?.removeEventListener('currententrychange', onChange)
}

// Snapshots are strings so they compare by value between reads.
// Without the Navigation API both buttons are simply enabled.
const clientSnapshot = () => {
  const nav = navigationApi()
  return nav ? `${nav.canGoBack}|${nav.canGoForward}` : 'true|true'
}
const serverSnapshot = () => 'false|false'

/**
 * Undo/Redo for the viewer. Each parse is a URL, so these are the browser's Back
 * and Forward (approved behavior change #1).
 *
 * Rendered disabled on the server, as the Remix buttons were on a fresh page.
 * After hydration they follow the Navigation API's canGoBack/canGoForward where
 * the browser supports it, and are simply enabled elsewhere.
 */
export function HistoryButtons() {
  const [back, forward] = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot).split('|')
  const can = { back: back === 'true', forward: forward === 'true' }

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
