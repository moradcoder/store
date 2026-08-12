import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, fetchColors, fetchProducts, fetchSizes } from "@/lib/queries";
import { cn } from "@/lib/utils";

export type ShopSearch = {
  q?: string | undefined;
  cat?: string | undefined;
  sort?: "newest" | "price_asc" | "price_desc" | "best" | undefined;
  page: number;
  min?: number | undefined;
  max?: number | undefined;
  sizes?: string | undefined;
  colors?: string | undefined;
  stock?: boolean | undefined;
  promo?: boolean | undefined;
  nouveau?: boolean | undefined;
  best?: boolean | undefined;
};

const PER_PAGE = 12;

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
    cat: typeof search["cat"] === "string" && search["cat"] ? search["cat"] : undefined,
    sort: (["newest", "price_asc", "price_desc", "best"] as const).includes(
      search["sort"] as never,
    )
      ? (search["sort"] as ShopSearch["sort"])
      : undefined,
    page: Number(search["page"]) > 0 ? Number(search["page"]) : 1,
    min: Number(search["min"]) > 0 ? Number(search["min"]) : undefined,
    max: Number(search["max"]) > 0 ? Number(search["max"]) : undefined,
    sizes: typeof search["sizes"] === "string" && search["sizes"] ? search["sizes"] : undefined,
    colors: typeof search["colors"] === "string" && search["colors"] ? search["colors"] : undefined,
    stock: search["stock"] === true || search["stock"] === "true" ? true : undefined,
    promo: search["promo"] === true || search["promo"] === "true" ? true : undefined,
    nouveau: search["nouveau"] === true || search["nouveau"] === "true" ? true : undefined,
    best: search["best"] === true || search["best"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Boutique_morad — Dar Elegance | المتجر" },
      {
        name: "description",
        content:
          "Découvrez toute la collection : t-shirts, chemises, jeans, robes, vestes et accessoires. Filtres par taille, couleur et prix.",
      },
      { property: "og:title", content: "Boutique — Dar Elegance" },
      {
        property: "og:description",
        content: "Toute la collection Dar Elegance, livrée partout au Maroc.",
      },
    ],
  }),
  component: Shop,
});

