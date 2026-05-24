import { Document } from '../../ui/document.tsx'
import { HomeApp } from './app.tsx'

export interface HomePageProps {
  clientEntryHref: string
  editHref: string
}

export function HomePage() {
  return ({ clientEntryHref, editHref }: HomePageProps) => (
    <Document title="D4 Filter Viewer" clientEntryHref={clientEntryHref}>
      <HomeApp editHref={editHref} />
    </Document>
  )
}
