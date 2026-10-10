import { createFileRoute } from "@tanstack/react-router";
import { getPublicClient } from "@/lib/public-client.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const sb = getPublicClient();
        const { data } = await sb
          .from("vehicles")
          .select("slug, updated_at")
          .eq("is_published", true);
        const urls = [
          { loc: `${origin}/`, lastmod: undefined as string | undefined },
          { loc: `${origin}/frota`, lastmod: undefined },
          ...(data ?? []).map((v) => ({
            loc: `${origin}/frota/${v.slug}`,
            lastmod: v.updated_at?.slice(0, 10),
          })),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map(
            (u) =>
              `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`,
          )
          .join("\n")}\n</urlset>`;
        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
