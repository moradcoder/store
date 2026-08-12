import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CartLines, EmptyCart } from "@/components/Cart";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Panier — Dar Elegance | سلة التسوق" },
      { name: "description", content: "Vérifiez vos articles avant de commander chez Dar Elegance." },
      { property: "og:title", content: "Panier — Dar Elegance" },
      { property: "og:description", content: "Vérifiez vos articles avant de commander." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal } = useCart();
  const { t, money } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl md:text-4xl">{t("yourCart")}</h1>
      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
          <CartLines />
          <aside className="h-fit space-y-4 rounded-lg border p-6">
            <h2 className="font-display text-lg">{t("orderSummary")}</h2>
            <div className="flex justify-between text-sm">
              <span>{t("subtotal")}</span>
              <span className="font-medium">{money(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("deliveryInfo")}</p>
            <Button asChild className="w-full">
              <Link to="/checkout">{t("checkout")}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/shop" search={{ page: 1 }}>
                {t("continueShopping")}
              </Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
