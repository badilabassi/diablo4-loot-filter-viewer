export type Listener = () => void

export function createStore<T>(initial: T) {
  let state = initial
  const listeners = new Set<Listener>()

  return {
    getState: () => state,
    setState: (next: T | ((prev: T) => T)) => {
      state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next
      for (const l of listeners) l()
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export function createTemporalStore<T extends object>(initial: T, partialize: (s: T) => Partial<T>) {
  const store = createStore(initial)
  const past: Partial<T>[] = []
  const future: Partial<T>[] = []

  function snapshot() {
    return partialize(store.getState())
  }

  function pushPast() {
    past.push(snapshot())
    if (past.length > 50) past.shift()
    future.length = 0
  }

  return {
    ...store,
    undo: () => {
      if (past.length === 0) return
      future.unshift(snapshot())
      const prev = past.pop()!
      store.setState({ ...store.getState(), ...prev } as T)
    },
    redo: () => {
      if (future.length === 0) return
      past.push(snapshot())
      const next = future.shift()!
      store.setState({ ...store.getState(), ...next } as T)
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    clearHistory: () => {
      past.length = 0
      future.length = 0
    },
    mutate: (fn: (s: T) => void) => {
      pushPast()
      const s = store.getState()
      fn(s)
      store.setState({ ...s })
    },
  }
}
