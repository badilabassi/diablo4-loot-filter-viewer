import { Link, createFileRoute } from '@tanstack/react-router'

import { canonicalFor, seo } from '../ui/seo.ts'

export const Route = createFileRoute('/')({
  head: ({ matches, match }) =>
    seo({
      title: 'D4 Loot Filter Viewer — Diablo IV',
      description:
        'Browse and inspect Diablo IV loot filter rules in your browser. Paste filter code to explore conditions, affixes, and item types.',
      canonical: canonicalFor(matches, match.pathname),
    }),
  component: Viewer,
})

// Placeholder until the viewer is ported (migration phases 4–5).
function Viewer() {
  return (
    <main id="main-content" style={{ padding: 24 }}>
      <h1>Diablo IV · Filter Viewer</h1>
      <p>The viewer is being ported. Spike probes:</p>
      <ul>
        <li><Link to="/spike-rsc">(a) RSC + CSS Module + client motion child</Link></li>
        <li><Link to="/spike-sfn">(b) searchToc from a client component</Link></li>
        <li><a href="/api/toc">(c) /api/toc</a></li>
      </ul>
    </main>
  )
}
