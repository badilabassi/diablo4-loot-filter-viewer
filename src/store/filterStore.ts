import { temporal } from "zundo";
import { create } from "zustand";
import { EXAMPLE_FILTER } from "../lib/constants";
import { parseFilterB64 } from "../lib/proto";
import type { ParsedFilter } from "../lib/schemas";

interface FilterState {
  input: string;
  filter: ParsedFilter | null;
  error: string;
  setInput: (v: string) => void;
  parseFilter: (raw?: string) => void;
  loadExample: () => void;
}

export const useFilterStore = create<FilterState>()(
  temporal(
    (set, get) => ({
      input: "",
      filter: null,
      error: "",
      setInput: (input) => set({ input }),
      parseFilter: (raw) => {
        const src = raw ?? get().input;
        try {
          set({ filter: parseFilterB64(src), error: "" });
        } catch (e) {
          set({ error: e instanceof Error ? e.message : String(e), filter: null });
        }
      },
      loadExample: () => {
        set({ input: EXAMPLE_FILTER });
        get().parseFilter(EXAMPLE_FILTER);
      },
    }),
    { partialize: (s) => ({ input: s.input, filter: s.filter, error: s.error }) },
  ),
);
