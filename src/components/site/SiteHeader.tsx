import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { settingsQuery } from "@/lib/public.functions";
import { GENERAL_MESSAGE, waLink } from "@/lib/site";

const NAV = [
  { label: "Início", to: "/", hash: undefined },
  { label: "Frota", to: "/frota", hash: undefined },
  { label: "Como funciona", to: "/", hash: "como-funciona" },
  { label: "Sobre", to: "/", hash: "sobre" },
  { label: "Contato", to: "/", hash: "contato" },
] as const;

export function SiteHeader() {
  const { data: s } = useSuspenseQuery(settingsQuery());
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-ink-border bg-ink/95 text-ink-foreground backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-4 md:h-20">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Localider — início">
          <img src={logo} alt="Localider Locadora de Veículos" width={563} height={220} className="h-10 w-auto md:h-12" />
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              hash={n.hash}
              className="text-sm font-semibold text-ink-muted transition-colors hover:text-accent"
              activeOptions={{ exact: true, includeHash: true }}
              activeProps={{ className: "text-ink-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="default" className="hidden sm:inline-flex">
            <a href={waLink(s.whatsapp, GENERAL_MESSAGE)} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Fale conosco
            </a>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghostLight" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-ink-border bg-ink text-ink-foreground">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <img src={logo} alt="Localider" className="mb-8 mt-2 h-12 w-auto self-start" />
              <nav className="flex flex-col gap-1" aria-label="Menu mobile">
                {NAV.map((n) => (
                  <Link
                    key={n.label}
                    to={n.to}
                    hash={n.hash}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 font-display text-xl font-bold transition-colors hover:bg-ink-soft hover:text-accent"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
              <Button asChild variant="whatsapp" size="lg" className="mt-8">
                <a href={waLink(s.whatsapp, GENERAL_MESSAGE)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> Chamar no WhatsApp
                </a>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
