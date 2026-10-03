'use client'

import { animate } from 'motion'
import { useRef, useState } from 'react'

/** Spike probe: a client island (state + motion) embedded in server-rendered output. */
export function MotionToggle() {
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)

  return (
    <div>
      <button
        type="button"
        data-testid="motion-toggle"
        onClick={() => {
          const next = !open
          setOpen(next)
          if (panel.current) {
            animate(panel.current, { opacity: next ? [0, 1] : [1, 0] }, { duration: 0.2 })
          }
        }}
      >
        {open ? 'Hide' : 'Show'} client panel
      </button>
      <div ref={panel} data-testid="motion-panel" style={{ opacity: 0 }}>
        hydrated: {String(open)}
      </div>
    </div>
  )
}
