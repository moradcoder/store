import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Minus, Plus, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ProductGrid } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import {
  discountPercent,
  fetchColors,
  fetchProductBySlug,
  fetchProducts,
  fetchReviews,
  fetchSizes,
  type Variant,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await fetchProductBySlug(params.slug);
    if (!product || !product.active) throw notFound();
    return product;
  },
  head: ({ loaderData }) => {
    const p = loaderData;
    const image = p?.product_images?.[0]?.url;
    return {
      meta: [
        { title: p ? `${p.name_fr} — Dar Elegance` : "Produit — Dar Elegance" },
        {
          name: "description",
          content: (p?.description_fr ?? "Article de la collection Dar Elegance.").slice(0, 155),
        },
        { property: "og:title", content: p?.name_fr ?? "Dar Elegance" },
        {
          property: "og:description",
          content: (p?.description_fr ?? "Article de la collection Dar Elegance.").slice(0, 155),
        },
        ...(image && image.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  component: ProductPage,
});

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div className="flex gap-0.5 text-accent" aria-label={`${value}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn(size, i < value ? "fill-current" : "opacity-30")} />
      ))}
    </div>
  );
}

// ============================================
// ✅ ReviewsBlock CORRIGÉ
// ============================================
function ReviewsBlock({ productId }: { productId: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  
  // ✅ États pour vérifier les conditions
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: reviews = [], refetch } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchReviews(productId),
  });

  // ✅ Vérifier si l'utilisateur peut évaluer le produit
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const checkReviewStatus = async () => {
      setIsLoading(true);
      try {
        // 1. Vérifier si l'utilisateur a acheté le produit
        const { data: purchased, error: purchaseError } = await supabase
          .rpc('has_purchased_product', {
            _user_id: user.id,
            _product_id: productId
          });

        if (purchaseError) {
          console.error("Erreur vérification achat:", purchaseError);
          setCanReview(false);
        } else {
          setCanReview(purchased || false);
        }

        // 2. Vérifier si l'utilisateur a déjà évalué le produit
        const { data: existing, error: reviewError } = await supabase
          .from("reviews")
          .select("id")
          .eq("product_id", productId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (reviewError) {
          console.error("Erreur vérification évaluation:", reviewError);
        } else {
          setHasReviewed(!!existing);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkReviewStatus();
  }, [user, productId]);

  // ✅ Fonction submit corrigée
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user) {
      toast.error(t("login"));
      return;
    }
    
    if (!canReview) {
      toast.error("يمكن للمشترين فقط تقييم هذا المنتج");
      return;
    }
    
    if (hasReviewed) {
      toast.error("لقد قمت بتقييم هذا المنتج بالفعل");
      return;
    }
    
    if (!comment.trim()) {
      toast.error("الرجاء كتابة تعليق");
      return;
    }
    
    setSending(true);
    
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      comment: comment.trim().slice(0, 1000),
      author_name: (name.trim() || user.email?.split("@")[0] || "Client").slice(0, 80),
    });
    
    setSending(false);
    
    if (error) {
      if (error.code === '23505') {
        toast.error("لقد قمت بتقييم هذا المنتج بالفعل");
        setHasReviewed(true);
      } else if (error.code === '42501' || error.message?.includes('permission')) {
        toast.error("يمكن للمشترين فقط تقييم هذا المنتج");
      } else {
        toast.error(t("error"));
        console.error("❌ Erreur d'évaluation:", error);
      }
      return;
    }
    
    setComment("");
    setHasReviewed(true);
    toast.success(t("reviewSent"));
    refetch();
  }

  // ✅ Déterminer ce qui doit être affiché
  const renderReviewForm = () => {
    if (!user) {
      return (
        <div className="rounded-lg border p-5 text-center">
          <p className="text-muted-foreground">🔒 {t("login")} لتقييم هذا المنتج</p>
          <Button asChild className="mt-3">
            <Link to="/auth">تسجيل الدخول</Link>
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="rounded-lg border p-5 text-center">
          <p className="text-muted-foreground">⏳ {t("loading")}</p>
        </div>
      );
    }

    if (!canReview) {
      return (
        <div className="rounded-lg border p-5 text-center">
          <p className="text-muted-foreground">🛒 {t("onlyBuyers")}</p>
        </div>
      );
    }

    if (hasReviewed) {
      return (
        <div className="rounded-lg border p-5 text-center">
          <p className="text-muted-foreground">✅ لقد قمت بتقييم هذا المنتج بالفعل</p>
        </div>
      );
    }

    return (
      <form onSubmit={submit} className="space-y-3 rounded-lg border p-5">
        <h3 className="font-medium">{t("writeReview")}</h3>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}`}
              onClick={() => setRating(i + 1)}
              className="text-accent"
            >
              <Star className={cn("h-6 w-6", i < rating ? "fill-current" : "opacity-30")} />
            </button>
          ))}
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("fullName")}
          maxLength={80}
        />
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("comment")}
          maxLength={1000}
          required
        />
        <Button type="submit" disabled={sending}>
          {sending ? t("loading") : t("send")}
        </Button>
      </form>
    );
  };

  return (
    <section className="border-t py-12">
      <h2 className="font-display text-2xl">{t("reviews")}</h2>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        {/* Liste des avis */}
        <div className="space-y-5">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noReviews")}</p>
          ) : (
            reviews.map((r) => (
              <article key={r.id} className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.author_name}</span>
                  <Stars value={r.rating} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </article>
            ))
          )}
        </div>

        {/* Formulaire d'avis */}
        {renderReviewForm()}
      </div>
    </section>
  );
}

