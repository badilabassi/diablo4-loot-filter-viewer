import { useSyncExternalStore } from 'react'

import type { Listener } from './history.ts'

interface ExternalStore<T> {
  getState: () => T
  subscribe: (listener: Listener) => () => unknown
}

/**
 * Subscribes a component to a store from `history.ts` (`createStore` /
 * `createTemporalStore`) and re-renders when the selected value changes.
 *
 * The selector must return a stable value: a primitive, or a reference already
 * held in state (e.g. `s => s.filter`). Building a new object or array inside it
 * returns a fresh value on every read, which React treats as a change on every
 * render. Select the pieces separately instead.
 *
 * The server snapshot is the store's current state too. Client stores are never
 * mutated during server rendering (plan D7), so it is their initial state there.
 */
export function useStore<T, U>(store: ExternalStore<T>, selector: (state: T) => U): U {
  const read = () => selector(store.getState())
  return useSyncExternalStore(
    (onChange) => {
      const unsubscribe = store.subscribe(onChange)
      return () => {
        unsubscribe()
      }
    },
    read,
    read,
  )
}
