import { Link } from "@tanstack/react-router";
import { Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import logo from "@/assets/logo.png";
import { settingsQuery } from "@/lib/public.functions";
import { GENERAL_MESSAGE, mapsDirections, telLink, waLink } from "@/lib/site";

export function SiteFooter() {
  const { data: s } = useSuspenseQuery(settingsQuery());
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="h-1 bg-primary" />
      <div className="container-site grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <img src={logo} alt="Localider Locadora de Veículos" loading="lazy" className="h-14 w-auto" />
          <p className="mt-4 text-sm text-ink-muted">
            Locadora de veículos em Luís Eduardo Magalhães – BA.
          </p>
          <p className="mt-4 inline-block rounded-md bg-accent px-3 py-1 font-display text-xs font-black tracking-wider text-accent-foreground">
            NÃO BLOQUEAMOS CARTÃO
          </p>
        </div>
        <div>
          <h3 className="eyebrow text-accent">Navegação</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            <li><Link to="/" className="hover:text-ink-foreground">Início</Link></li>
            <li><Link to="/frota" className="hover:text-ink-foreground">Nossa frota</Link></li>
            <li><Link to="/" hash="como-funciona" className="hover:text-ink-foreground">Como funciona</Link></li>
            <li><Link to="/" hash="sobre" className="hover:text-ink-foreground">Sobre</Link></li>
            <li><Link to="/" hash="contato" className="hover:text-ink-foreground">Contato</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow text-accent">Contato</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-muted">
            <li>
              <a href={waLink(s.whatsapp, GENERAL_MESSAGE)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ink-foreground">
                <MessageCircle className="size-4 text-whatsapp" /> {s.phone_primary} (WhatsApp)
              </a>
            </li>
            {s.phone_secondary && (
              <li>
                <a href={telLink(s.phone_secondary)} className="flex items-center gap-2 hover:text-ink-foreground">
                  <Phone className="size-4" /> {s.phone_secondary}
                </a>
              </li>
            )}
            {s.instagram && (
              <li>
                <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ink-foreground">
                  <Instagram className="size-4" /> @localider_lem
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow text-accent">Unidades</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-muted">
            {[s.address_1, s.address_2].filter(Boolean).map((a) => (
              <li key={a}>
                <a href={mapsDirections(a)} target="_blank" rel="noopener noreferrer" className="flex gap-2 hover:text-ink-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {a}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-border">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-ink-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Localider — Locadora de Veículos. Todos os direitos reservados.</p>
          <p>Luís Eduardo Magalhães – Bahia</p>
        </div>
      </div>
    </footer>
  );
}
