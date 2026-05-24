import { css, type RemixNode } from 'remix/ui'

import { pageStyle, themeVars } from './styles.ts'

export interface DocumentProps {
  children?: RemixNode
  head?: RemixNode
  title?: string
  /** Resolved by the asset server in route actions — do not hard-code deployment paths. */
  clientEntryHref: string
}

const DEFAULT_TITLE = 'D4 Filter Viewer'

const globalStyles = `
  @keyframes d4-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
  @keyframes d4-card-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes d4-glow-breathe {
    0%, 100% { opacity: 0.65; }
    50% { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  * {
    box-sizing: border-box;
  }
`

export function Document() {
  return ({
    children,
    head,
    title = DEFAULT_TITLE,
    clientEntryHref,
  }: DocumentProps) => (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>{title}</title>
        <style>{`
          @font-face {
            font-family: "Exocet";
            font-weight: 500;
            src: url("/Exocet-Medium.ttf");
            font-display: swap;
          }
          @font-face {
            font-family: "Old Fenris";
            font-weight: 400;
            src: url("/OldFenris-Regular.otf");
            font-display: swap;
          }
          ${globalStyles}
        `}</style>
        {head}
      </head>
      <body mix={[themeVars, pageStyle]}>
        {children}
        <script type="module" src={clientEntryHref}></script>
      </body>
    </html>
  )
}

export const headerGlow = css({
  position: 'relative',
  textAlign: 'center',
  padding: '56px 24px 48px',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(160, 100, 20, 0.14) 0%, transparent 70%)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(196, 120, 32, 0.35), transparent)',
  },
})

export const navTabs = css({
  display: 'inline-flex',
  borderRadius: '6px',
  padding: '3px',
  gap: '2px',
  background: 'linear-gradient(180deg, rgba(35, 31, 27, 0.95) 0%, rgba(16, 12, 11, 0.95) 100%)',
  border: '1px solid var(--d4-border-gold)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.4)',
  position: 'relative',
})

export const navTabActive = css({
  fontFamily: 'var(--font-cinzel)',
  fontSize: '12px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '6px 18px',
  borderRadius: '4px',
  color: 'var(--d4-gold3)',
  fontWeight: 700,
  background: 'linear-gradient(180deg, rgba(196, 120, 32, 0.22) 0%, rgba(122, 16, 16, 0.35) 100%)',
  border: '1px solid rgba(196, 120, 32, 0.4)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
})

export const navTabLink = css({
  fontFamily: 'var(--font-cinzel)',
  fontSize: '12px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '6px 18px',
  borderRadius: '4px',
  color: 'var(--d4-text3)',
  textDecoration: 'none',
  transition: 'color 150ms ease, background 150ms ease, box-shadow 150ms ease',
  '&:hover': {
    color: 'var(--d4-gold3)',
    background: 'rgba(255, 255, 255, 0.06)',
    boxShadow: '0 0 12px rgba(196, 120, 32, 0.2)',
  },
})

export const mainPanel = css({
  position: 'relative',
  marginTop: '8px',
})

export const containerStyle = css({
  maxWidth: '860px',
  margin: '0 auto',
  padding: '0 24px',
})

export const titleHero = css({
  fontFamily: 'var(--font-cinzel)',
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--d4-gold2)',
  margin: 0,
  fontSize: 'clamp(22px, 4vw, 40px)',
  textShadow: '0 0 40px rgba(196, 120, 32, 0.45), 0 2px 4px rgba(0,0,0,0.8)',
})

export const titleSub = css({
  fontFamily: 'var(--font-cinzel)',
  color: 'var(--d4-gold)',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  fontSize: '12px',
  margin: '4px 0 20px',
})
