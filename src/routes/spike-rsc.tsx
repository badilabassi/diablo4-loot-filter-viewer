import { createFileRoute } from '@tanstack/react-router'

import { getRscCard } from '../spike/rsc.functions.ts'

export const Route = createFileRoute('/spike-rsc')({
  loader: async () => ({ Card: (await getRscCard()).Renderable }),
  component: SpikeRsc,
})

function SpikeRsc() {
  return <>{Route.useLoaderData().Card}</>
}
