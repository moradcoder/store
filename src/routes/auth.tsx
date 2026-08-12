import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";

type Mode = "login" | "register" | "reset";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Dar Elegance | تسجيل الدخول" },
      {
        name: "description",
        content: "Connectez-vous ou créez votre compte Dar Elegance pour suivre vos commandes.",
      },
      { property: "og:title", content: "Connexion — Dar Elegance" },
      { property: "og:description", content: "Accédez à votre compte Dar Elegance." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailSchema.safeParse(email).success) {
      toast.error(t("invalidEmail"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success(t("resetLinkSent"));
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigate({ to: "/account" });
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        toast.success(t("resetLinkSent"));
        setMode("login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t("error"));
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/account" });
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-soft">
        <div className="text-center">
          <h1 className="font-display text-2xl">
            {mode === "login" ? t("login") : mode === "register" ? t("register") : t("resetPassword")}
          </h1>
        </div>

        <Button variant="outline" className="w-full" onClick={google} type="button">
          {t("signInWithGoogle")}
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> — <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {mode !== "reset" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy
              ? t("loading")
              : mode === "login"
                ? t("login")
                : mode === "register"
                  ? t("register")
                  : t("sendResetLink")}
          </Button>
        </form>

        <div className="space-y-2 text-center text-sm text-muted-foreground">
          {mode === "login" && (
            <>
              <button type="button" className="underline" onClick={() => setMode("reset")}>
                {t("forgotPassword")}
              </button>
              <p>
                {t("noAccount")}{" "}
                <button type="button" className="underline" onClick={() => setMode("register")}>
                  {t("register")}
                </button>
              </p>
            </>
          )}
          {mode !== "login" && (
            <p>
              {t("haveAccount")}{" "}
              <button type="button" className="underline" onClick={() => setMode("login")}>
                {t("login")}
              </button>
            </p>
          )}
          <Link to="/" className="block underline">
            {t("home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
