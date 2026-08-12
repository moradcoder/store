import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductGrid } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { statusKey, useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/queries";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Mon compte — Dar Elegance | حسابي" },
      { name: "description", content: "Gérez votre profil, vos commandes et vos favoris." },
      { property: "og:title", content: "Mon compte — Dar Elegance" },
      { property: "og:description", content: "Profil, commandes et favoris Dar Elegance." },
    ],
  }),
  component: Account,
});

function Account() {
  const { t, pick, money } = useI18n();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ full_name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name,phone,address")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setProfile({
            full_name: data.full_name ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
          });
      });
  }, [user]);

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,order_number,status,total,created_at,order_items(id,name_ar,name_fr,quantity)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorite-products", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select(
          "product_id, products(*, product_images(id,url,position), product_variants(id,product_id,color_id,size_id,stock))",
        );
      return ((data ?? []) as unknown as { products: Product | null }[])
        .map((r) => r.products)
        .filter((p): p is Product => Boolean(p));
    },
  });

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...profile }, { onConflict: "id" });
    setSaving(false);
    toast[error ? "error" : "success"](error ? t("error") : t("saved"));
  }

  if (!user) return <div className="container-page py-20 text-center">{t("loading")}</div>;

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl md:text-4xl">{t("account")}</h1>
        <Button variant="outline" onClick={() => signOut().then(() => navigate({ to: "/" }))}>
          {t("logout")}
        </Button>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">{t("myOrders")}</TabsTrigger>
          <TabsTrigger value="favorites">{t("favorites")}</TabsTrigger>
          <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6 space-y-4">
          {orders.length === 0 && <p className="text-sm text-muted-foreground">{t("noOrders")}</p>}
          {orders.map((o) => (
            <article key={o.id} className="rounded-lg border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                  {t(statusKey(o.status))}
                </span>
                <span className="font-semibold">{money(Number(o.total))}</span>
                <Button asChild size="sm" variant="outline">
                  <Link to="/order/$number" params={{ number: o.order_number }}>
                    {t("orderDetails")}
                  </Link>
                </Button>
              </div>
              <ul className="mt-3 text-xs text-muted-foreground">
                {(o.order_items ?? []).map((i) => (
                  <li key={i.id}>
                    {pick(i, "name")} × {i.quantity}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noFavorites")}</p>
          ) : (
            <ProductGrid products={favorites} favoriteIds={favorites.map((p) => p.id)} />
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <form onSubmit={saveProfile} className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">{t("fullName")}</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">{t("address")}</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                maxLength={300}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {t("save")}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
