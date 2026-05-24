import { css } from 'remix/ui'

import { tocStore } from '../state/toc-store.ts'

const CAT_STYLE: Record<string, ReturnType<typeof css>> = {
  offense: css({ color: '#f17b33', borderColor: 'rgba(241,123,51,0.35)', background: 'rgba(241,123,51,0.1)' }),
  defense: css({ color: '#2ec98d', borderColor: 'rgba(46,201,141,0.35)', background: 'rgba(46,201,141,0.1)' }),
  utility: css({ color: '#7f81cd', borderColor: 'rgba(127,129,205,0.35)', background: 'rgba(127,129,205,0.1)' }),
  stat: css({ color: '#f6c844', borderColor: 'rgba(246,200,68,0.35)', background: 'rgba(246,200,68,0.1)' }),
}

export function AffixChip() {
  return ({ snoId }: { snoId: number }) => {
    const entry = tocStore.getAffix(snoId)
    const catStyle = entry ? CAT_STYLE[entry.cat] : undefined

    return (
      <span
        mix={[
          css({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '14px',
            fontFamily: 'var(--font-cinzel)',
            fontWeight: 500,
            letterSpacing: '0.03em',
          }),
          catStyle,
        ]}
        title={entry ? `${entry.raw}\nSNO: ${snoId}` : `Unknown SNO: ${snoId}`}
      >
        {entry ? (
          entry.name
        ) : (
          <>
            <em style={{ fontSize: '14px', opacity: 0.5, fontStyle: 'normal' }}>resolving…</em>
            <span style={{ fontFamily: 'monospace', fontSize: '14px', opacity: 0.4 }}>
              0x{snoId.toString(16).toUpperCase()}
            </span>
          </>
        )}
      </span>
    )
  }
}
