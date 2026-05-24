import { css } from 'remix/ui'

/** Blizzard D4–style palette (dark elements, gold trim, blood-red primary). */
export const themeVars = css({
  '--d4-bg': '#100c0b',
  '--d4-bg2': '#1a1514',
  '--d4-bg3': '#1e1a17',
  '--d4-surface': '#231f1b',
  '--d4-border': 'rgba(255, 255, 255, 0.08)',
  '--d4-border2': 'rgba(255, 255, 255, 0.14)',
  '--d4-border-gold': 'rgba(196, 120, 32, 0.35)',
  '--d4-gold': '#c47820',
  '--d4-gold2': '#9b7644',
  '--d4-gold3': '#d7ab6d',
  '--d4-primary': '#7a1010',
  '--d4-primary-mid': '#8f1818',
  '--d4-primary-deep': '#5c0c0c',
  '--d4-primary-fg': '#e5e0c8',
  '--d4-text': '#d2c8ae',
  '--d4-text2': '#878582',
  /** Muted labels — ≥4.5:1 on --d4-bg (was #636160 @ 3.16:1). */
  '--d4-text3': '#84817e',
  '--d4-unique': '#dca779',
  '--d4-ancestral': '#fff',
  '--font-cinzel': '"Old Fenris", serif',
  '--font-crimson': '"Exocet", serif',
})

export const pageStyle = css({
  margin: 0,
  minHeight: '100vh',
  color: 'var(--d4-text)',
  fontFamily: 'var(--font-crimson)',
  backgroundColor: 'var(--d4-bg)',
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.012'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6z'/%3E%3C/g%3E%3C/svg%3E\")",
  WebkitFontSmoothing: 'antialiased',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(155, 118, 68, 0.45) transparent',
  '&::-webkit-scrollbar': { width: '8px' },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(155, 118, 68, 0.35)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(196, 120, 32, 0.55)' },
})

export const sectionTitle = css({
  fontFamily: 'var(--font-cinzel)',
  fontSize: '12px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--d4-gold)',
  margin: 0,
})

export const metaLabel = css({
  display: 'block',
  fontFamily: 'var(--font-cinzel)',
  fontSize: '12px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--d4-text3)',
})

/** Primary CTA — blood-red gradient with gold rim (in-game menu style). */
export const btnPrimary = css({
  fontFamily: 'var(--font-cinzel)',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '8px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'var(--d4-primary-fg)',
  background: 'linear-gradient(180deg, var(--d4-primary-mid) 0%, var(--d4-primary) 45%, var(--d4-primary-deep) 100%)',
  border: '1px solid var(--d4-border-gold)',
  boxShadow:
    'inset 0 1px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 0 rgba(0, 0, 0, 0.35), 0 2px 10px rgba(0, 0, 0, 0.55)',
  transition: 'filter 150ms ease, box-shadow 150ms ease, transform 150ms ease',
  '&:hover': {
    filter: 'brightness(1.1)',
    transform: 'translateY(-1px)',
    boxShadow:
      'inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 14px rgba(122, 16, 16, 0.5), 0 4px 14px rgba(0, 0, 0, 0.55)',
  },
  '&:active': {
    transform: 'translateY(0)',
    filter: 'brightness(0.95)',
  },
  '&:disabled': { opacity: 0.35, cursor: 'not-allowed', filter: 'none', transform: 'none' },
})

/** Minimum touch target for icon-only controls (WCAG 2.5.8). */
export const iconBtn = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '44px',
  minHeight: '44px',
  padding: '8px',
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  color: 'var(--d4-text3)',
  font: 'inherit',
  borderRadius: '6px',
  '&:disabled': { opacity: 0.35, cursor: 'not-allowed' },
  '&:hover:not(:disabled)': { color: 'var(--d4-gold3)' },
})

export const btnSecondary = css({
  fontFamily: 'var(--font-cinzel)',
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '6px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'var(--d4-text2)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
  border: '1px solid var(--d4-border)',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 4px rgba(0, 0, 0, 0.4)',
  transition: 'all 150ms ease',
  '&:hover': {
    color: 'var(--d4-gold3)',
    borderColor: 'var(--d4-border-gold)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
    transform: 'translateY(-1px)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 10px rgba(196, 120, 32, 0.15), 0 2px 6px rgba(0,0,0,0.4)',
  },
  '&:active': { transform: 'translateY(0)' },
  '&:disabled': { opacity: 0.35, cursor: 'not-allowed', transform: 'none' },
})

