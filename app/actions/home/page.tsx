import { Document } from '../../ui/document.tsx'
import { HomeApp } from './app.tsx'

export interface HomePageProps {
  clientEntryHref: string
  editHref: string
  canonical: string
}

const HOME_TITLE = 'D4 Loot Filter Viewer — Diablo IV'
const HOME_DESCRIPTION =
  'Browse and inspect Diablo IV loot filter rules in your browser. Paste filter code to explore conditions, affixes, and item types.'

export function HomePage() {
  return ({ clientEntryHref, editHref, canonical }: HomePageProps) => (
    <Document
      title={HOME_TITLE}
      description={HOME_DESCRIPTION}
      canonical={canonical}
      clientEntryHref={clientEntryHref}
    >
      <HomeApp editHref={editHref} />
    </Document>
  )
}
