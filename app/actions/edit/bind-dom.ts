import { editorStore, loadFilterIntoEditor } from '../../state/editor-store.ts'
import { filterStore } from '../../state/filter-store.ts'

type Updater = () => void

const ROOT_ID = 'edit-app-root'

let editUpdater: Updater | null = null

export function registerEditBindings(update: Updater) {
  editUpdater = update
  ensureEditBindings()
}

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
    }
  })
}
