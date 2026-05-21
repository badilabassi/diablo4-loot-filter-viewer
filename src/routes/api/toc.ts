import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getCachedTocData } from "../../server/toc";

export const APIRoute = createAPIFileRoute("/api/toc")({
  GET: async () => {
    const data = await getCachedTocData();
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        // Browser caches for 30 min; serves stale for up to 24 h while revalidating.
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400",
      },
    });
  },
});
