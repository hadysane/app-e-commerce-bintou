import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Truck, Scissors, RefreshCw } from "lucide-react";
import { CATEGORIES, PRODUCTS, formatPrice, getProduct } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produit/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Article introuvable — Bintou" }, { name: "robots", content: "noindex" }] };
    }
    const { product } = loaderData;
    return {
      meta: [
        { title: `${product.name} — Bintou` },
        { name: "description", content: product.short },
        { property: "og:title", content: `${product.name} — Bintou` },
        { property: "og:description", content: product.short },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="text-4xl">Article introuvable</h1>
      <p className="mt-3 text-muted-foreground">Cet article n'existe plus ou a été déplacé.</p>
      <Button asChild variant="ink" size="lg" className="mt-8">
        <Link to="/boutique" search={{ cat: undefined }}>Retour à la boutique</Link>
      </Button>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { add } = useCart();
  const single = product.sizes.length === 1;
  const [size, setSize] = useState<string | null>(single ? (product.sizes[0] ?? null) : null);
  const [error, setError] = useState(false);
  const category = CATEGORIES.find((c) => c.value === product.category)!;
  const related = PRODUCTS.filter((p) => p.slug !== product.slug && p.category === product.category).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-8 md:px-8">
      <Link to="/boutique" search={{ cat: product.category }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {category.label}
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="overflow-hidden rounded-sm bg-muted">
          <img src={product.image} alt={product.name} width={768} height={1024} className="aspect-[3/4] w-full object-cover" />
        </div>

        <div className="md:sticky md:top-28 md:self-start md:py-6">
          {product.isNew && <p className="text-eyebrow text-primary">Nouveauté</p>}
          <h1 className="mt-2 text-5xl md:text-6xl">{product.name}</h1>
          <p className="mt-4 text-2xl">{formatPrice(product.price)}</p>
          <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>
          <p className="mt-4 text-sm"><span className="text-muted-foreground">Tissu :</span> {product.fabric}</p>

          <div className="mt-8">
            <p className="text-eyebrow">Taille</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    setError(false);
                  }}
                  aria-pressed={size === s}
                  className={cn(
                    "min-w-12 rounded-sm border px-4 py-2.5 text-sm transition-colors",
                    size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {error && <p className="mt-2 text-sm text-destructive">Choisissez une taille.</p>}
          </div>

          <Button
            variant="sun"
            size="xl"
            className="mt-8 w-full"
            onClick={() => {
              if (!size) {
                setError(true);
                return;
              }
              add(product.slug, size);
            }}
          >
            Ajouter au panier
          </Button>

          <ul className="mt-10 space-y-4 border-t border-border pt-8 text-sm">
            <li className="flex items-center gap-3"><Scissors className="size-4 text-primary" /> Confectionné à la main par nos artisans</li>
            <li className="flex items-center gap-3"><Truck className="size-4 text-primary" /> Expédition soignée, emballage en tissu</li>
            <li className="flex items-center gap-3"><RefreshCw className="size-4 text-primary" /> Échange de taille possible</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-28">
          <h2 className="text-4xl">Vous aimerez aussi</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
