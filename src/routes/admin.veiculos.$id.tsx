import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { VehicleCard } from "@/components/site/VehicleCard";
import { deleteMedia, pathFromUrl, uploadMedia } from "@/lib/admin-media";
import { settingsQuery } from "@/lib/public.functions";
import { STATUS_LABEL, slugify } from "@/lib/site";

export const Route = createFileRoute("/admin/veiculos/$id")({
  component: VehicleEditor,
});

type Form = {
  brand: string; model: string; year: string; category_id: string; transmission: string;
  passengers: string; air_conditioning: boolean; fuel: string; description: string; features: string;
  status: string; is_published: boolean; main_image_url: string | null;
};
const EMPTY: Form = {
  brand: "", model: "", year: "", category_id: "", transmission: "manual", passengers: "5",
  air_conditioning: true, fuel: "", description: "", features: "", status: "disponivel",
  is_published: false, main_image_url: null,
};

const schema = z.object({
  brand: z.string().trim().min(1, "Informe a marca").max(60),
  model: z.string().trim().min(1, "Informe o modelo").max(80),
  year: z.string().trim().regex(/^(\d{4})?$/, "Ano inválido"),
  passengers: z.coerce.number().int().min(1).max(20),
  fuel: z.string().trim().max(40),
  description: z.string().trim().max(3000),
});

