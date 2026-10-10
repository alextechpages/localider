import { createFileRoute } from "@tanstack/react-router";
import { getPublicClient } from "@/lib/public-client.server";

// Serves images from the private storage bucket at a stable, cacheable URL.
// Read-only; storage RLS allows public reads of the "media" bucket only.
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!/^[a-zA-Z0-9/_.-]{1,300}$/.test(path) || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const sb = getPublicClient();
        const { data, error } = await sb.storage.from("media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
