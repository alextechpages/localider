import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { VehicleCard } from "@/components/site/VehicleCard";
import { Input } from "@/components/ui/input";
import { settingsQuery, vehiclesQuery } from "@/lib/public.functions";
import { CATEGORY_FILTERS, vehicleName } from "@/lib/site";
import { cn } from "@/lib/utils";

const TITLE = "Frota de Veículos para Locação em LEM | Localider";
const DESC =
  "Conheça a frota da Localider em Luís Eduardo Magalhães – BA: econômicos, hatches, sedãs, SUVs, picapes e utilitários para aluguel.";

export const Route = createFileRoute("/frota/")({
  validateSearch: z.object({ categoria: z.string().optional() }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(vehiclesQuery());
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fleet,
});

function Fleet() {
  const { categoria = "todos" } = Route.useSearch();
  const { data: s } = useSuspenseQuery(settingsQuery());
  const { data: vehicles } = useSuspenseQuery(vehiclesQuery());
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return vehicles.filter(
      (v) =>
        (categoria === "todos" || v.category?.slug === categoria) &&
        (!term || vehicleName(v).toLowerCase().includes(term)),
    );
  }, [vehicles, categoria, q]);

  return (
    <SiteShell>
      <section className="bg-ink pb-14 pt-16 text-ink-foreground md:pt-20">
        <div className="container-site">
          <p className="eyebrow text-accent">Catálogo</p>
          <h1 className="mt-3 text-4xl font-black md:text-6xl">Nossa frota</h1>
          <p className="mt-4 max-w-xl text-ink-muted">Encontre o veículo ideal e fale com a nossa equipe pelo WhatsApp.</p>
          <div className="relative mt-8 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por marca ou modelo" aria-label="Buscar por marca ou modelo" className="h-12 bg-background pl-10 text-foreground" />
          </div>
        </div>
      </section>
      <div className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur md:top-20">
        <div className="container-site flex gap-2 overflow-x-auto py-3" role="tablist" aria-label="Filtrar por categoria">
          {CATEGORY_FILTERS.map((c) => (
            <Link
              key={c.slug}
              to="/frota"
              search={c.slug === "todos" ? {} : { categoria: c.slug }}
              role="tab"
              aria-selected={categoria === c.slug}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                categoria === c.slug ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground",
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
      <section className="container-site py-12 md:py-16">
        {list.length === 0 ? (
          <div className="rounded-2xl border bg-secondary p-12 text-center">
            <p className="text-lg font-bold">Nenhum veículo encontrado</p>
            <p className="mt-2 text-muted-foreground">Tente outra categoria ou busca — ou fale com a gente pelo WhatsApp.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((v) => <VehicleCard key={v.id} v={v} whatsapp={s.whatsapp} />)}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
