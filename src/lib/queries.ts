import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  name_ar: string;
  name_fr: string;
  image_url: string | null;
  active: boolean;
  position: number;
};

export type Color = { id: string; name_ar: string; name_fr: string; hex: string };
export type Size = { id: string; label: string; position: number };

export type Variant = {
  id: string;
  product_id: string;
  color_id: string | null;
  size_id: string | null;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name_ar: string;
  name_fr: string;
  description_ar: string | null;
  description_fr: string | null;
  price: number;
  old_price: number | null;
  category_id: string | null;
  featured: boolean;
  is_new: boolean;
  best_seller: boolean;
  active: boolean;
  sales_count: number;
  created_at: string;
  product_images: { id: string; url: string; position: number }[];
  product_variants: Variant[];
};

export type DeliveryZone = {
  id: string;
  name_ar: string;
  name_fr: string;
  fee: number;
  eta_ar: string;
  eta_fr: string;
  active: boolean;
};

export type StoreSettings = Record<string, string | number>;

const PRODUCT_SELECT =
  "*, product_images(id,url,position), product_variants(id,product_id,color_id,size_id,stock)";

export type ProductFilters = {
  search?: string | undefined;
  categoryId?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  sizeIds?: string[] | undefined;
  colorIds?: string[] | undefined;
  inStock?: boolean | undefined;
  onlyDiscount?: boolean | undefined;
  onlyNew?: boolean | undefined;
  onlyBest?: boolean | undefined;
  sort?: "newest" | "price_asc" | "price_desc" | "best" | undefined;
  page?: number | undefined;
  perPage?: number | undefined;
  includeInactive?: boolean | undefined;
};

export async function fetchProducts(f: ProductFilters = {}) {
  const page = f.page ?? 1;
  const perPage = f.perPage ?? 12;

  let restrictIds: string[] | null = null;
  if (f.sizeIds?.length || f.colorIds?.length || f.inStock) {
    let vq = supabase.from("product_variants").select("product_id");
    if (f.sizeIds?.length) vq = vq.in("size_id", f.sizeIds);
    if (f.colorIds?.length) vq = vq.in("color_id", f.colorIds);
    if (f.inStock) vq = vq.gt("stock", 0);
    const { data } = await vq;
    restrictIds = Array.from(new Set((data ?? []).map((v) => v.product_id)));
    if (restrictIds.length === 0) return { products: [] as Product[], total: 0 };
  }

  let q = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" });
  if (!f.includeInactive) q = q.eq("active", true);
  if (f.categoryId) q = q.eq("category_id", f.categoryId);
  if (f.search) q = q.or(`name_ar.ilike.%${f.search}%,name_fr.ilike.%${f.search}%`);
  if (f.minPrice != null) q = q.gte("price", f.minPrice);
  if (f.maxPrice != null) q = q.lte("price", f.maxPrice);
  if (f.onlyDiscount) q = q.not("old_price", "is", null);
  if (f.onlyNew) q = q.eq("is_new", true);
  if (f.onlyBest) q = q.eq("best_seller", true);
  if (restrictIds) q = q.in("id", restrictIds);

  if (f.sort === "price_asc") q = q.order("price", { ascending: true });
  else if (f.sort === "price_desc") q = q.order("price", { ascending: false });
  else if (f.sort === "best") q = q.order("sales_count", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  q = q.range((page - 1) * perPage, page * perPage - 1);

  const { data, error, count } = await q;
  if (error) throw error;
  return { products: (data ?? []) as unknown as Product[], total: count ?? 0 };
}

export async function fetchProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Product) ?? null;
}

export async function fetchCategories(includeInactive = false) {
  let q = supabase.from("categories").select("*").order("position");
  if (!includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchColors() {
  const { data, error } = await supabase.from("colors").select("*").order("name_fr");
  if (error) throw error;
  return (data ?? []) as Color[];
}

export async function fetchSizes() {
  const { data, error } = await supabase.from("sizes").select("*").order("position");
  if (error) throw error;
  return (data ?? []) as Size[];
}

export async function fetchZones(includeInactive = false) {
  let q = supabase.from("delivery_zones").select("*").order("name_fr");
  if (!includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DeliveryZone[];
}

export async function fetchSettings(): Promise<StoreSettings> {
  const { data } = await supabase.from("settings").select("value").eq("key", "store").maybeSingle();
  return (data?.value ?? {}) as StoreSettings;
}

export async function fetchReviews(productId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id,rating,comment,author_name,created_at,approved,user_id")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchApprovedReviewsSample() {
  const { data } = await supabase
    .from("reviews")
    .select("id,rating,comment,author_name,created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

export function productImage(p: Pick<Product, "product_images">, index = 0) {
  const sorted = [...(p.product_images ?? [])].sort((a, b) => a.position - b.position);
  return sorted[index]?.url ?? sorted[0]?.url ?? null;
}

export function discountPercent(p: Pick<Product, "price" | "old_price">) {
  if (!p.old_price || Number(p.old_price) <= Number(p.price)) return 0;
  return Math.round((1 - Number(p.price) / Number(p.old_price)) * 100);
}

export function totalStock(p: Pick<Product, "product_variants">) {
  return (p.product_variants ?? []).reduce((s, v) => s + v.stock, 0);
}
