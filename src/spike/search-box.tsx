'use client'

import { useState } from 'react'

import { searchAffixes } from './search.functions.ts'

/** Spike probe (b): a client component calling a server function only it imports. */
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
            setResults(await searchAffixes({ data: { query: e.target.value } }))
            setError(null)
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
          }
        }}
      />
      {error && <p data-testid="search-error" role="alert">{error}</p>}
      {results && (
        <ul data-testid="search-results">
          {results.map((r) => <li key={r}>{r}</li>)}
        </ul>
      )}
    </div>
  )
}
