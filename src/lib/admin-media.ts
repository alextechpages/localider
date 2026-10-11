import { supabase } from "@/integrations/supabase/client";
import { MEDIA_PREFIX } from "./site";

const MAX = 10 * 1024 * 1024;

export async function uploadMedia(file: File, folder: string) {
  if (!file.type.startsWith("image/")) throw new Error("Envie apenas arquivos de imagem.");
  if (file.size > MAX) throw new Error("Imagem muito grande (máx. 10 MB).");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);
  return { path, url: `${MEDIA_PREFIX}${path}` };
}

export function pathFromUrl(url: string | null | undefined) {
  return url && url.startsWith(MEDIA_PREFIX) ? url.slice(MEDIA_PREFIX.length) : null;
}

export async function deleteMedia(paths: (string | null | undefined)[]) {
  const list = paths.filter(Boolean) as string[];
  if (list.length) await supabase.storage.from("media").remove(list);
}
