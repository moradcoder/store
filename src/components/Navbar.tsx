import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { fetchCategories, fetchSettings } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={cn("flex items-center gap-1 text-xs", className)}>
      <button
        type="button"
        onClick={() => setLang("ar")}
        className={cn("px-1.5 py-1 transition", lang === "ar" ? "font-semibold" : "opacity-60")}
        lang="ar"
      >
        العربية
      </button>
      <span aria-hidden className="opacity-40">
        |
      </span>
      <button
        type="button"
        onClick={() => setLang("fr")}
        className={cn("px-1.5 py-1 transition", lang === "fr" ? "font-semibold" : "opacity-60")}
        lang="fr"
      >
        Français
      </button>
    </div>
  );
}

export function Navbar() {
  const { t, pick } = useI18n();
  const { count, setOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  const storeName = (pick(settings ?? null, "name") || t("brand")) as string;
  const topCategories = categories.slice(0, 6);

  // ❌ Supprimer la fonction submitSearch
  // function submitSearch(e: React.FormEvent) {
  //   e.preventDefault();
  //   setMenuOpen(false);
  //   navigate({ to: "/shop", search: { q: term || undefined, page: 1 } });
  // }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="bg-primary py-2 text-center text-[11px] tracking-wide text-primary-foreground">
        {t("announcement")}
      </div>

      <div className="container-page flex h-16 items-center gap-3">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("menu")}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-6">
            <SheetTitle className="font-display text-lg">{storeName}</SheetTitle>
            
            {/* ❌ Supprimer le formulaire de recherche dans le menu mobile */}
            {/* <form onSubmit={submitSearch} className="mt-4">
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("search")}
              />
            </form> */}
            
            <nav className="mt-6 flex flex-col gap-1 text-sm">
              <Link to="/" onClick={() => setMenuOpen(false)} className="py-2">
                {t("home")}
              </Link>
              <Link to="/shop" onClick={() => setMenuOpen(false)} className="py-2">
                {t("shop")}
              </Link>
              {topCategories.map((c) => (
                <Link
                  key={c.id}
                  to="/shop"
                  search={{ cat: c.slug, page: 1 }}
                  onClick={() => setMenuOpen(false)}
                  className="py-2 ps-3 text-muted-foreground"
                >
                  {pick(c, "name")}
                </Link>
              ))}
              <Link to="/about" onClick={() => setMenuOpen(false)} className="py-2">
                {t("about")}
              </Link>
              <Link to="/contact" onClick={() => setMenuOpen(false)} className="py-2">
                {t("contact")}
              </Link>
              <Link to="/account" onClick={() => setMenuOpen(false)} className="py-2">
                {t("account")}
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="py-2">
                  {t("admin")}
                </Link>
              )}
            </nav>
            <LanguageSwitcher className="mt-6" />
          </SheetContent>
        </Sheet>

        <Link to="/" className="font-display text-xl tracking-wide">
          {storeName}
        </Link>

        <nav className="mx-auto hidden items-center gap-6 text-sm lg:flex">
          <Link to="/shop" className="transition hover:text-accent">
            {t("shop")}
          </Link>
          {topCategories.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ cat: c.slug, page: 1 }}
              className="transition hover:text-accent"
            >
              {pick(c, "name")}
            </Link>
          ))}
          <Link to="/about" className="transition hover:text-accent">
            {t("about")}
          </Link>
          <Link to="/contact" className="transition hover:text-accent">
            {t("contact")}
          </Link>
        </nav>

        <div className="ms-auto flex items-center gap-1">
          {/* ❌ Supprimer le formulaire de recherche Desktop */}
          {/* <form onSubmit={submitSearch} className="hidden items-center md:flex">
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("search")}
                className="h-9 w-44 ps-8 lg:w-56"
              />
            </div>
          </form> */}
          
          <LanguageSwitcher className="hidden md:flex" />
          <Button variant="ghost" size="icon" asChild aria-label={t("favorites")}>
            <Link to="/account" search={{ tab: "favorites" }}>
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label={t("account")}>
            <Link to={user ? "/account" : "/auth"}>
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label={t("cart")}
            className="relative"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}