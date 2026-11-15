import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatPrice, type Product } from "@/lib/products";
import { stockQueryOptions } from "@/lib/stock";
import { stockFor } from "@/lib/cart-logic";

export function ProductCard({ product }: { product: Product }) {
  const { data: stock } = useQuery(stockQueryOptions);
  const soldOut = stock !== undefined && product.sizes.every((s) => stockFor(stock, product.slug, s) === 0);
  return (
    <Link to="/produit/$slug" params={{ slug: product.slug }} className="group block">
      <div className="relative overflow-hidden rounded-sm bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={768}
          height={1024}
          className="aspect-[3/4] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {soldOut && (
          <span className="text-eyebrow absolute right-3 top-3 rounded-sm bg-foreground px-2.5 py-1 text-background">
            Épuisé
          </span>
        )}
        {product.isNew && (
          <span className="text-eyebrow absolute left-3 top-3 rounded-sm bg-background/90 px-2.5 py-1 text-foreground">
            Nouveau
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl">{product.name}</h3>
        <p className="text-sm font-medium">{formatPrice(product.price)}</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{product.fabric}</p>
    </Link>
  );
}
