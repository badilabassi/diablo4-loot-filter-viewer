import { Document } from '../../ui/document.tsx'
import { EditApp } from './app.tsx'

export interface EditPageProps {
  clientEntryHref: string
  homeHref: string
}

export function EditPage() {
  return ({ clientEntryHref, homeHref }: EditPageProps) => (
    <Document title="D4 Filter Editor" clientEntryHref={clientEntryHref}>
      <EditApp homeHref={homeHref} />
    </Document>
  )
}
