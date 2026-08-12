import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, statusKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/order/$number")({
  head: () => ({
    meta: [
      { title: "Confirmation de commande — Dar Elegance | تأكيد الطلب" },
      { name: "description", content: "Votre commande a été confirmée avec succès." },
      { property: "og:title", content: "Confirmation de commande — Dar Elegance" },
      { property: "og:description", content: "Votre commande a été confirmée avec succès." },
    ],
  }),
  component: OrderPage,
});

type OrderItem = {
  id: string;
  name_ar: string;
  name_fr: string;
  color_ar: string | null;
  color_fr: string | null;
  size_label: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  region: string | null;
  postal_code: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  tracking_number: string | null;
  order_items: OrderItem[];
};

function OrderPage() {
  const { number } = Route.useParams();
  const { t, pick, money } = useI18n();
  const { user } = useAuth();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", number],
    queryFn: async () => {
      // Récupérer la commande avec ses articles
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("order_number", number)
        .maybeSingle();

      if (error) throw error;
      
      // Si la commande n'existe pas
      if (!data) return null;
      
      // Si l'utilisateur est connecté, vérifier que c'est sa commande
      if (user && data.user_id && data.user_id !== user.id) {
        throw new Error("Vous n'êtes pas autorisé à voir cette commande");
      }
      
      return data as Order;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container-page py-20 text-center">
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-2xl text-destructive">
            {t("orderNotFound") || "Commande introuvable"}
          </h1>
          <p className="mt-4 text-muted-foreground">
            Nous n'avons pas trouvé votre commande. Vérifiez le numéro ou contactez-nous.
          </p>
          <Button asChild className="mt-6">
            <Link to="/shop">{t("continueShopping")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border p-6 text-center">
          {/* Icône de succès */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="font-display text-2xl">
            {t("orderConfirmed") || "Commande confirmée !"}
          </h1>
          
          <p className="mt-2 text-muted-foreground">
            {t("orderConfirmText") || "Votre commande a été enregistrée avec succès. Nous vous contacterons bientôt."}
          </p>

          {/* Numéro de commande */}
          <div className="mt-4 rounded-lg bg-secondary/50 p-4">
            <p className="text-sm text-muted-foreground">{t("orderNumber")}</p>
            <p className="font-mono text-lg font-bold">{order.order_number}</p>
          </div>

          {/* Statut */}
          <div className="mt-4">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              {t(statusKey(order.status)) || order.status}
            </span>
          </div>

          {/* Détails de la commande */}
          <div className="mt-6 text-left">
            <h2 className="font-display text-lg">{t("orderSummary")}</h2>
            
            {/* Articles */}
            <div className="mt-3 space-y-2">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b py-2">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt=""
                      className="h-12 w-10 rounded object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{pick(item, "name")}</p>
                    <p className="text-xs text-muted-foreground">
                      {[pick(item, "color"), item.size_label].filter(Boolean).join(" • ")} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {money(Number(item.unit_price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt>{t("subtotal")}</dt>
                <dd>{money(Number(order.subtotal))}</dd>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <dt>{t("discount")}</dt>
                  <dd>-{money(Number(order.discount))}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>{t("deliveryFee")}</dt>
                <dd>{money(Number(order.delivery_fee))}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <dt>{t("total")}</dt>
                <dd>{money(Number(order.total))}</dd>
              </div>
            </dl>
          </div>

          {/* Informations de livraison */}
          <div className="mt-6 rounded-lg bg-secondary/30 p-4 text-left text-sm">
            <p className="font-medium">{t("deliveryInfo")}</p>
            <p className="mt-1 text-muted-foreground">
              {order.full_name}<br />
              {order.address}<br />
              {order.city} {order.postal_code}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t("phone")}: {order.phone}
            </p>
          </div>

          {/* Boutons */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/shop">{t("continueShopping")}</Link>
            </Button>
            {user && (
              <Button asChild className="flex-1">
                <Link to="/account">{t("myAccount")}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}