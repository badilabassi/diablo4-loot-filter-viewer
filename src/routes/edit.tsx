import { createFileRoute } from '@tanstack/react-router'

import { canonicalFor, seo } from '../ui/seo.ts'

export const Route = createFileRoute('/edit')({
  head: ({ matches, match }) =>
    seo({
      title: 'D4 Loot Filter Editor — Diablo IV',
      description:
        'Edit Diablo IV loot filter rules, tune conditions and affixes, and export base64 filter code ready to paste into the game.',
      canonical: canonicalFor(matches, match.pathname),
    }),
  component: Editor,
})

// Placeholder until the editor is ported (migration phase 6).
function Editor() {
  return (
    <main id="main-content" style={{ padding: 24 }}>
      <h1>Diablo IV · Filter Editor</h1>
      <p>The editor is being ported.</p>
    </main>
  )
}
