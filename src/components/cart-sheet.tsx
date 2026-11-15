import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatPrice, getProduct } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

export function CartSheet() {
  const { lines, isOpen, setOpen, setQty, subtotal, count } = useCart();

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
                return (
                  <li key={`${line.slug}-${line.size}`} className="flex gap-4 py-5">
                    <img src={product.image} alt={product.name} loading="lazy" width={768} height={1024} className="h-28 w-21 rounded-sm object-cover" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-lg leading-tight">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Taille : {line.size}</p>
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
                          <button type="button" aria-label="Augmenter" className="p-2 hover:text-primary" onClick={() => setQty(line.slug, line.size, line.qty + 1)}>
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
            <p className="mt-1 text-xs text-muted-foreground">Livraison calculée à l'étape suivante.</p>
            <Button
              variant="sun"
              size="xl"
              className="mt-5 w-full"
              onClick={() =>
                toast("Le paiement en ligne arrive très bientôt", {
                  description: "Votre panier est conservé sur cet appareil.",
                })
              }
            >
              Passer commande
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
