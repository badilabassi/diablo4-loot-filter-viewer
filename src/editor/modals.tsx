import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react'

import { parseFilterB64 } from '../filter/proto.ts'
import { cx } from '../ui/cx.ts'
import shared from '../ui/styles.module.css'
import layout from './editor-layout.module.css'
import { loadFilterIntoEditor } from './editor-store.ts'

/**
 * Modal dialog, ported from the Remix EditApp: overlay click and Escape close,
 * Tab is trapped inside, the element named by `initialFocusId` gets focus on
 * open, and focus returns to whatever opened the dialog when it closes.
 */
function Dialog({
  id,
  title,
  initialFocusId,
  onClose,
  children,
}: {
  id: string
  title: string
  initialFocusId: string
  onClose: () => void
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => document.getElementById(initialFocusId)?.focus())
    return () => {
      requestAnimationFrame(() => trigger?.focus())
    }
  }, [initialFocusId])

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]),textarea:not([disabled])',
      ),
    )
    if (!focusable.length) return
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // Clicking the overlay is a pointer convenience (Escape and the close buttons
  // work from the keyboard); the dialog's handlers only stop that click from
  // bubbling and trap Tab, so neither needs its own keyboard equivalent.
  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className={layout.overlay} onClick={onClose}>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={dialogRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className={cx(layout.dialog, shared.ornateFrame, shared.ornateFrameStrong)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <h2 id={`${id}-title`} className={layout.dialogTitle}>
          {title}
        </h2>
        {children}
        <button
          type="button"
          id={`${id}-close`}
          aria-label="Close"
          className={cx(shared.iconBtn, layout.dialogClose)}
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  )
}

/**
 * Paste a filter code to replace the editor's working copy.
 * The Remix version also offered "import from the Viewer"; the viewer's state is
 * now its URL, and the View→Edit link already carries it (plan C6Δ).
 */
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function doImport() {
    const code = inputRef.current?.value.trim() ?? ''
    if (!code) {
      setError('Paste a filter code first.')
      return
    }
    try {
      loadFilterIntoEditor(parseFilterB64(code))
      onClose()
    } catch {
      setError('Invalid filter code — could not parse.')
    }
  }

  return (
    <Dialog
      id="import-modal"
      title="Import Filter"
      initialFocusId="import-code-input"
      onClose={onClose}
    >
      <label className={cx(shared.metaLabel, layout.dialogLabel)} htmlFor="import-code-input">
        Filter Code (base64)
      </label>
      <textarea
        ref={inputRef}
        id="import-code-input"
        rows={5}
        spellCheck={false}
        placeholder="Paste base64 filter code here…"
        className={cx(shared.input, error ? layout.dialogFieldWithError : layout.dialogField)}
      />
      {error && <p className={cx(shared.errorBanner, layout.dialogError)}>{error}</p>}
      <div className={layout.dialogActions}>
        <button type="button" className={shared.btnSecondary} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={shared.btnPrimary} onClick={doImport}>
          Import
        </button>
      </div>
    </Dialog>
  )
}

/** Shows the editor's filter as a code to paste into the game. */
export function ExportDialog({ code, onClose }: { code: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Dialog
      id="export-modal"
      title="Export Filter"
      initialFocusId="export-modal-close"
      onClose={onClose}
    >
      <label className={cx(shared.metaLabel, layout.dialogLabel)} htmlFor="export-code-output">
        Filter Code (base64)
      </label>
      <textarea
        id="export-code-output"
        readOnly
        rows={5}
        value={code}
        className={cx(shared.input, layout.exportField)}
      />
      <div className={layout.dialogActions}>
        <button type="button" className={shared.btnSecondary} onClick={onClose}>
          Close
        </button>
        <button
          type="button"
          className={shared.btnPrimary}
          onClick={() => void navigator.clipboard.writeText(code).then(() => setCopied(true))}
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
    </Dialog>
  )
}
