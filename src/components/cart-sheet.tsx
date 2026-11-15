import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatPrice, getProduct } from "@/lib/products";
import { stockQueryOptions } from "@/lib/stock";
import { stockFor } from "@/lib/cart-logic";
import { createCheckout } from "@/lib/shop.functions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

export function CartSheet() {
  const { lines, isOpen, setOpen, setQty, subtotal, count } = useCart();
  const { data: stock, refetch } = useQuery({ ...stockQueryOptions, enabled: isOpen });
  const startCheckout = useServerFn(createCheckout);
  const [loading, setLoading] = useState(false);

  const overStock = stock !== undefined && lines.some((l) => l.qty > stockFor(stock, l.slug, l.size));

  async function checkout() {
    setLoading(true);
    try {
      const res = await startCheckout({ data: { lines, origin: window.location.origin } });
      if ("error" in res) {
        toast.error(res.error);
        void refetch();
        return;
      }
      // Stripe's payment page cannot open inside a frame (e.g. the editor preview).
      if (window.self !== window.top) window.open(res.url, "_blank", "noopener");
      else window.location.assign(res.url);
    } catch {
      toast.error("Le paiement n'a pas pu démarrer. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col bg-background p-0 sm:max-w-md">
        <div className="border-b border-border px-6 py-5">
          <SheetTitle className="font-display text-2xl">Votre panier</SheetTitle>
          <SheetDescription>
            {count === 0 ? "Votre panier est vide." : `${count} article${count > 1 ? "s" : ""}`}
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <p className="text-muted-foreground">Laissez-vous tenter par nos pièces en wax.</p>
              <Button asChild variant="ink" size="lg" onClick={() => setOpen(false)}>
                <Link to="/boutique" search={{ cat: undefined }}>Découvrir la boutique</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map((line) => {
                const product = getProduct(line.slug);
                if (!product) return null;
                const available = stock === undefined ? undefined : stockFor(stock, line.slug, line.size);
                const atMax = available !== undefined && line.qty >= available;
                return (
                  <li key={`${line.slug}-${line.size}`} className="flex gap-4 py-5">
                    <img src={product.image} alt={product.name} loading="lazy" width={768} height={1024} className="h-28 w-21 rounded-sm object-cover" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-lg leading-tight">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Taille : {line.size}</p>
                          {available === 0 && <p className="mt-1 text-xs text-destructive">Épuisé — retirez cet article</p>}
                          {available !== undefined && available > 0 && line.qty > available && (
                            <p className="mt-1 text-xs text-destructive">Plus que {available} en stock</p>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={`Retirer ${product.name}`}
                          onClick={() => setQty(line.slug, line.size, 0)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-sm border border-border">
                          <button type="button" aria-label="Diminuer" className="p-2 hover:text-primary" onClick={() => setQty(line.slug, line.size, line.qty - 1)}>
                            <Minus className="size-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{line.qty}</span>
                          <button
                            type="button"
                            aria-label="Augmenter"
                            disabled={atMax}
                            className="p-2 hover:text-primary disabled:opacity-30"
                            onClick={() => setQty(line.slug, line.size, line.qty + 1)}
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <p className="text-sm font-medium">{formatPrice(product.price * line.qty)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-border bg-card px-6 py-6">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Sous-total</span>
              <span className="font-display text-2xl">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Paiement sécurisé par carte via Stripe.</p>
            <Button variant="sun" size="xl" className="mt-5 w-full" disabled={loading || overStock} onClick={checkout}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              {overStock ? "Ajustez votre panier" : "Payer ma commande"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