function VehicleEditor() {
  const { id } = Route.useParams();
  const isNew = id === "novo";
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: settings } = useSuspenseQuery(settingsQuery());
  const [f, setF] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await supabase.from("categories").select("id, slug, name").order("sort_order")).data ?? [],
  });

  const { data: existing } = useQuery({
    queryKey: ["admin", "vehicle", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: images = [], refetch: refetchImages } = useQuery({
    queryKey: ["admin", "images", id],
    enabled: !isNew,
    queryFn: async () => (await supabase.from("vehicle_images").select("*").eq("vehicle_id", id).order("sort_order")).data ?? [],
  });

  useEffect(() => {
    if (!existing) return;
    setSlug(existing.slug);
    setF({
      brand: existing.brand, model: existing.model, year: existing.year ? String(existing.year) : "",
      category_id: existing.category_id ?? "", transmission: existing.transmission,
      passengers: String(existing.passengers), air_conditioning: existing.air_conditioning,
      fuel: existing.fuel ?? "", description: existing.description, features: existing.features.join("\n"),
      status: existing.status, is_published: existing.is_published, main_image_url: existing.main_image_url,
    });
  }, [existing]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    if (slug) qc.invalidateQueries({ queryKey: ["vehicle", slug] });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const payload = {
      brand: parsed.data.brand, model: parsed.data.model,
      year: f.year ? Number(f.year) : null, category_id: f.category_id || null,
      transmission: f.transmission, passengers: parsed.data.passengers,
      air_conditioning: f.air_conditioning, fuel: parsed.data.fuel || null,
      description: parsed.data.description,
      features: f.features.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 30),
      status: f.status, is_published: f.is_published, main_image_url: f.main_image_url,
    };
    if (isNew) {
      const newSlug = `${slugify(`${payload.brand} ${payload.model} ${payload.year ?? ""}`)}-${Math.random().toString(36).slice(2, 6)}`;
      const { count } = await supabase.from("vehicles").select("id", { count: "exact", head: true });
      const { data, error } = await supabase.from("vehicles").insert({ ...payload, slug: newSlug, sort_order: (count ?? 0) + 1 }).select("id").single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Veículo criado! Agora adicione as fotos.");
      invalidate();
      navigate({ to: "/admin/veiculos/$id", params: { id: data.id }, replace: true });
    } else {
      const { error } = await supabase.from("vehicles").update({ ...payload, is_demo: false }).eq("id", id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Alterações salvas.");
      invalidate();
    }
  };

  const uploadMain = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadMedia(file, `vehicles/${id}`);
      const old = f.main_image_url;
      const { error } = await supabase.from("vehicles").update({ main_image_url: url }).eq("id", id);
      if (error) throw error;
      await deleteMedia([pathFromUrl(old)]);
      set("main_image_url", url);
      toast.success("Foto principal atualizada.");
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const uploadGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      let order = images.length;
      for (const file of Array.from(files)) {
        const { url, path } = await uploadMedia(file, `vehicles/${id}`);
        const { error } = await supabase.from("vehicle_images").insert({ vehicle_id: id, url, storage_path: path, sort_order: ++order });
        if (error) throw error;
      }
      toast.success("Fotos enviadas.");
      refetchImages();
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (img: { id: string; url: string; storage_path: string | null }) => {
    const { error } = await supabase.from("vehicle_images").delete().eq("id", img.id);
    if (error) return toast.error(error.message);
    await deleteMedia([img.storage_path ?? pathFromUrl(img.url)]);
    refetchImages();
    invalidate();
  };

  const cat = categories.find((c) => c.id === f.category_id);
  const previewVehicle = {
    id: "preview", slug: slug ?? "preview", brand: f.brand || "Marca", model: f.model || "Modelo",
    year: f.year ? Number(f.year) : null, transmission: f.transmission, passengers: Number(f.passengers) || 5,
    air_conditioning: f.air_conditioning, fuel: f.fuel || null, main_image_url: f.main_image_url,
    status: f.status, is_demo: false, category: cat ? { slug: cat.slug, name: cat.name } : null,
  };

  return (
    <div>
      <Link to="/admin/veiculos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Veículos
      </Link>
      <h1 className="mt-3 text-2xl font-black md:text-3xl">{isNew ? "Novo veículo" : "Editar veículo"}</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <form onSubmit={save} className="space-y-5 rounded-2xl border bg-card p-5 shadow-card md:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Marca *"><Input value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Ex.: Volkswagen" required /></Field>
              <Field label="Modelo *"><Input value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="Ex.: Polo" required /></Field>
              <Field label="Ano (opcional)"><Input value={f.year} onChange={(e) => set("year", e.target.value)} inputMode="numeric" maxLength={4} placeholder="2024" /></Field>
              <Field label="Categoria">
                <select value={f.category_id} onChange={(e) => set("category_id", e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">Selecione…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Transmissão">
                <select value={f.transmission} onChange={(e) => set("transmission", e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="manual">Manual</option><option value="automatica">Automática</option>
                </select>
              </Field>
              <Field label="Passageiros"><Input type="number" min={1} max={20} value={f.passengers} onChange={(e) => set("passengers", e.target.value)} /></Field>
              <Field label="Combustível (opcional)"><Input value={f.fuel} onChange={(e) => set("fuel", e.target.value)} placeholder="Flex, Diesel…" /></Field>
              <Field label="Disponibilidade">
                <select value={f.status} onChange={(e) => set("status", e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={f.air_conditioning} onCheckedChange={(c) => set("air_conditioning", c)} /> Ar-condicionado</label>
            <Field label="Descrição"><Textarea rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <Field label="Características (uma por linha)"><Textarea rows={4} value={f.features} onChange={(e) => set("features", e.target.value)} placeholder={"Direção elétrica\nMultimídia"} /></Field>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-secondary p-4">
              <label className="flex items-center gap-3 text-sm font-semibold">
                <Switch checked={f.is_published} onCheckedChange={(c) => set("is_published", c)} />
                {f.is_published ? "Publicado no site" : "Oculto (rascunho)"}
              </label>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} {isNew ? "Criar veículo" : "Salvar"}</Button>
            </div>
          </form>

          <section className="rounded-2xl border bg-card p-5 shadow-card md:p-6">
            <h2 className="font-extrabold">Fotos</h2>
            {isNew ? (
              <p className="mt-2 text-sm text-muted-foreground">Salve o veículo primeiro para enviar fotos.</p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="aspect-[4/3] w-48 overflow-hidden rounded-xl bg-secondary">
                    {f.main_image_url && <img src={f.main_image_url} alt="Foto principal" className="h-full w-full object-cover" />}
                  </div>
                  <FileButton label={f.main_image_url ? "Substituir foto principal" : "Enviar foto principal"} disabled={uploading} onFiles={(fl) => uploadMain(fl?.[0])} />
                </div>
                <h3 className="mt-6 text-sm font-bold">Galeria</h3>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {images.map((img) => (
                    <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-secondary">
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => removeImage(img)} aria-label="Excluir foto" className="absolute right-1 top-1 grid size-7 place-items-center rounded-md bg-destructive text-destructive-foreground opacity-90 hover:opacity-100">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4"><FileButton label="Adicionar fotos à galeria" multiple disabled={uploading} onFiles={uploadGallery} /></div>
                {uploading && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Enviando…</p>}
              </>
            )}
          </section>
        </div>
        <aside className="xl:sticky xl:top-8 xl:self-start">
          <p className="mb-3 text-sm font-bold text-muted-foreground">Pré-visualização</p>
          <VehicleCard v={previewVehicle} whatsapp={settings.whatsapp} preview />
          {!isNew && existing?.is_published && slug && (
            <Button asChild variant="link" className="mt-2 px-0"><a href={`/frota/${slug}`} target="_blank" rel="noopener noreferrer">Abrir página pública →</a></Button>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

export function FileButton({ label, multiple, disabled, onFiles }: { label: string; multiple?: boolean; disabled?: boolean; onFiles: (f: FileList | null) => void }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <ImagePlus className="size-4" /> {label}
      <input type="file" accept="image/*" multiple={multiple} className="sr-only" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
    </label>
  );
}
