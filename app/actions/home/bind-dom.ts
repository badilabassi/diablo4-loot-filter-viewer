import { loadFilterIntoEditor } from '../../state/editor-store.ts'
import { filterStore } from '../../state/filter-store.ts'

type Updater = () => void

const ROOT_ID = 'home-app-root'

let homeUpdater: Updater | null = null
let homeSetInput: ((v: string) => void) | null = null

export function registerHomeInput(set: (v: string) => void, update: Updater) {
  homeSetInput = set
  homeUpdater = update
  ensureHomeBindings()
}

export function syncHomeTextareaFromStore() {
  const ta = document.getElementById('filter-input') as HTMLTextAreaElement | null
  if (!ta || document.activeElement === ta) return
  const next = filterStore.getState().input
  if (ta.value !== next) ta.value = next
  homeSetInput?.(next)
}

function readTextarea(): string {
  const ta = document.getElementById('filter-input') as HTMLTextAreaElement | null
  return ta?.value ?? filterStore.getState().input
}

function ensureHomeBindings() {
  if (typeof document === 'undefined') return
  const root = document.getElementById(ROOT_ID)
  if (!root || root.dataset.domBound === '1') return
  root.dataset.domBound = '1'

  root.addEventListener('input', (e) => {
    const el = e.target
    if (!(el instanceof HTMLTextAreaElement) || el.id !== 'filter-input') return
    homeSetInput?.(el.value)
  })

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-home-action]')
    if (!btn) return

    switch (btn.getAttribute('data-home-action')) {
      case 'parse': {
        const raw = readTextarea()
        filterStore.setInput(raw)
        filterStore.parseFilter(raw)
        homeUpdater?.()
        break
      }
      case 'example': {
        filterStore.loadExample()
        syncHomeTextareaFromStore()
        homeUpdater?.()
        break
      }
      case 'undo': {
        filterStore.undo()
        syncHomeTextareaFromStore()
        homeUpdater?.()
        break
      }
      case 'redo': {
        filterStore.redo()
        syncHomeTextareaFromStore()
        homeUpdater?.()
        break
      }
      case 'edit': {
        const filter = filterStore.getState().filter
        if (filter) loadFilterIntoEditor(filter)
        break
      }
    }
  })
}
