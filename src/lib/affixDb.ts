import { createTransaction } from "@tanstack/db";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { AffixRow } from "./collections";
import { affixCollection, itemCollection, itemTypeCollection } from "./collections";
import { getTocData } from "../server/getTocFn";
import type { TocData } from "./toc";

export { humanize, inferCat } from "./toc";
export type { TocData };

// ── Collection population ─────────────────────────────────────────────────────

export async function populateFromTocData(data: TocData): Promise<void> {
  const { affixes, itemTypes, items } = data;

  if (affixes.length > 0) {
    const tx = createTransaction({
      mutationFn: async ({ transaction }) => {
        affixCollection.utils.acceptMutations(transaction);
      },
    });
    tx.mutate(() => {
      for (const a of affixes) {
        try {
          affixCollection.insert(a as AffixRow);
        } catch {
          /* skip duplicates */
        }
      }
    });
    await tx.isPersisted.promise;
  }

  if (itemTypes.length > 0) {
    const tx = createTransaction({
      mutationFn: async ({ transaction }) => {
        itemTypeCollection.utils.acceptMutations(transaction);
      },
    });
    tx.mutate(() => {
      for (const it of itemTypes) {
        try {
          itemTypeCollection.insert(it);
        } catch {
          /* skip duplicates */
        }
      }
    });
    await tx.isPersisted.promise;
  }

  if (items.length > 0) {
    const tx = createTransaction({
      mutationFn: async ({ transaction }) => {
        itemCollection.utils.acceptMutations(transaction);
      },
    });
    tx.mutate(() => {
      for (const it of items) {
        try {
          itemCollection.insert(it);
        } catch {
          /* skip duplicates */
        }
      }
    });
    await tx.isPersisted.promise;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface AffixDbState {
  affixCount: number;
  itemCount: number;
  ts: number;
  isReady: boolean;
}

/**
 * Calls the TanStack Start server function to load TocData from the server's
 * in-memory cache, then populates the TanStack DB collections.
 * React Query caches the result for 30 min — subsequent calls are instant.
 */
export function useAffixDb(): AffixDbState {
  const { data, status } = useQuery<TocData>({
    queryKey: ["toc"],
    queryFn: () => getTocData(),
    staleTime: 30 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (!data) return;
    populateFromTocData(data).catch(console.warn);
  }, [data]);

  return {
    affixCount: data?.affixes.length ?? 0,
    itemCount: data?.items.length ?? 0,
    ts: data?.ts ?? 0,
    isReady: status === "success",
  };
}
