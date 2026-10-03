import { createFileRoute } from '@tanstack/react-router'

import { SearchBox } from '../spike/search-box.tsx'

export const Route = createFileRoute('/spike-sfn')({
  component: () => <SearchBox />,
})
