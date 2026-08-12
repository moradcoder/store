import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { discountPercent, productImage, totalStock, type Product } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  favorite = false,
  className,
}: {
  product: Product;
  favorite?: boolean;
  className?: string;
}) {
  const { t, pick, money } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const image = productImage(product);
  const off = discountPercent(product);
  const stock = totalStock(product);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) {
      toast.error(t("login"));
      return;
    }
    if (favorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id });
    }
    qc.invalidateQueries({ queryKey: ["favorites"] });
  }

  return (
    <article className={cn("group", className)}>
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block focus-visible:outline-none"
        aria-label={pick(product, "name")}
      >
        <div className="relative overflow-hidden rounded-md bg-secondary">
          <div className="aspect-[3/4] w-full">
            {image ? (
              <img
                src={image}
                alt={pick(product, "name")}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {pick(product, "name")}
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute start-3 top-3 flex flex-col gap-1">
            {off > 0 && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                -{off}%
              </span>
            )}
            {product.is_new && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                {t("new")}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={t("favorites")}
            className="absolute end-3 top-3 rounded-full bg-card/85 p-2 text-foreground shadow-soft transition hover:bg-card"
          >
            <Heart className={cn("h-4 w-4", favorite && "fill-accent text-accent")} />
          </button>

          {stock === 0 && (
            <div className="absolute inset-x-0 bottom-0 bg-primary/85 py-2 text-center text-xs text-primary-foreground">
              {t("outOfStock")}
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <h3 className="text-sm font-medium leading-snug">{pick(product, "name")}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{money(product.price)}</span>
            {product.old_price && (
              <span className="text-xs text-muted-foreground line-through">
                {money(product.old_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({
  products,
  favoriteIds = [],
}: {
  products: Product[];
  favoriteIds?: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} favorite={favoriteIds.includes(p.id)} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-3">
          <div className="aspect-[3/4] w-full rounded-md bg-secondary" />
          <div className="h-3 w-3/4 rounded bg-secondary" />
          <div className="h-3 w-1/3 rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}
