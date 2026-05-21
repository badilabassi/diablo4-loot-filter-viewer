import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";
import { BOOTSTRAP } from "./bootstrap";
import type { AffixEntry } from "./schemas";

export type AffixRow = AffixEntry & { id: number };
export type ItemTypeRow = { id: number; name: string };
export type ItemRow = { id: number; name: string };

export const affixCollection = createCollection(
  localOnlyCollectionOptions<AffixRow, number>({
    getKey: (item) => item.id,
    initialData: Object.entries(BOOTSTRAP).map(([id, e]) => ({
      id: Number(id),
      ...e,
    })),
  }),
);

export const itemTypeCollection = createCollection(
  localOnlyCollectionOptions<ItemTypeRow, number>({
    getKey: (item) => item.id,
  }),
);

export const itemCollection = createCollection(
  localOnlyCollectionOptions<ItemRow, number>({
    getKey: (item) => item.id,
  }),
);
