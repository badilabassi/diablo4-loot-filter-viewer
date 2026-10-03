import { type DOMKeyframesDefinition, animateMini as animate } from 'motion'
import { useCallback, useState } from 'react'

/**
 * Sidebar visibility, ported from the Remix HomeApp:
 * - 'css-default': media queries decide (desktop: open, mobile: closed), no JS needed
 * - 'open':        explicitly opened by the user (overrides the CSS hide on mobile)
 * - 'closed':      explicitly closed by the user (overrides the CSS show on desktop)
 */
export type SidebarState = 'css-default' | 'open' | 'closed'

const collapseKf: DOMKeyframesDefinition = { opacity: 0, x: -20 }
const expandKf: DOMKeyframesDefinition = { opacity: [0, 1], x: [-20, 0] }

export function useSidebar(sidebarId: string) {
  const [state, setState] = useState<SidebarState>('css-default')

  const collapse = useCallback(async () => {
    const el = document.getElementById(sidebarId)
    if (el) await animate(el, collapseKf, { duration: 0.18, ease: 'easeIn' }).finished
    setState('closed')
  }, [sidebarId])

  const expand = useCallback(() => {
    setState('open')
    // Animate once React has shown the sidebar.
    requestAnimationFrame(() => {
      const el = document.getElementById(sidebarId)
      if (el) animate(el, expandKf, { duration: 0.28, ease: [0.22, 1, 0.36, 1] })
    })
  }, [sidebarId])

  const toggle = useCallback(() => {
    if (state === 'open') void collapse()
    else expand()
  }, [state, collapse, expand])

  return { state, open: state === 'open', closed: state === 'closed', collapse, expand, toggle }
}
