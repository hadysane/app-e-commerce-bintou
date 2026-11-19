import type { Tables } from "@/integrations/supabase/types";

export type Category = "femme" | "homme" | "accessoires";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "accessoires", label: "Accessoires" },
];

export type Product = {
  slug: string;
  name: string;
  category: Category;
  price: number; // euros
  fabric: string;
  short: string;
  description: string;
  image: string | null;
  sizes: string[];
  isNew: boolean;
  active: boolean;
};

export type ProductRow = Tables<"products">;

export const PRODUCT_IMAGES_BUCKET = "product-images";

export function productImageUrl(path: string | null): string | null {
  if (!path) return null;
  const base = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)?.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${encodeURIComponent(path)}`;
}

export function toProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category as Category,
    price: row.price_cents / 100,
    fabric: row.fabric,
    short: row.short,
    description: row.description,
    image: productImageUrl(row.image_path),
    sizes: row.sizes,
    isNew: row.is_new,
    active: row.active,
  };
}

export function findProduct(products: Product[] | undefined, slug: string): Product | undefined {
  return products?.find((p) => p.slug === slug);
}

export function formatPrice(euros: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(euros);
}

/** "Robe Awa été" → "robe-awa-ete" */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
