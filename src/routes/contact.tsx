import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Dar Elegance | اتصل بنا" },
      {
        name: "description",
        content: "Une question sur votre commande ou nos tailles ? Écrivez-nous, nous répondons vite.",
      },
      { property: "og:title", content: "Contact — Dar Elegance" },
      { property: "og:description", content: "Contactez l'équipe Dar Elegance." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(5).max(1000),
});

function Contact() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.path[0] === "email" ? t("invalidEmail") : t("required"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(t("error"));
      return;
    }
    setForm({ name: "", email: "", message: "" });
    toast.success(t("contactSent"));
  }

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="font-display text-3xl md:text-4xl">{t("contactTitle")}</h1>
        <form onSubmit={submit} className="space-y-4 rounded-lg border p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("fullName")}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              maxLength={1000}
              required
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? t("loading") : t("send")}
          </Button>
        </form>
      </div>
    </div>
  );
}
