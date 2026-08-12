import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyCart } from "@/components/Cart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { fetchZones } from "@/lib/queries";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Commander — Dar Elegance | إتمام الطلب" },
      {
        name: "description",
        content: "Finalisez votre commande avec paiement à la livraison partout au Maroc.",
      },
      { property: "og:title", content: "Commander — Dar Elegance" },
      { property: "og:description", content: "Paiement à la livraison partout au Maroc." },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  full_name: z.string().trim().min(3).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+212|0)[5-7]\d{8}$/, "phone"),
  email: z.union([z.string().trim().email().max(255), z.literal("")]),
  address: z.string().trim().min(6).max(300),
  region: z.string().trim().max(100),
  postal_code: z.string().trim().max(20),
  notes: z.string().trim().max(500),
});

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { t, pick, money } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: zones = [] } = useQuery({ queryKey: ["zones"], queryFn: () => fetchZones() });
  const [zoneId, setZoneId] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    region: "",
    postal_code: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name,phone,address,city")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm((f) => ({
          ...f,
          full_name: data.full_name ?? f.full_name,
          phone: data.phone ?? f.phone,
          address: data.address ?? f.address,
          email: user.email ?? f.email,
        }));
      });
  }, [user]);

  const zone = zones.find((z) => z.id === zoneId);
  const fee = zone ? Number(zone.fee) : 0;
  const total = Math.max(0, subtotal - discount) + fee;

  async function applyCoupon() {
    if (!coupon.trim()) return;
    const { data, error } = await supabase.rpc("preview_coupon", {
      _code: coupon.trim(),
      _subtotal: subtotal,
    });
    const res = data as { valid?: boolean; reason?: string; discount?: number } | null;
    if (error || !res?.valid) {
      setDiscount(0);
      const reason = res?.reason;
      toast.error(
        reason === "expired"
          ? t("couponExpired")
          : reason === "limit"
            ? t("couponLimit")
            : reason === "min_order"
              ? t("couponMinOrder")
              : t("couponInvalid"),
      );
      return;
    }
    setDiscount(Number(res.discount ?? 0));
    toast.success(t("couponApplied"));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!zoneId) {
      toast.error(t("selectCity"));
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      toast.error(
        issue?.path[0] === "phone"
          ? t("invalidPhone")
          : issue?.path[0] === "email"
            ? t("invalidEmail")
            : t("required"),
      );
      return;
    }

    setSubmitting(true);
    
    try {
      const { data, error } = await supabase.rpc("place_order", {
        _items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
        _customer: parsed.data,
        _zone_id: zoneId,
        _coupon: coupon.trim(),
      });

      if (error) {
        console.error("Erreur RPC:", error);
        toast.error(error.message.includes("OUT_OF_STOCK") ? t("outOfStock") : t("error"));
        setSubmitting(false);
        return;
      }

      // Vérifier si c'est une erreur retournée par la fonction
      if (data && typeof data === 'object' && 'error' in data) {
        console.error("Erreur fonction:", data);
        toast.error(data.error as string);
        setSubmitting(false);
        return;
      }

      // Vérifier que data existe
      if (!data || typeof data !== 'object') {
        toast.error("Erreur: réponse invalide");
        setSubmitting(false);
        return;
      }

      // Extraire le numéro de commande
      const order = data as { order_number?: string; id?: string };
      const orderNumber = order.order_number;
      
      if (!orderNumber) {
        console.error("Pas de numéro de commande:", data);
        toast.error("Erreur: numéro de commande manquant");
        setSubmitting(false);
        return;
      }

      // Vider le panier
      clear();
      setSubmitting(false);
      
      // Rediriger vers la page de confirmation
      navigate({ 
        to: "/order/$number", 
        params: { number: orderNumber } 
      });
      
    } catch (err) {
      console.error("Exception:", err);
      toast.error(t("error"));
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-10">
        <h1 className="font-display text-3xl">{t("checkout")}</h1>
        <EmptyCart />
      </div>
    );
  }

  const field = (
    key: keyof typeof form,
    label: string,
    opts?: { required?: boolean; type?: string },
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>
        {label}
        {opts?.required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={key}
        type={opts?.type ?? "text"}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        required={opts?.required ?? false}
      />
    </div>
  );

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl md:text-4xl">{t("checkout")}</h1>
      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("full_name", t("fullName"), { required: true })}
            {field("phone", t("phone"), { required: true, type: "tel" })}
          </div>
          {field("email", t("email"), { type: "email" })}
          <div className="space-y-1.5">
            <Label htmlFor="address">
              {t("address")}
              <span className="text-destructive"> *</span>
            </Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                {t("city")}
                <span className="text-destructive"> *</span>
              </Label>
              <Select value={zoneId} onValueChange={setZoneId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCity")} />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {pick(z, "name")} — {money(Number(z.fee))} ({pick(z, "eta")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field("postal_code", t("postalCode"))}
          </div>
          {field("region", t("region"))}
          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="rounded-md border bg-secondary/50 p-4">
            <p className="eyebrow">{t("paymentMethod")}</p>
            <p className="mt-2 text-sm font-medium">{t("cod")}</p>
          </div>
        </div>

        <aside className="h-fit space-y-4 rounded-lg border p-6">
          <h2 className="font-display text-lg">{t("orderSummary")}</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {pick(i, "name")} × {i.quantity}
                </span>
                <span>{money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2 border-t pt-4">
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder={t("coupon")}
              maxLength={30}
            />
            <Button type="button" variant="outline" onClick={applyCoupon}>
              {t("apply")}
            </Button>
          </div>

          <dl className="space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt>{t("subtotal")}</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-accent">
                <dt>{t("discount")}</dt>
                <dd>-{money(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>{t("deliveryFee")}</dt>
              <dd>{zone ? money(fee) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <dt>{t("total")}</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? t("loading") : t("placeOrder")}
          </Button>
        </aside>
      </form>
    </div>
  );
}