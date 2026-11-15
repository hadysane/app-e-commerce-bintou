import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, PRODUCTS, type Category } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";

type BoutiqueSearch = { cat?: Category };

export const Route = createFileRoute("/boutique")({
  validateSearch: (search: Record<string, unknown>): BoutiqueSearch => {
    const cat = search.cat;
    return CATEGORIES.some((c) => c.value === cat) ? { cat: cat as Category } : {};
  },
  head: () => ({
    meta: [
      { title: "Boutique — Bintou" },
      { name: "description", content: "Toute la collection Bintou : robes en wax, boubous en bazin, chemises kente et accessoires africains." },
      { property: "og:title", content: "Boutique — Bintou" },
      { property: "og:description", content: "Robes en wax, boubous en bazin, chemises kente et accessoires africains." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Boutique,
});

function Boutique() {
  const { cat } = Route.useSearch();
  const products = cat ? PRODUCTS.filter((p) => p.category === cat) : PRODUCTS;
  const title = cat ? CATEGORIES.find((c) => c.value === cat)!.label : "Toute la collection";

  const filters: { label: string; value: Category | undefined }[] = [
    { label: "Tout", value: undefined },
    ...CATEGORIES,
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 pt-14 md:px-8">
      <p className="text-eyebrow text-primary">Boutique</p>
      <h1 className="mt-3 text-5xl md:text-6xl">{title}</h1>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-6">
        {filters.map((f) => (
          <Link
            key={f.label}
            to="/boutique"
            search={{ cat: f.value }}
            className={cn(
              "rounded-full border px-5 py-2 text-sm transition-colors",
              cat === f.value
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
        <span className="ml-auto self-center text-sm text-muted-foreground">
          {products.length} article{products.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
