import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import heroImg from "@/assets/hero.jpg";
import roadImg from "@/assets/road.jpg";
import aboutImg from "@/assets/about.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileButton } from "./admin.veiculos.$id";
import { deleteMedia, pathFromUrl, uploadMedia } from "@/lib/admin-media";
import { settingsQuery } from "@/lib/public.functions";
import type { SiteSettings } from "@/lib/site";

export const Route = createFileRoute("/admin/conteudo")({
  component: ContentAdmin,
});

const TEXT_FIELDS: { key: keyof SiteSettings; label: string; long?: boolean }[] = [
  { key: "hero_title", label: "Título principal" },
  { key: "hero_subtitle", label: "Subtítulo principal", long: true },
  { key: "about_title", label: "Título “Sobre”" },
  { key: "about_text", label: "Texto “Sobre” (parágrafos separados por linha em branco)", long: true },
  { key: "whatsapp", label: "WhatsApp (somente números, com 55 e DDD)" },
  { key: "phone_primary", label: "Telefone principal (exibição)" },
  { key: "phone_secondary", label: "Contato secundário" },
  { key: "instagram", label: "Link do Instagram" },
  { key: "address_1", label: "Endereço da unidade 1" },
  { key: "address_2", label: "Endereço da unidade 2" },
];

const IMAGES: { key: "hero_image" | "road_image" | "about_image"; label: string; fallback: string }[] = [
  { key: "hero_image", label: "Banner inicial", fallback: heroImg },
  { key: "road_image", label: "Seção “Mais liberdade”", fallback: roadImg },
  { key: "about_image", label: "Seção “Sobre”", fallback: aboutImg },
];

function ContentAdmin() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(settingsQuery());
  const [f, setF] = useState<SiteSettings>(data);
  const [busy, setBusy] = useState(false);

  const persist = async (next: SiteSettings) => {
    if (!/^\d{12,13}$/.test(next.whatsapp)) throw new Error("WhatsApp deve ter 12 ou 13 dígitos (ex.: 5577999840490).");
    if (next.instagram && !/^https:\/\//.test(next.instagram)) throw new Error("O link do Instagram deve começar com https://");
    const { error } = await supabase.from("site_settings").update({ data: next, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["settings"] });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await persist(f);
      toast.success("Conteúdo atualizado no site.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const changeImage = async (key: (typeof IMAGES)[number]["key"], file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadMedia(file, "site");
      const old = f[key];
      const next = { ...f, [key]: url };
      await persist(next);
      await deleteMedia([pathFromUrl(old)]);
      setF(next);
      toast.success("Imagem atualizada.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-black md:text-3xl">Conteúdo do site</h1>
      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-card md:p-6">
        <h2 className="font-extrabold">Imagens</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          {IMAGES.map((img) => (
            <div key={img.key}>
              <p className="text-sm font-semibold">{img.label}</p>
              <img src={f[img.key] || img.fallback} alt="" className="mt-2 aspect-video w-full rounded-xl object-cover" />
              <div className="mt-2"><FileButton label="Trocar imagem" disabled={busy} onFiles={(fl) => changeImage(img.key, fl?.[0])} /></div>
            </div>
          ))}
        </div>
      </section>
      <form onSubmit={save} className="mt-6 space-y-4 rounded-2xl border bg-card p-5 shadow-card md:p-6">
        <h2 className="font-extrabold">Textos e contatos</h2>
        {TEXT_FIELDS.map(({ key, label, long }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={key}>{label}</Label>
            {long ? (
              <Textarea id={key} rows={key === "about_text" ? 6 : 2} maxLength={3000} value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
            ) : (
              <Input id={key} maxLength={300} value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
            )}
          </div>
        ))}
        <Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Save />} Salvar alterações</Button>
      </form>
    </div>
  );
}
