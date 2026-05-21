import { createServerFn } from "@tanstack/react-start";
import type { TocData } from "../lib/toc";
import { getCachedTocData } from "./toc";

/**
 * TanStack Start server function — fetches TocData from the server's
 * in-memory stale-while-revalidate cache.
 * Isolated in its own file so the Vite plugin can cleanly strip the
 * server-only imports (node:fs, node:path, …) from the client bundle.
 */
export const getTocData = createServerFn({ method: "GET" }).handler(
  (): Promise<TocData> => getCachedTocData(),
);