/** Gold L-bracket corners (in-game panel frames). */
export const ornateFrame = css({
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    borderRadius: 'inherit',
    zIndex: 2,
    background: `
      linear-gradient(90deg, rgba(196, 120, 32, 0.9) 0%, transparent 70%) 0 0 / 20px 2px no-repeat,
      linear-gradient(180deg, rgba(196, 120, 32, 0.9) 0%, transparent 70%) 0 0 / 2px 20px no-repeat,
      linear-gradient(270deg, rgba(196, 120, 32, 0.9) 0%, transparent 70%) 100% 0 / 20px 2px no-repeat,
      linear-gradient(180deg, rgba(196, 120, 32, 0.9) 0%, transparent 70%) 100% 0 / 2px 20px no-repeat,
      linear-gradient(90deg, rgba(196, 120, 32, 0.9) 0%, transparent 70%) 0 100% / 20px 2px no-repeat,
      linear-gradient(0deg, rgba(196, 120, 32, 0.9) 0%, transparent 70%) 0 100% / 2px 20px no-repeat,
      linear-gradient(270deg, rgba(196, 120, 32, 0.9) 0%, transparent 70%) 100% 100% / 20px 2px no-repeat,
      linear-gradient(0deg, rgba(196, 120, 32, 0.9) 0%, transparent 70%) 100% 100% / 2px 20px no-repeat
    `,
    opacity: 0.55,
    transition: 'opacity 220ms ease',
  },
  '&:hover::before': { opacity: 0.85 },
})

export const ornateFrameStrong = css({
  '&::before': { opacity: 0.75 },
  '&:hover::before': { opacity: 1 },
})

export const cardEntrance = css({
  animation: 'd4-card-in 0.45s ease-out both',
})

export const cardStyle = css({
  borderRadius: '8px',
  marginBottom: '8px',
  overflow: 'hidden',
  border: '1px solid var(--d4-border)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 12px rgba(0,0,0,0.35)',
  transition: 'border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease',
  '&:hover': {
    borderColor: 'var(--d4-border2)',
    transform: 'translateY(-2px)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 20px rgba(0,0,0,0.5)',
  },
})

/** Active filter / section header strip (gold wash). */
export const cardSection = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '12px',
  background:
    'linear-gradient(90deg, rgba(196, 120, 32, 0.14) 0%, rgba(196, 120, 32, 0.04) 55%, transparent 100%)',
  border: '1px solid rgba(196, 120, 32, 0.32)',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 20px rgba(196, 120, 32, 0.08)',
  transition: 'box-shadow 200ms ease',
  '&:hover': {
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 28px rgba(196, 120, 32, 0.14)',
  },
})

export const panelInset = css({
  borderTop: '1px solid rgba(196, 120, 32, 0.15)',
  padding: '16px',
  background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.2) 100%)',
})

export const condBlockStyle = css({
  borderRadius: '6px',
  border: '1px solid var(--d4-border)',
  padding: '14px',
  marginBottom: '6px',
  background: 'var(--d4-bg)',
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)',
})

export const inputStyle = css({
  width: '100%',
  borderRadius: '6px',
  border: '1px solid var(--d4-border-gold)',
  background: 'var(--d4-bg2)',
  color: 'var(--d4-text)',
  fontFamily: 'ui-monospace, monospace',
  fontSize: '12px',
  padding: '14px',
  outline: 'none',
  resize: 'none',
  overflow: 'auto',
  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.35)',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(155, 118, 68, 0.45) transparent',
  '&::-webkit-scrollbar': { width: '6px', height: '6px' },
  '&::-webkit-scrollbar-track': { background: 'transparent', margin: '4px 0' },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(155, 118, 68, 0.35)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(196, 120, 32, 0.55)' },
  '&:focus': {
    borderColor: 'rgba(196, 120, 32, 0.55)',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.35), 0 0 0 1px rgba(196, 120, 32, 0.25)',
  },
})

export const selectStyle = css({
  fontFamily: 'var(--font-cinzel)',
  fontSize: '12px',
  padding: '6px 10px',
  borderRadius: '4px',
  border: '1px solid var(--d4-border-gold)',
  background: 'var(--d4-bg2)',
  color: 'var(--d4-text)',
  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.35)',
})

export const errorBanner = css({
  marginTop: '8px',
  padding: '10px 14px',
  borderRadius: '6px',
  position: 'relative',
  fontSize: '12px',
  fontFamily: 'var(--font-cinzel)',
  letterSpacing: '0.06em',
  color: '#f5b8b8',
  border: '1px solid rgba(122, 16, 16, 0.55)',
  background: 'linear-gradient(90deg, rgba(122, 16, 16, 0.25) 0%, rgba(122, 16, 16, 0.08) 100%)',
  boxShadow: 'inset 0 0 12px rgba(122, 16, 16, 0.15)',
})
