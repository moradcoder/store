import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export function CartLines({ compact = false }: { compact?: boolean }) {
  const { items, setQuantity, remove } = useCart();
  const { t, pick, money } = useI18n();

  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.variantId} className="flex gap-3 py-4">
          <Link to="/product/$slug" params={{ slug: item.slug }} className="shrink-0">
            {item.image ? (
              <img
                src={item.image}
                alt={pick(item, "name")}
                className="h-24 w-20 rounded-md object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-24 w-20 rounded-md bg-secondary" />
            )}
          </Link>
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link to="/product/$slug" params={{ slug: item.slug }} className="text-sm font-medium">
                  {pick(item, "name")}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[pick(item, "color"), item.size].filter(Boolean).join(" • ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.variantId)}
                aria-label={t("remove")}
                className="text-muted-foreground transition hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-auto flex items-center justify-between pt-3">
              <div className="flex items-center rounded-md border">
                <button
                  type="button"
                  className="px-2 py-1.5 disabled:opacity-40"
                  onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label="-"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                <button
                  type="button"
                  className="px-2 py-1.5 disabled:opacity-40"
                  onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  aria-label="+"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="text-sm font-semibold">{money(item.price * item.quantity)}</span>
            </div>
            {!compact && item.quantity >= item.stock && (
              <p className="pt-1 text-[11px] text-accent">
                {item.stock} {t("remainingStock")}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EmptyCart({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <ShoppingBag className="h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{t("emptyCart")}</p>
      <Button asChild onClick={onNavigate}>
        <Link to="/shop">{t("continueShopping")}</Link>
      </Button>
    </div>
  );
}

export function CartDrawer() {
  const { open, setOpen, items, subtotal, clear } = useCart();
  const { t, money } = useI18n();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col p-6 sm:max-w-md">
        <SheetTitle className="font-display text-lg">{t("yourCart")}</SheetTitle>
        {items.length === 0 ? (
          <EmptyCart onNavigate={() => setOpen(false)} />
        ) : (
          <>
            <div className="-mx-1 flex-1 overflow-y-auto px-1">
              <CartLines compact />
            </div>
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>{t("subtotal")}</span>
                <span className="font-semibold">{money(subtotal)}</span>
              </div>
              <Button asChild className="w-full" onClick={() => setOpen(false)}>
                <Link to="/checkout">{t("checkout")}</Link>
              </Button>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  <Link to="/cart">{t("yourCart")}</Link>
                </Button>
                <Button variant="ghost" className="flex-1" onClick={clear}>
                  {t("clearCart")}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
