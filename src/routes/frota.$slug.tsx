import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Fuel, MessageCircle, Settings2, Snowflake, Users, CalendarDays } from "lucide-react";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { StatusBadge } from "@/components/site/VehicleCard";
import { Button } from "@/components/ui/button";
import { settingsQuery, vehicleQuery } from "@/lib/public.functions";
import { TRANSMISSION_LABEL, vehicleMessage, vehicleName, waLink } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/frota/$slug")({
  loader: async ({ context, params }) => {
    const v = await context.queryClient.ensureQueryData(vehicleQuery(params.slug));
    if (!v) throw notFound();
    return { name: vehicleName(v), category: v.category?.name ?? "" };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} para locação em LEM | Localider` : "Veículo | Localider";
    const desc = loaderData
      ? `Alugue o ${loaderData.name}${loaderData.category ? ` (${loaderData.category})` : ""} na Localider, locadora de veículos em Luís Eduardo Magalhães – BA.`
      : "Veículo para locação na Localider.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-site py-24 text-center">
        <h1 className="text-3xl font-black">Veículo não encontrado</h1>
        <Button asChild className="mt-6"><Link to="/frota">Ver frota</Link></Button>
      </div>
    </SiteShell>
  ),
  component: VehiclePage,
});

function VehiclePage() {
  const { slug } = Route.useParams();
  const { data: v } = useSuspenseQuery(vehicleQuery(slug));
  const { data: s } = useSuspenseQuery(settingsQuery());
  const photos = v ? Array.from(new Set([v.main_image_url, ...v.images.map((i) => i.url)].filter(Boolean) as string[])) : [];
  const [active, setActive] = useState(0);
  if (!v) return null;
  const name = vehicleName(v);
  const specs = [
    { icon: Settings2, label: "Transmissão", value: TRANSMISSION_LABEL[v.transmission] },
    { icon: Users, label: "Passageiros", value: `${v.passengers} lugares` },
    { icon: Snowflake, label: "Ar-condicionado", value: v.air_conditioning ? "Sim" : "Não" },
    ...(v.fuel ? [{ icon: Fuel, label: "Combustível", value: v.fuel }] : []),
    ...(v.year ? [{ icon: CalendarDays, label: "Ano", value: String(v.year) }] : []),
  ];

  return (
    <SiteShell>
      <div className="container-site py-8 md:py-12">
        <Link to="/frota" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar para a frota
        </Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-secondary">
              {photos[active] ? (
                <img src={photos[active]} alt={`${name} — foto ${active + 1}`} width={1280} height={864} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">Sem foto</div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
                {photos.map((p, i) => (
                  <button key={p} onClick={() => setActive(i)} aria-label={`Ver foto ${i + 1}`} className={cn("aspect-square overflow-hidden rounded-xl border-2 transition", i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}>
                    <img src={p} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {v.category && <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink-foreground">{v.category.name}</span>}
              <StatusBadge status={v.status} />
              {v.is_demo && <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground">Exemplo demonstrativo</span>}
            </div>
            <p className="eyebrow mt-5 text-primary">{v.brand}</p>
            <h1 className="mt-1 text-4xl font-black md:text-5xl">{v.model}</h1>
            {v.description && <p className="mt-5 whitespace-pre-line text-lg text-muted-foreground">{v.description}</p>}
            <dl className="mt-8 grid grid-cols-2 gap-3">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl border bg-secondary p-4">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Icon className="size-4 text-primary" />{label}</dt>
                  <dd className="mt-1 font-bold">{value}</dd>
                </div>
              ))}
            </dl>
            {v.features.length > 0 && (
              <>
                <h2 className="mt-8 text-lg font-extrabold">Características</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {v.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="size-4 text-primary" />{f}</li>
                  ))}
                </ul>
              </>
            )}
            <Button asChild variant="whatsapp" size="lg" className="mt-10 w-full">
              <a href={waLink(s.whatsapp, vehicleMessage(v))} target="_blank" rel="noopener noreferrer"><MessageCircle /> Tenho interesse neste veículo</a>
            </Button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
