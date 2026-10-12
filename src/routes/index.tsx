import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight, Briefcase, CalendarHeart, CarFront, CreditCard, Headset, Instagram,
  KeyRound, LayoutGrid, MapPin, MessageCircle, Phone, Plane, ShieldCheck, Sun, Users, Wrench,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import roadImg from "@/assets/road.jpg";
import aboutImg from "@/assets/about.jpg";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site/SiteShell";
import { VehicleCard } from "@/components/site/VehicleCard";
import { settingsQuery, vehiclesQuery } from "@/lib/public.functions";
import { GENERAL_MESSAGE, mapsDirections, mapsEmbed, telLink, waLink } from "@/lib/site";

const TITLE = "Aluguel de Carros em Luís Eduardo Magalhães | Localider Locadora de Veículos";
const DESC =
  "Localider: locadora de veículos em Luís Eduardo Magalhães (LEM) – BA. Carros econômicos, sedãs, SUVs, picapes e utilitários. Não bloqueamos cartão. Fale pelo WhatsApp.";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(vehiclesQuery());
  },
  head: () => ({
    {
  name: "google-site-verification",
  content: "Y2ONclTW38J2kKJ3ccK7srV_wyhprCR7n52vG4WeV4Q",
}

    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AutoRental",
          name: "Localider — Locadora de Veículos",
          telephone: "+55-77-99984-0490",
          sameAs: ["https://www.instagram.com/localider_lem/"],
          areaServed: "Luís Eduardo Magalhães, BA",
          address: [
            { "@type": "PostalAddress", streetAddress: "Av. JK, 1885, Centro", addressLocality: "Luís Eduardo Magalhães", addressRegion: "BA", addressCountry: "BR" },
            { "@type": "PostalAddress", streetAddress: "Av. JK, 2305, Centro", addressLocality: "Luís Eduardo Magalhães", addressRegion: "BA", addressCountry: "BR" },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

const USES = [
  { icon: Briefcase, label: "Trabalho" },
  { icon: Plane, label: "Viagens" },
  { icon: Users, label: "Família" },
  { icon: CalendarHeart, label: "Eventos" },
  { icon: Sun, label: "Dia a dia" },
];

const PERKS = [
  { icon: Wrench, title: "Veículos revisados", text: "Carros cuidados para você rodar com tranquilidade." },
  { icon: LayoutGrid, title: "Variedade de modelos", text: "Do econômico à picape, um veículo para cada necessidade." },
  { icon: Headset, title: "Atendimento personalizado", text: "Uma equipe próxima, que entende o que você precisa." },
  { icon: KeyRound, title: "Retirada rápida e flexível", text: "Processo simples para você sair dirigindo sem complicação." },
  { icon: CreditCard, title: "Não bloqueamos cartão", text: "Mais tranquilidade na hora de alugar seu veículo." },
];

const STEPS = [
  { n: "01", title: "Escolha seu veículo", text: "Explore o catálogo e encontre o modelo ideal para sua necessidade." },
  { n: "02", title: "Fale com nossa equipe", text: "Entre em contato pelo WhatsApp para receber atendimento personalizado." },
  { n: "03", title: "Aproveite sua viagem", text: "Combine sua locação com a equipe e siga para seu destino." },
];

function Index() {
  const { data: s } = useSuspenseQuery(settingsQuery());
  const { data: vehicles } = useSuspenseQuery(vehiclesQuery());
  const featured = vehicles.slice(0, 6);
  const wa = waLink(s.whatsapp, GENERAL_MESSAGE);

  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <img src={s.hero_image || heroImg} alt="Carros da Localider em uma estrada ao pôr do sol" width={1920} height={1088} fetchPriority="high" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-overlay-hero" />
        <div className="container-site flex min-h-[78vh] flex-col justify-center py-20 md:min-h-[86vh]">
          <span className="animate-rise inline-flex w-fit items-center gap-2 rounded-md bg-accent px-3 py-1.5 font-display text-xs font-black tracking-widest text-accent-foreground md:text-sm">
            <CreditCard className="size-4" /> NÃO BLOQUEAMOS CARTÃO
          </span>
          <h1 className="animate-rise mt-6 max-w-3xl text-4xl font-black leading-[1.02] sm:text-5xl md:text-7xl" style={{ animationDelay: "80ms" }}>
            {s.hero_title}
          </h1>
          <p className="animate-rise mt-5 max-w-xl text-base text-ink-muted md:text-xl" style={{ animationDelay: "160ms" }}>
            {s.hero_subtitle}
          </p>
          <div className="animate-rise mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
            <Button asChild size="lg">
              <Link to="/frota">Conheça nossa frota <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="ghostLight">
              <a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> Fale com a Localider</a>
            </Button>
          </div>
        </div>
      </section>

      {/* USES STRIP */}
      <section aria-label="Para que você precisa" className="bg-accent text-accent-foreground">
        <ul className="container-site grid grid-cols-2 gap-y-4 py-6 sm:grid-cols-3 md:grid-cols-5">
          {USES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center justify-center gap-2.5 font-display text-base font-extrabold uppercase tracking-wide md:text-lg">
              <Icon className="size-5 md:size-6" /> {label}
            </li>
          ))}
        </ul>
      </section>

      {/* FLEET */}
      <section className="bg-secondary py-20 md:py-28">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-primary">Nossa frota</p>
              <h2 className="mt-3 max-w-xl text-3xl font-black md:text-5xl">Escolha o carro certo para o seu caminho</h2>
            </div>
            <Button asChild variant="ink" size="lg" className="self-start md:self-auto">
              <Link to="/frota">Ver frota completa <ArrowRight /></Link>
            </Button>
          </div>
          {featured.length === 0 ? (
            <p className="mt-12 rounded-2xl border bg-card p-10 text-center text-muted-foreground">
              Em breve novos veículos por aqui. Fale com a gente pelo WhatsApp!
            </p>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((v) => <VehicleCard key={v.id} v={v} whatsapp={s.whatsapp} />)}
            </div>
          )}
        </div>
      </section>

      {/* PERKS */}
      <section className="bg-ink py-20 text-ink-foreground md:py-28">
        <div className="container-site">
          <p className="eyebrow text-accent">Diferenciais</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black md:text-5xl">Por que alugar com a Localider</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-ink-border bg-ink-border sm:grid-cols-2 lg:grid-cols-5">
            {PERKS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="group bg-ink p-7 transition-colors hover:bg-ink-soft">
                <div className={`grid size-12 place-items-center rounded-xl transition-transform group-hover:-translate-y-1 ${i === 4 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-20 md:py-28">
        <div className="container-site">
          <p className="eyebrow text-primary">Como funciona</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">Simples, do começo ao fim</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((st) => (
              <li key={st.n} className="relative border-t-4 border-primary pt-6">
                <span className="font-display text-6xl font-black text-accent [-webkit-text-stroke:1.5px_var(--foreground)]">{st.n}</span>
                <h3 className="mt-3 text-xl font-extrabold">{st.title}</h3>
                <p className="mt-2 text-muted-foreground">{st.text}</p>
              </li>
            ))}
          </ol>
          <Button asChild variant="whatsapp" size="lg" className="mt-12">
            <a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> Começar pelo WhatsApp</a>
          </Button>
        </div>
      </section>

      {/* INSPIRATIONAL */}
      <section className="relative isolate overflow-hidden text-ink-foreground">
        <img src={s.road_image || roadImg} alt="Estrada entre plantações no oeste da Bahia" loading="lazy" width={1920} height={1088} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-overlay-bottom" />
        <div className="container-site flex min-h-[70vh] flex-col justify-end py-16 md:py-24">
          <h2 className="max-w-3xl text-5xl font-black leading-none md:text-8xl">
            Mais liberdade <span className="text-accent">para você!</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg text-ink-foreground/85 md:text-xl">
            Do trabalho às viagens em família, conte com a Localider para acompanhar seus melhores caminhos.
          </p>
        </div>
      </section>

      {/* ABOUT */}
      <section id="sobre" className="py-20 md:py-28">
        <div className="container-site grid items-center gap-12 md:grid-cols-2">
          <div className="relative">
            <img src={s.about_image || aboutImg} alt="Atendimento Localider entregando a chave do carro" loading="lazy" width={1280} height={1280} className="aspect-square w-full rounded-3xl object-cover shadow-lift" />
            <div className="absolute -bottom-5 -right-3 hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-lift sm:block">
              <ShieldCheck className="size-8" />
              <p className="mt-2 font-display text-sm font-extrabold">Confiança em<br />cada quilômetro</p>
            </div>
          </div>
          <div>
            <p className="eyebrow text-primary">Sobre a Localider</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">{s.about_title}</h2>
            <div className="mt-6 space-y-4 text-lg text-muted-foreground">
              {s.about_text.split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contato" className="bg-secondary py-20 md:py-28">
        <div className="container-site">
          <p className="eyebrow text-primary">Unidades e contato</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">Venha nos visitar</h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[s.address_1, s.address_2].filter(Boolean).map((a, i) => (
              <article key={a} className="overflow-hidden rounded-2xl border bg-card shadow-card">
                <iframe title={`Mapa da unidade ${i + 1}`} src={mapsEmbed(a)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-52 w-full border-0" />
                <div className="p-6">
                  <p className="eyebrow text-primary">Unidade {i + 1}</p>
                  <p className="mt-2 flex gap-2 font-semibold"><MapPin className="mt-0.5 size-5 shrink-0 text-primary" />{a}</p>
                  <Button asChild variant="ink" className="mt-5 w-full">
                    <a href={mapsDirections(a)} target="_blank" rel="noopener noreferrer"><CarFront /> Como chegar</a>
                  </Button>
                </div>
              </article>
            ))}
            <article className="flex flex-col rounded-2xl bg-ink p-7 text-ink-foreground shadow-card">
              <h3 className="text-2xl font-black">Fale com a gente</h3>
              <ul className="mt-6 space-y-4">
                <li><a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-accent"><MessageCircle className="size-5 text-whatsapp" /><span><span className="block text-xs text-ink-muted">WhatsApp</span>{s.phone_primary}</span></a></li>
                {s.phone_secondary && <li><a href={telLink(s.phone_secondary)} className="flex items-center gap-3 hover:text-accent"><Phone className="size-5 text-accent" /><span><span className="block text-xs text-ink-muted">Contato secundário</span>{s.phone_secondary}</span></a></li>}
                {s.instagram && <li><a href={s.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-accent"><Instagram className="size-5 text-primary" /><span><span className="block text-xs text-ink-muted">Instagram</span>@localider_lem</span></a></li>}
              </ul>
              <Button asChild variant="whatsapp" size="lg" className="mt-auto pt-0">
                <a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> Chamar no WhatsApp</a>
              </Button>
            </article>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
