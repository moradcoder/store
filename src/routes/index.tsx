import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductCard";
import { NewsletterForm } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { fetchApprovedReviewsSample, fetchCategories, fetchProducts } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dar Elegance — Mode marocaine élégante | دار الأناقة" },
      {
        name: "description",
        content:
          "Vêtements modernes pour femme, homme et enfant. Livraison dans tout le Maroc, paiement à la livraison. أزياء عصرية مع الدفع عند الاستلام.",
      },
      { property: "og:title", content: "Dar Elegance — Mode marocaine élégante" },
      {
        property: "og:description",
        content: "Collections femme, homme et enfant. Livraison partout au Maroc, paiement à la livraison.",
      },
      {
        property: "og:image",
        content:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "twitter:image",
        content:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  }),
  component: Home,
});

type ShopLink = { cat?: string; promo?: boolean; nouveau?: boolean; best?: boolean };

function SectionHeader({ title, href }: { title: string; href?: ShopLink | undefined }) {

  const { t, dir } = useI18n();
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      <Link
        to="/shop"
        search={{ page: 1, ...(href ?? {}) }}
        className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-accent"
      >
        {t("viewAll")}
        {dir === "rtl" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      </Link>
    </div>
  );
}

function ProductSection({
  title,
  filter,
  link,
}: {
  title: string;
  filter: Parameters<typeof fetchProducts>[0];
  link?: ShopLink | undefined;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["home-products", title, filter],
    queryFn: () => fetchProducts({ perPage: 8, ...filter }),
  });

  return (
    <section className="container-page py-14">
      <SectionHeader title={title} href={link} />
      {isLoading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={data?.products ?? []} />}
    </section>
  );
}

function Home() {
  const { t, pick } = useI18n();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["home-reviews"],
    queryFn: fetchApprovedReviewsSample,
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-sand">
        <div className="container-page grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-rise space-y-6">
            <p className="eyebrow">Maroc • 2026</p>
            <h1 className="font-display text-4xl leading-tight md:text-6xl">{t("heroTitle")}</h1>
            <p className="max-w-md text-muted-foreground">{t("heroSubtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/shop" search={{ page: 1 }}>
                  {t("shopNow")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/shop" search={{ page: 1, nouveau: true }}>
                  {t("newArrivals")}
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
              alt={t("heroTitle")}
              className="aspect-[4/5] w-full rounded-lg object-cover shadow-lift"
            />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y bg-card">
        <div className="container-page grid gap-6 py-6 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-accent" />
            <span>{t("deliveryInfo").slice(0, 60)}</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span>{t("cod")}</span>
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-accent" />
            <span>7 jours / 7 أيام</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-14">
        <SectionHeader title={t("featuredCategories")} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.slice(0, 8).map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ cat: c.slug, page: 1 }}
              className="group relative overflow-hidden rounded-md"
            >
              <div className="aspect-[4/5] bg-secondary">
                {c.image_url && (
                  <img
                    src={c.image_url}
                    alt={pick(c, "name")}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </div>
              <span className="absolute inset-x-0 bottom-0 bg-primary/70 p-3 text-center text-sm text-primary-foreground">
                {pick(c, "name")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <ProductSection title={t("newArrivals")} filter={{ onlyNew: true }} link={{ nouveau: true }} />

      {/* Promo banner */}
      <section className="container-page py-6">
        <div className="grid items-center gap-6 overflow-hidden rounded-lg bg-primary p-8 text-primary-foreground md:grid-cols-2 md:p-12">
          <div className="space-y-4">
            <p className="eyebrow text-primary-foreground/70">{t("discounts")}</p>
            <h2 className="font-display text-3xl md:text-4xl">{t("promoTitle")}</h2>
            <p className="text-primary-foreground/80">{t("promoText")}</p>
            <Button asChild variant="secondary">
              <Link to="/shop" search={{ page: 1, promo: true }}>
                {t("shopNow")}
              </Link>
            </Button>
          </div>
          <img
            src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80"
            alt={t("promoTitle")}
            loading="lazy"
            className="hidden aspect-[16/10] w-full rounded-md object-cover md:block"
          />
        </div>
      </section>

      <ProductSection title={t("bestSellers")} filter={{ onlyBest: true, sort: "best" }} link={{ best: true }} />
      <ProductSection title={t("discounts")} filter={{ onlyDiscount: true }} link={{ promo: true }} />

      {/* Reviews */}
      <section className="bg-secondary/60 py-16">
        <div className="container-page">
          <h2 className="mb-8 text-center font-display text-3xl">{t("reviews")}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {(reviews.length > 0
              ? reviews
              : [
                  {
                    id: "s1",
                    rating: 5,
                    author_name: "Salma B.",
                    comment:
                      "Qualité au rendez-vous et livraison rapide à Casablanca. Je recommande vivement.",
                  },
                  {
                    id: "s2",
                    rating: 5,
                    author_name: "ياسين م.",
                    comment: "المنتج مطابق للصورة والخامة ممتازة، والتوصيل كان سريعاً إلى الرباط.",
                  },
                  {
                    id: "s3",
                    rating: 4,
                    author_name: "Nadia E.",
                    comment: "Robe magnifique, coupe parfaite. Le paiement à la livraison rassure.",
                  },
                ]
            ).map((r) => (
              <figure key={r.id} className="rounded-lg bg-card p-6 shadow-soft">
                <div className="flex gap-0.5 text-accent" aria-label={`${r.rating}/5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={i < r.rating ? "h-4 w-4 fill-current" : "h-4 w-4 opacity-30"}
                    />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm text-muted-foreground">{r.comment}</blockquote>
                <figcaption className="mt-4 text-sm font-medium">{r.author_name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container-page flex flex-col items-center gap-4 py-16 text-center">
        <h2 className="font-display text-3xl">{t("newsletter")}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{t("newsletterText")}</p>
        <NewsletterForm />
      </section>
    </>
  );
}
