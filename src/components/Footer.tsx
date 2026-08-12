import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fetchCategories, fetchSettings } from "@/lib/queries";
import { LanguageSwitcher } from "@/components/Navbar";

export function NewsletterForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("invalidEmail"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("newsletter").insert({ email: email.trim().toLowerCase() });
    setBusy(false);
    if (error) {
      toast.error(error.code === "23505" ? t("alreadySubscribed") : t("error"));
      return;
    }
    setEmail("");
    toast.success(t("subscribed"));
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
        aria-label={t("emailPlaceholder")}
        required
      />
      <Button type="submit" disabled={busy}>
        {t("subscribe")}
      </Button>
    </form>
  );
}

export function Footer() {
  const { t, pick } = useI18n();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });

  const s = settings ?? {};
  const storeName = (pick(s, "name") || t("brand")) as string;

  return (
    <footer className="mt-24 border-t bg-secondary/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <p className="font-display text-lg">{storeName}</p>
          <p className="text-sm text-muted-foreground">{t("heroSubtitle")}</p>
          <LanguageSwitcher />
        </div>

        <nav className="space-y-2 text-sm" aria-label={t("shop")}>
          <p className="eyebrow">{t("shop")}</p>
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ cat: c.slug, page: 1 }}
              className="block text-muted-foreground transition hover:text-foreground"
            >
              {pick(c, "name")}
            </Link>
          ))}
        </nav>

        <nav className="space-y-2 text-sm" aria-label={t("about")}>
          <p className="eyebrow">{storeName}</p>
          <Link to="/about" className="block text-muted-foreground transition hover:text-foreground">
            {t("about")}
          </Link>
          <Link
            to="/contact"
            className="block text-muted-foreground transition hover:text-foreground"
          >
            {t("contact")}
          </Link>
          <Link
            to="/account"
            className="block text-muted-foreground transition hover:text-foreground"
          >
            {t("account")}
          </Link>
          <div className="space-y-1 pt-2 text-muted-foreground">
            {s["phone"] && (
              <a href={`tel:${s["phone"]}`} className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {s["phone"]}
              </a>
            )}
            {s["email"] && (
              <a href={`mailto:${s["email"]}`} className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {s["email"]}
              </a>
            )}
            {s["whatsapp"] && (
              <a
                href={`https://wa.me/${s["whatsapp"]}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </nav>

        <div className="space-y-3">
          <p className="eyebrow">{t("newsletter")}</p>
          <p className="text-sm text-muted-foreground">{t("newsletterText")}</p>
          <NewsletterForm />
          <div className="flex gap-3 pt-2">
            {s["instagram"] && (
              <a
                href={String(s["instagram"])}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {s["facebook"] && (
              <a href={String(s["facebook"])} target="_blank" rel="noreferrer" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {storeName} — {t("cod")} • MAD / د.م.
      </div>
    </footer>
  );
}
