import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteMedia, pathFromUrl } from "@/lib/admin-media";
import { STATUS_LABEL } from "@/lib/site";

export const Route = createFileRoute("/admin/veiculos/")({
  component: VehiclesAdmin,
});

type Row = {
  id: string; brand: string; model: string; year: number | null; status: string;
  is_published: boolean; is_demo: boolean; sort_order: number; main_image_url: string | null;
  category: { name: string } | null;
};

function VehiclesAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, brand, model, year, status, is_published, is_demo, sort_order, main_image_url, category:categories(name)")
        .order("sort_order").order("created_at");
      if (error) throw error;
      return data as unknown as Row[];
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Row> }) => {
      const { error } = await supabase.from("vehicles").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const move = async (i: number, dir: -1 | 1) => {
    const list = data ?? [];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const reordered = [...list];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    const results = await Promise.all(
      reordered.map((r, idx) => supabase.from("vehicles").update({ sort_order: idx + 1 }).eq("id", r.id)),
    );
    if (results.some((r) => r.error)) toast.error("Não foi possível reordenar.");
    refresh();
  };

  const remove = async (r: Row) => {
    const { data: imgs } = await supabase.from("vehicle_images").select("url, storage_path").eq("vehicle_id", r.id);
    const { error } = await supabase.from("vehicles").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    await deleteMedia([pathFromUrl(r.main_image_url), ...(imgs ?? []).map((i) => i.storage_path ?? pathFromUrl(i.url))]);
    toast.success("Veículo excluído.");
    refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black md:text-3xl">Veículos</h1>
        <Button asChild><Link to="/admin/veiculos/$id" params={{ id: "novo" }}><Plus /> Novo veículo</Link></Button>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-card">
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Carregando…</p>
        ) : !data?.length ? (
          <p className="p-8 text-center text-muted-foreground">Nenhum veículo cadastrado ainda.</p>
        ) : (
          <ul className="divide-y">
            {data.map((r, i) => (
              <li key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 p-3 sm:flex sm:gap-4 sm:p-4">
                <div className="flex flex-col">
                  <Button variant="ghost" size="icon" className="size-7" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                  <Button variant="ghost" size="icon" className="size-7" aria-label="Descer" disabled={i === data.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {r.main_image_url && <img src={r.main_image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{r.brand} {r.model} {r.year ?? ""}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.category?.name ?? "Sem categoria"}{r.is_demo && " · Demonstrativo"}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1">
                  <select
                    aria-label="Disponibilidade"
                    value={r.status}
                    onChange={(e) => update.mutate({ id: r.id, patch: { status: e.target.value } })}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                  >
                    {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={r.is_published} onCheckedChange={(c) => update.mutate({ id: r.id, patch: { is_published: c } })} />
                    {r.is_published ? "Publicado" : "Oculto"}
                  </label>
                  <Button asChild variant="outline" size="sm"><Link to="/admin/veiculos/$id" params={{ id: r.id }}><Pencil /> Editar</Link></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label="Excluir" className="text-destructive"><Trash2 /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {r.brand} {r.model}?</AlertDialogTitle>
                        <AlertDialogDescription>O veículo e todas as suas fotos serão removidos permanentemente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
