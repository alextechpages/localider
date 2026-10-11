import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [v, c] = await Promise.all([
        supabase.from("vehicles").select("id, is_published, is_demo, category_id"),
        supabase.from("categories").select("id, name").order("sort_order"),
      ]);
      if (v.error) throw v.error;
      return { vehicles: v.data, categories: c.data ?? [] };
    },
  });

  const vs = data?.vehicles ?? [];
  const cards = [
    { label: "Total de veículos", value: vs.length },
    { label: "Publicados", value: vs.filter((v) => v.is_published).length },
    { label: "Ocultos", value: vs.filter((v) => !v.is_published).length },
    { label: "Demonstrativos", value: vs.filter((v) => v.is_demo).length },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black md:text-3xl">Painel</h1>
        <Button asChild><Link to="/admin/veiculos/$id" params={{ id: "novo" }}><Plus /> Novo veículo</Link></Button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-4xl font-black">{isLoading ? "–" : c.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="font-extrabold">Veículos por categoria</h2>
        <ul className="mt-4 space-y-3">
          {(data?.categories ?? []).map((cat) => {
            const n = vs.filter((v) => v.category_id === cat.id).length;
            const pct = vs.length ? (n / vs.length) * 100 : 0;
            return (
              <li key={cat.id}>
                <div className="flex justify-between text-sm"><span>{cat.name}</span><span className="font-bold">{n}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
              </li>
            );
          })}
        </ul>
      </div>
      {vs.some((v) => v.is_demo) && (
        <p className="mt-6 rounded-xl border border-accent bg-accent/20 p-4 text-sm">
          Existem veículos <strong>demonstrativos</strong> no catálogo. Exclua-os em “Veículos” antes de divulgar o site.
        </p>
      )}
    </div>
  );
}
