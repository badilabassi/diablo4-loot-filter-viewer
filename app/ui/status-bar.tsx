import { css } from 'remix/ui'

import { tocStore } from '../state/toc-store.ts'

export function StatusBar() {
  return () => {
    const { status, data } = tocStore.getState()
    if (status !== 'ready' || !data) {
      return (
        <div
          mix={css({
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            fontFamily: 'var(--font-cinzel)',
            letterSpacing: '0.05em',
            padding: '8px 0',
          })}
        >
          <span
            mix={css({
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--d4-gold)',
              animation: 'd4-pulse 1.5s ease-in-out infinite',
            })}
          />
          <span style={{ color: 'var(--d4-gold2)' }}>Loading index…</span>
        </div>
      )
    }

    const ageH = Math.round((Date.now() - data.ts) / (1000 * 60 * 60))
    const age =
      ageH < 1 ? 'just now' : ageH < 24 ? `${ageH}h ago` : `${Math.round(ageH / 24)}d ago`

    return (
      <div
        mix={css({
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          fontFamily: 'var(--font-cinzel)',
          letterSpacing: '0.05em',
          padding: '8px 0',
        })}
      >
        <span
          mix={css({
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#4caf50',
            boxShadow: '0 0 5px #4caf5088',
          })}
        />
        <span style={{ color: '#4caf50' }}>Index ready</span>
        <span style={{ color: 'var(--d4-text3)' }}>·</span>
        <span style={{ color: 'var(--d4-text2)' }}>{data.affixes.length.toLocaleString()} affixes</span>
        <span style={{ color: 'var(--d4-text3)' }}>·</span>
        <span style={{ color: 'var(--d4-text2)' }}>{data.items.length.toLocaleString()} items</span>
        <span style={{ marginLeft: 'auto', color: 'var(--d4-text3)', fontSize: '12px' }}>
          seeded {age}
        </span>
      </div>
    )
  }
}
