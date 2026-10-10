export type SiteSettings = {
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  road_image: string;
  about_image: string;
  about_title: string;
  about_text: string;
  whatsapp: string;
  phone_primary: string;
  phone_secondary: string;
  instagram: string;
  address_1: string;
  address_2: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  hero_title: "Seu próximo destino começa aqui!",
  hero_subtitle:
    "Locação de veículos com praticidade, segurança e liberdade para você ir mais longe.",
  hero_image: "",
  road_image: "",
  about_image: "",
  about_title: "Uma locadora feita para quem vive Luís Eduardo Magalhães",
  about_text: "",
  whatsapp: "5577999840490",
  phone_primary: "(77) 99984-0490",
  phone_secondary: "(77) 99991-4748",
  instagram: "https://www.instagram.com/localider_lem/",
  address_1: "Av. JK, nº 1885, Centro, Luís Eduardo Magalhães – BA",
  address_2: "Av. JK, nº 2305, Centro, Luís Eduardo Magalhães – BA",
};

export const CATEGORY_FILTERS = [
  { slug: "todos", label: "Todos" },
  { slug: "economico", label: "Econômicos" },
  { slug: "hatch", label: "Hatches" },
  { slug: "seda", label: "Sedãs" },
  { slug: "suv", label: "SUVs" },
  { slug: "picape", label: "Picapes" },
  { slug: "utilitario", label: "Utilitários" },
] as const;

export const STATUS_LABEL: Record<string, string> = {
  disponivel: "Disponível",
  sob_consulta: "Sob consulta",
  indisponivel: "Indisponível",
};

export const TRANSMISSION_LABEL: Record<string, string> = {
  manual: "Manual",
  automatica: "Automática",
};

export type PublicVehicle = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number | null;
  transmission: string;
  passengers: number;
  air_conditioning: boolean;
  fuel: string | null;
  main_image_url: string | null;
  status: string;
  is_demo: boolean;
  category: { slug: string; name: string } | null;
};

export type VehicleDetail = PublicVehicle & {
  description: string;
  features: string[];
  images: { id: string; url: string; sort_order: number }[];
};

export function vehicleName(v: { brand: string; model: string }) {
  return `${v.brand} ${v.model}`.trim();
}

export function waLink(number: string, text?: string) {
  const digits = (number || DEFAULT_SETTINGS.whatsapp).replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function vehicleMessage(v: { brand: string; model: string }) {
  return `Olá! Vi o ${vehicleName(v)} no site da Localider e gostaria de saber mais sobre a locação.`;
}

export const GENERAL_MESSAGE =
  "Olá! Estou no site da Localider e gostaria de mais informações sobre a locação de veículos.";

export function telLink(phone: string) {
  return `tel:+55${phone.replace(/\D/g, "")}`;
}

export function mapsDirections(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function mapsEmbed(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const MEDIA_PREFIX = "/api/public/media/";
