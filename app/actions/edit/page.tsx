import type { Handle } from 'remix/ui'

import { Document } from '../../ui/document.tsx'
import { EditApp } from './app.tsx'

export interface EditPageProps {
  clientEntryHref: string
  homeHref: string
  canonical: string
}

const EDIT_TITLE = 'D4 Loot Filter Editor — Diablo IV'
const EDIT_DESCRIPTION =
  'Edit Diablo IV loot filter rules, tune conditions and affixes, and export base64 filter code ready to paste into the game.'

export function EditPage(handle: Handle<EditPageProps>) {
  return () => {
    const { clientEntryHref, homeHref, canonical } = handle.props
    return (
      <Document
        title={EDIT_TITLE}
        description={EDIT_DESCRIPTION}
        canonical={canonical}
        clientEntryHref={clientEntryHref}
      >
        <EditApp homeHref={homeHref} />
      </Document>
    )
  }
}
