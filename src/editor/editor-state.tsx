import { type ReactNode, createContext, useContext, useSyncExternalStore } from 'react'

import type { TocEntry, TocKind } from '../data/toc-kinds.ts'
import { serializeFilter } from '../filter/proto.ts'
import type { ParsedFilter } from '../filter/schemas.ts'
import { editorStore, loadFilterIntoEditor } from './editor-store.ts'
import { type TocLabels, rememberAllLabels, tocLabelStore } from './toc-labels.ts'

/**
 * How editor components read state.
 *
 * The editor's working copy lives in client-only module stores (editorStore,
 * tocLabelStore). Those must never be written on the server, where modules are
 * shared across requests (plan D7). So the server renders, and hydration
 * matches, the route loader's data, provided through this context. After
 * hydration, the hooks switch to the live client stores, which
 * `useEditorBootstrap` loaded with the same data before the first client render.
 */

export interface EditorSnapshot {
  filter: ParsedFilter
  canUndo: boolean
  canRedo: boolean
}

interface InitialState {
  filter: ParsedFilter
  labels: TocLabels
}

const InitialStateContext = createContext<InitialState | null>(null)

export function EditorStateProvider({ initial, children }: { initial: InitialState; children: ReactNode }) {
  return <InitialStateContext.Provider value={initial}>{children}</InitialStateContext.Provider>
}

function useInitialState(): InitialState {
  const initial = useContext(InitialStateContext)
  if (!initial) throw new Error('Editor components must render inside <EditorStateProvider>')
  return initial
}

/**
 * Selects from the editor state. The selector must return a stable value: a
 * primitive or a reference held in state (`s => s.filter.rules[i]`), never a new
 * object or array built on each call.
 */
export function useEditor<U>(selector: (s: EditorSnapshot) => U): U {
  const initial = useInitialState()
  return useSyncExternalStore(
    (onChange) => {
      const off = editorStore.subscribe(onChange)
      return () => {
        off()
      }
    },
    () => selector({ filter: editorStore.getState().filter, canUndo: editorStore.canUndo(), canRedo: editorStore.canRedo() }),
    () => selector({ filter: initial.filter, canUndo: false, canRedo: false }),
  )
}

/** The picker label for an id, or undefined until it's known. */
export function useTocLabel(kind: TocKind, id: number): TocEntry | undefined {
  const initial = useInitialState()
  return useSyncExternalStore(
    (onChange) => {
      const off = tocLabelStore.subscribe(onChange)
      return () => {
        off()
      }
    },
    () => tocLabelStore.getState()[kind][id],
    () => initial.labels[kind][id],
  )
}

/** Client-only: the URL code the editor's working copy was last loaded from. */
let loadedCode: string | undefined

/**
 * Loads the filter from `?code` into the editor, once per distinct code. A no-op
 * on the server and when nothing changed, so it's safe to call repeatedly.
 *
 * Skipped when the editor already holds exactly this filter, e.g. after
 * Edit → View → Edit, where the View link carried the edited code: the edits and
 * their undo history are kept (fixes the component audit's bug #1).
 *
 * Called from the /edit loader, which runs before the route renders on client
 * navigations, so stores aren't notified mid-render.
 */
export function bootstrapEditor(code: string | undefined, filter: ParsedFilter | null, labels: TocLabels) {
  if (typeof window === 'undefined') return
  rememberAllLabels(labels)
  if (!code || !filter || code === loadedCode) return
  loadedCode = code
  if (serializeFilter(editorStore.getState().filter) === code) return
  loadFilterIntoEditor(filter)
}

/**
 * The hydration case: on a full page load the client doesn't re-run the loader,
 * so load during the first render instead. Nothing has subscribed yet at that
 * point, and on later renders this is a no-op.
 */
export function useEditorBootstrap(code: string | undefined, filter: ParsedFilter | null, labels: TocLabels) {
  bootstrapEditor(code, filter, labels)
}
