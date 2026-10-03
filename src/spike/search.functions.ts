import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const AFFIXES = ['Critical Strike Chance', 'Critical Strike Damage', 'Maximum Life', 'Armor', 'Attack Speed']

/**
 * Spike probe (b): stands in for the planned `searchToc`. Imported ONLY from the
 * 'use client' SearchBox, which is the pattern TanStack issue #7943 reports as
 * broken in production builds.
 */
export const searchAffixes = createServerFn({ method: 'GET' })
  .validator(z.object({ query: z.string().max(100) }))
  .handler(async ({ data }) => {
    const q = data.query.toLowerCase()
    return AFFIXES.filter((name) => name.toLowerCase().includes(q))
  })