function Filters({ onDone }: { onDone?: () => void }) {
  const { t, pick } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });
  const { data: colors = [] } = useQuery({ queryKey: ["colors"], queryFn: fetchColors });
  const { data: sizes = [] } = useQuery({ queryKey: ["sizes"], queryFn: fetchSizes });

  const selectedSizes = (search.sizes ?? "").split(",").filter(Boolean);
  const selectedColors = (search.colors ?? "").split(",").filter(Boolean);

  function update(patch: Partial<ShopSearch>) {
    navigate({ search: (prev: ShopSearch) => ({ ...prev, ...patch, page: 1 }) });
  }

  function toggleList(key: "sizes" | "colors", id: string) {
    const current = (search[key] ?? "").split(",").filter(Boolean);
    const next = current.includes(id) ? current.filter((x: string) => x !== id) : [...current, id];
    update({ [key]: next.length ? next.join(",") : undefined } as Partial<ShopSearch>);
  }

  return (
    <div className="space-y-7 text-sm">
      <div>
        <p className="eyebrow mb-3">{t("category")}</p>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => update({ cat: undefined })}
            className={cn("block", !search.cat ? "font-semibold text-accent" : "text-muted-foreground")}
          >
            {t("viewAll")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => update({ cat: c.slug })}
              className={cn(
                "block",
                search.cat === c.slug ? "font-semibold text-accent" : "text-muted-foreground",
              )}
            >
              {pick(c, "name")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">{t("price")} (MAD)</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            aria-label="min"
            defaultValue={search.min ?? ""}
            onBlur={(e) => update({ min: e.target.value ? Number(e.target.value) : undefined })}
            className="h-9"
          />
          <span>—</span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="2000"
            aria-label="max"
            defaultValue={search.max ?? ""}
            onBlur={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })}
            className="h-9"
          />
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">{t("size")}</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleList("sizes", s.id)}
              className={cn(
                "min-w-10 rounded-md border px-2.5 py-1.5 text-xs transition",
                selectedSizes.includes(s.id)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "hover:border-accent",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">{t("color")}</p>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleList("colors", c.id)}
              title={pick(c, "name")}
              aria-label={pick(c, "name")}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition",
                selectedColors.includes(c.id) ? "border-accent" : "border-border",
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="eyebrow mb-3">{t("availability")}</p>
        {(
          [
            ["stock", t("inStock")],
            ["promo", t("onlyDiscounts")],
            ["nouveau", t("onlyNew")],
            ["best", t("onlyBest")],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <Checkbox
              checked={Boolean(search[key])}
              onCheckedChange={(v) =>
                update({ [key]: v ? true : undefined } as Partial<ShopSearch>)
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate({ search: { page: 1 } })}
        >
          <X className="h-4 w-4" /> {t("clearFilters")}
        </Button>
        {onDone && (
          <Button className="flex-1" onClick={onDone}>
            {t("apply")}
          </Button>
        )}
      </div>
    </div>
  );
}

function Shop() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { user } = useAuth();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });
  const categoryId = useMemo(
    () => categories.find((c) => c.slug === search.cat)?.id,
    [categories, search.cat],
  );

  const filters = {
    search: search.q,
    categoryId,
    minPrice: search.min,
    maxPrice: search.max,
    sizeIds: (search.sizes ?? "").split(",").filter(Boolean),
    colorIds: (search.colors ?? "").split(",").filter(Boolean),
    inStock: search.stock,
    onlyDiscount: search.promo,
    onlyNew: search.nouveau,
    onlyBest: search.best,
    sort: search.sort ?? "newest",
    page: search.page,
    perPage: PER_PAGE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["shop", filters, search.cat, categories.length],
    queryFn: () => fetchProducts(filters),
    enabled: !search.cat || categories.length > 0,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows } = await supabase.from("favorites").select("product_id");
      return (rows ?? []).map((r) => r.product_id);
    },
  });

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl">{t("shop")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {t("results")}
        </p>
      </header>

      <div className="mb-6 flex items-center justify-between gap-3">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> {t("filters")}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-6">
            <SheetTitle className="mb-4 font-display">{t("filters")}</SheetTitle>
            <Filters onDone={() => setFiltersOpen(false)} />
          </SheetContent>
        </Sheet>

        <Select
          value={search.sort ?? "newest"}
          onValueChange={(v) =>
            navigate({ search: (prev: ShopSearch) => ({ ...prev, sort: v as ShopSearch["sort"], page: 1 }) })
          }
        >
          <SelectTrigger className="ms-auto w-56" aria-label={t("sortBy")}>
            <SelectValue placeholder={t("sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("newest")}</SelectItem>
            <SelectItem value="price_asc">{t("priceAsc")}</SelectItem>
            <SelectItem value="price_desc">{t("priceDesc")}</SelectItem>
            <SelectItem value="best">{t("bestSelling")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <Filters />
        </aside>

        <div>
          {isLoading ? (
            <ProductGridSkeleton />
          ) : data && data.products.length > 0 ? (
            <>
              <ProductGrid products={data.products} favoriteIds={favorites} />
              {pages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-2" aria-label="pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={search.page <= 1}
                    onClick={() =>
                      navigate({ search: (prev: ShopSearch) => ({ ...prev, page: prev.page - 1 }) })
                    }
                  >
                    {t("previous")}
                  </Button>
                  <span className="px-3 text-sm">
                    {search.page} / {pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={search.page >= pages}
                    onClick={() =>
                      navigate({ search: (prev: ShopSearch) => ({ ...prev, page: prev.page + 1 }) })
                    }
                  >
                    {t("next")}
                  </Button>
                </nav>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed py-24 text-center text-sm text-muted-foreground">
              <Label>{t("noResults")}</Label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
