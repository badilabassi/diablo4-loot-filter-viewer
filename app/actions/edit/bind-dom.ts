import { editorStore, loadFilterIntoEditor } from '../../state/editor-store.ts'
import { filterStore } from '../../state/filter-store.ts'

type Updater = () => void

const ROOT_ID = 'edit-app-root'

let editUpdater: Updater | null = null

export function registerEditBindings(update: Updater) {
  editUpdater = update
  ensureEditBindings()
}

/** Pull the viewer filter into the editor when opening Edit (nav or first load). */
export function syncEditorFromViewer() {
  const filter = filterStore.getState().filter
  if (filter) loadFilterIntoEditor(filter)
}

export function syncFilterNameFromStore() {
  const input = document.getElementById('filter-name') as HTMLInputElement | null
  if (!input || document.activeElement === input) return
  const next = editorStore.getState().filter.name
  if (input.value !== next) input.value = next
}

export function syncExportTextareaFromStore() {
  const ta = document.getElementById('export-b64') as HTMLTextAreaElement | null
  if (!ta) return
  const next = editorStore.getState().exportedB64 ?? ''
  if (ta.value !== next) ta.value = next
}

function ensureEditBindings() {
  if (typeof document === 'undefined') return
  const root = document.getElementById(ROOT_ID)
  if (!root || root.dataset.domBound === '1') return
  root.dataset.domBound = '1'

  root.addEventListener(
    'blur',
    (e) => {
      const el = e.target
      if (!(el instanceof HTMLInputElement) || el.id !== 'filter-name') return
      editorStore.setFilterName(el.value)
      editUpdater?.()
    },
    true,
  )

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-edit-action]')
    if (!btn) return

    switch (btn.getAttribute('data-edit-action')) {
      case 'import': {
        syncEditorFromViewer()
        syncFilterNameFromStore()
        editUpdater?.()
        break
      }
      case 'undo':
        editorStore.undo()
        syncFilterNameFromStore()
        editUpdater?.()
        break
      case 'redo':
        editorStore.redo()
        syncFilterNameFromStore()
        editUpdater?.()
        break
      case 'copy':
        void (async () => {
          try {
            const b64 = editorStore.exportFilter()
            await navigator.clipboard.writeText(b64)
            editUpdater?.()
          } catch {
            /* ignore */
          }
        })()
        break
      case 'clear-export':
        editorStore.clearExport()
        syncExportTextareaFromStore()
        editUpdater?.()
        break
      case 'add-rule':
        editorStore.addRule()
        editUpdater?.()
        break
      case 'select-export': {
        const ta = document.getElementById('export-b64') as HTMLTextAreaElement | null
        ta?.select()
        break
      }
    }
  })
}