// ============================================
// ✅ ProductPage
// ============================================
function ProductPage() {
  const product = Route.useLoaderData();
  const { t, pick, money } = useI18n();
  const { add, setOpen } = useCart();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: colors = [] } = useQuery({ queryKey: ["colors"], queryFn: fetchColors });
  const { data: sizes = [] } = useQuery({ queryKey: ["sizes"], queryFn: fetchSizes });
  const { data: related } = useQuery({
    queryKey: ["related", product.category_id, product.id],
    queryFn: () => fetchProducts({ categoryId: product.category_id ?? undefined, perPage: 4 }),
  });
  const { data: isFavorite = false } = useQuery({
    queryKey: ["favorite", product.id, user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("product_id", product.id)
        .maybeSingle();
      return Boolean(data);
    },
  });

  const images = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);
  const [activeImage, setActiveImage] = useState(0);
  const [colorId, setColorId] = useState<string | null>(null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const availableColors = useMemo(
    () =>
      colors.filter((c) =>
        product.product_variants.some((v: Variant) => v.color_id === c.id && v.stock > 0),
      ),
    [colors, product.product_variants],
  );
  const availableSizes = useMemo(
    () =>
      sizes.filter((s) =>
        product.product_variants.some(
          (v: Variant) => v.size_id === s.id && (!colorId || v.color_id === colorId) && v.stock > 0,
        ),
      ),
    [sizes, product.product_variants, colorId],
  );

  const variant = product.product_variants.find(
    (v: Variant) => v.color_id === colorId && v.size_id === sizeId,
  );
  const off = discountPercent(product);

  async function toggleFavorite() {
    if (!user) {
      toast.error(t("login"));
      return;
    }
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id });
    }
    qc.invalidateQueries({ queryKey: ["favorite", product.id] });
    qc.invalidateQueries({ queryKey: ["favorites"] });
  }

  function addToCart(buyNow = false) {
    if (!variant) {
      toast.error(t("chooseVariant"));
      return;
    }
    const color = colors.find((c) => c.id === colorId);
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name_ar: product.name_ar,
      name_fr: product.name_fr,
      color_ar: color?.name_ar ?? null,
      color_fr: color?.name_fr ?? null,
      size: sizes.find((s) => s.id === sizeId)?.label ?? null,
      price: Number(product.price),
      image: images[0]?.url ?? null,
      quantity: qty,
      stock: variant.stock,
    });
    toast.success(t("addedToCart"));
    if (buyNow) window.location.href = "/checkout";
    else setOpen(true);
  }

  return (
    <div className="container-page py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg bg-secondary">
            <img
              src={images[activeImage]?.url ?? images[0]?.url ?? ""}
              alt={pick(product, "name")}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "overflow-hidden rounded-md border-2",
                    i === activeImage ? "border-accent" : "border-transparent",
                  )}
                >
                  <img
                    src={img.url}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <p className="eyebrow">{product.sku}</p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl">{pick(product, "name")}</h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-semibold">{money(Number(product.price))}</span>
              {off > 0 && (
                <>
                  <span className="text-muted-foreground line-through">
                    {money(Number(product.old_price))}
                  </span>
                  <span className="badge-sale">-{off}%</span>
                </>
              )}
            </div>
          </div>

          <div>
            <p className="eyebrow mb-2">{t("selectColor")}</p>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={pick(c, "name")}
                  title={pick(c, "name")}
                  onClick={() => {
                    setColorId(c.id);
                    setSizeId(null);
                  }}
                  className={cn(
                    "h-9 w-9 rounded-full border-2 transition",
                    colorId === c.id ? "border-accent" : "border-border",
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow mb-2">{t("selectSize")}</p>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSizeId(s.id)}
                  className={cn(
                    "min-w-12 rounded-md border px-3 py-2 text-sm transition",
                    sizeId === s.id
                      ? "border-accent bg-accent text-accent-foreground"
                      : "hover:border-accent",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-md border">
              <button
                type="button"
                className="px-3 py-2 disabled:opacity-40"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="-"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-10 text-center">{qty}</span>
              <button
                type="button"
                className="px-3 py-2 disabled:opacity-40"
                onClick={() => setQty((q) => Math.min(variant?.stock ?? 99, q + 1))}
                disabled={Boolean(variant) && qty >= (variant?.stock ?? 1)}
                aria-label="+"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {variant && (
              <span className="text-sm text-muted-foreground">
                {variant.stock} {t("remainingStock")}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => addToCart()} className="flex-1">
              {t("addToCart")}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => addToCart(true)}>
              {t("buyNow")}
            </Button>
            <Button size="lg" variant="outline" onClick={toggleFavorite} aria-label={t("favorites")}>
              <Heart className={cn("h-5 w-5", isFavorite && "fill-current text-accent")} />
            </Button>
          </div>

          <div className="flex items-start gap-3 rounded-md bg-secondary/60 p-4 text-sm">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p>{t("deliveryInfo")}</p>
          </div>

          <div>
            <h2 className="eyebrow mb-2">{t("description")}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {pick(product, "description")}
            </p>
          </div>
        </div>
      </div>

      <ReviewsBlock productId={product.id} />

      {related && related.products.filter((p) => p.id !== product.id).length > 0 && (
        <section className="border-t py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl">{t("relatedProducts")}</h2>
            <Link to="/shop" search={{ page: 1 }} className="text-sm text-muted-foreground">
              {t("viewAll")}
            </Link>
          </div>
          <ProductGrid products={related.products.filter((p) => p.id !== product.id).slice(0, 4)} />
        </section>
      )}
    </div>
  );
}