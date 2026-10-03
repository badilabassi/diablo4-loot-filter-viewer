import type { ScriptEntry } from 'remix/assets'
import type { Handle } from 'remix/component'

import { Document } from '../../ui/document.tsx'
import { HomeApp } from './app.tsx'

export interface HomePageProps {
  clientEntry: ScriptEntry
  editHref: string
  canonical: string
}

const HOME_TITLE = 'D4 Loot Filter Viewer — Diablo IV'
const HOME_DESCRIPTION =
  'Browse and inspect Diablo IV loot filter rules in your browser. Paste filter code to explore conditions, affixes, and item types.'

export function HomePage(handle: Handle<HomePageProps>) {
  return () => {
    const { clientEntry, editHref, canonical } = handle.props
    return (
      <Document
        title={HOME_TITLE}
        description={HOME_DESCRIPTION}
        canonical={canonical}
        clientEntry={clientEntry}
      >
        <HomeApp editHref={editHref} />
      </Document>
    )
  }
}
