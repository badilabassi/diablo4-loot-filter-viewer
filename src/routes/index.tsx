import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: SpikeIndex,
})

function SpikeIndex() {
  return (
    <main style={{ fontFamily: 'serif', padding: 24 }}>
      <h1>TanStack Start spike</h1>
      <ul>
        <li><Link to="/spike-rsc">(a) RSC + CSS Module + client motion child</Link></li>
        <li><Link to="/spike-sfn">(b) server function imported only from a client component</Link></li>
        <li><a href="/api/toc">(c) /api/toc with CDN cache headers</a></li>
      </ul>
    </main>
  )
}
