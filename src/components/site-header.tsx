import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { label: "Boutique", to: "/boutique", search: { cat: undefined } },
  { label: "Femme", to: "/boutique", search: { cat: "femme" as const } },
  { label: "Homme", to: "/boutique", search: { cat: "homme" as const } },
] as const;

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = (
    <>
      {NAV.map((n) => (
        <Link
          key={n.label}
          to={n.to}
          search={n.search}
          onClick={() => setMenuOpen(false)}
          className="transition-colors hover:text-primary"
        >
          {n.label}
        </Link>
      ))}
      <Link to="/a-propos" onClick={() => setMenuOpen(false)} className="transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>
        Notre histoire
      </Link>
      <Link to="/contact" onClick={() => setMenuOpen(false)} className="transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>
        Contact
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="pattern-kente h-1.5 w-full" aria-hidden />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-3 md:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger aria-label="Ouvrir le menu" className="p-1">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="bg-background">
              <SheetTitle className="font-display text-2xl">Bintou</SheetTitle>
              <nav className="mt-8 flex flex-col gap-5 text-lg">{links}</nav>
            </SheetContent>
          </Sheet>
        </div>

        <Link to="/" className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Bintou<span className="text-primary">.</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">{links}</nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Ouvrir le panier (${count} article${count > 1 ? "s" : ""})`}
          className="relative p-1 transition-colors hover:text-primary"
        >
          <ShoppingBag className="size-5" />
          {count > 0 && (
            <span className="absolute -right-2 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
