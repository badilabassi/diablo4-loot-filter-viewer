import { css } from 'remix/ui'

/** Public source repository — update if the project moves. */
export const GITHUB_REPO_URL = 'https://github.com/badilabassi/diablo4-loot-filter-viewer'

const siteFooter = css({
  maxWidth: '860px',
  margin: '48px auto 0',
  padding: '28px 24px 36px',
  borderTop: '1px solid rgba(196, 120, 32, 0.2)',
  textAlign: 'center',
  fontSize: '11px',
  lineHeight: 1.65,
  color: 'var(--d4-text3)',
})

const footerParagraph = css({
  margin: '0 0 10px',
  maxWidth: '52ch',
  marginLeft: 'auto',
  marginRight: 'auto',
})

const githubLink = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  color: 'var(--d4-gold2)',
  textDecoration: 'none',
  transition: 'color 150ms ease',
  '&:hover': {
    color: 'var(--d4-gold3)',
  },
})

const legalText = css({
  margin: '14px 0 0',
  fontSize: '10px',
  lineHeight: 1.55,
  opacity: 0.85,
  maxWidth: '62ch',
  marginLeft: 'auto',
  marginRight: 'auto',
})

export function SiteFooter() {
  return () => (
    <footer role="contentinfo" mix={siteFooter}>
      <p mix={footerParagraph}>
        An unofficial community project — not affiliated with, endorsed by, or sponsored by
        Blizzard Entertainment.
      </p>
      <p mix={footerParagraph}>
        <a
          href={GITHUB_REPO_URL}
          rel="noopener noreferrer"
          target="_blank"
          mix={githubLink}
          aria-label="View source on GitHub (opens in new tab)"
        >
          <svg width="18" height="18" viewBox="0 0 19 19" aria-hidden="true">
            <path
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844"
            />
          </svg>
          <span>View source on GitHub</span>
        </a>
      </p>
      <p mix={legalText}>
        Diablo®, Diablo IV®, and Blizzard Entertainment® are trademarks or registered trademarks
        of Blizzard Entertainment, Inc. in the U.S. and other countries. This site is fan-made
        software for personal use with the game.
      </p>
    </footer>
  )
}
