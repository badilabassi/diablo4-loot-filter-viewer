import { createServerFn } from '@tanstack/react-start'
import { renderServerComponent } from '@tanstack/react-start/rsc'
import { createElement } from 'react'

import { RscCard } from './rsc-card.tsx'

/** Spike probe (a): a server component rendered to a Flight payload in a server function. */
export const getRscCard = createServerFn().handler(async () => {
  const Renderable = await renderServerComponent(
    createElement(RscCard, { renderedAt: new Date().toISOString() }),
  )
  return { Renderable }
})
