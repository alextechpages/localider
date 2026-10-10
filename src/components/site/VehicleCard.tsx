import { Link } from "@tanstack/react-router";
import { Fuel, MessageCircle, Settings2, Snowflake, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  STATUS_LABEL,
  TRANSMISSION_LABEL,
  type PublicVehicle,
  vehicleMessage,
  vehicleName,
  waLink,
} from "@/lib/site";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone =
    status === "disponivel"
      ? "bg-success text-primary-foreground"
      : status === "sob_consulta"
        ? "bg-accent text-accent-foreground"
        : "bg-muted-foreground text-primary-foreground";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", tone, className)}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function VehicleCard({
  v,
  whatsapp,
  preview = false,
}: {
  v: PublicVehicle;
  whatsapp: string;
  preview?: boolean;
}) {
  const name = vehicleName(v);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {v.main_image_url ? (
          <img
            src={v.main_image_url}
            alt={`${name}${v.year ? ` ${v.year}` : ""} — locação Localider`}
            loading="lazy"
            decoding="async"
            width={1280}
            height={864}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Sem foto</div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {v.category && (
            <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-foreground">
              {v.category.name}
            </span>
          )}
          {v.is_demo && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
              Exemplo demonstrativo
            </span>
          )}
        </div>
        <StatusBadge status={v.status} className="absolute right-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow text-primary">{v.brand}</p>
        <h3 className="mt-1 text-xl font-extrabold leading-tight">
          {v.model} {v.year && <span className="font-semibold text-muted-foreground">{v.year}</span>}
        </h3>
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5"><Settings2 className="size-4 text-foreground" />{TRANSMISSION_LABEL[v.transmission]}</li>
          <li className="flex items-center gap-1.5"><Users className="size-4 text-foreground" />{v.passengers} lugares</li>
          {v.air_conditioning && <li className="flex items-center gap-1.5"><Snowflake className="size-4 text-foreground" />Ar-condicionado</li>}
          {v.fuel && <li className="flex items-center gap-1.5"><Fuel className="size-4 text-foreground" />{v.fuel}</li>}
        </ul>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Button asChild variant="whatsapp">
            <a href={waLink(whatsapp, vehicleMessage(v))} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Tenho interesse
            </a>
          </Button>
          {preview ? (
            <Button variant="outline" disabled>Ver detalhes</Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/frota/$slug" params={{ slug: v.slug }}>Ver detalhes</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
