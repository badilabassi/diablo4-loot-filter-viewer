'use client'

import { useState } from 'react'

import { searchToc } from '../data/toc.functions.ts'

/**
 * Spike probe (b): a client component calling the real searchToc server
 * function, imported only here (the pattern from TanStack issue 7943).
 */
export function SearchBox() {
  const [results, setResults] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <input
        data-testid="search-input"
        placeholder="Search affixes…"
        onChange={async (e) => {
          try {
            const entries = await searchToc({ data: { kind: 'affix', query: e.target.value } })
            setResults(entries.map((entry) => entry.label))
            setError(null)
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
          }
        }}
      />
      {error && <p data-testid="search-error" role="alert">{error}</p>}
      {results && (
        <ul data-testid="search-results">
          {results.map((r, i) => <li key={`${r}-${i}`}>{r}</li>)}
        </ul>
      )}
    </div>
  )
}
