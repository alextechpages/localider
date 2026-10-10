import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { getPublicClient } from "./public-client.server";
import {
  DEFAULT_SETTINGS,
  type PublicVehicle,
  type SiteSettings,
  type VehicleDetail,
} from "./site";

const LIST_COLUMNS =
  "id, slug, brand, model, year, transmission, passengers, air_conditioning, fuel, main_image_url, status, is_demo, category:categories(slug, name)";

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = getPublicClient();
  const { data, error } = await sb.from("site_settings").select("data").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  const stored = (data?.data ?? {}) as Partial<SiteSettings>;
  const merged = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(stored) as (keyof SiteSettings)[]) {
    if (typeof stored[k] === "string") merged[k] = stored[k] as string;
  }
  return merged;
});

export const listVehicles = createServerFn({ method: "GET" }).handler(async () => {
  const sb = getPublicClient();
  const { data, error } = await sb
    .from("vehicles")
    .select(LIST_COLUMNS)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicVehicle[];
});

export const getVehicle = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const sb = getPublicClient();
    const { data: row, error } = await sb
      .from("vehicles")
      .select(`${LIST_COLUMNS}, description, features, images:vehicle_images(id, url, sort_order)`)
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const v = row as unknown as VehicleDetail;
    v.images = [...(v.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    return v;
  });

export const settingsQuery = () =>
  queryOptions({ queryKey: ["settings"], queryFn: () => getSettings(), staleTime: 60_000 });

export const vehiclesQuery = () =>
  queryOptions({ queryKey: ["vehicles"], queryFn: () => listVehicles() });

export const vehicleQuery = (slug: string) =>
  queryOptions({ queryKey: ["vehicle", slug], queryFn: () => getVehicle({ data: { slug } }) });
