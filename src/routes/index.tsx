import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/hero-bintou.jpg";
import atelier from "@/assets/atelier.jpg";
import { PRODUCTS, CATEGORIES } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { stockQueryOptions } from "@/lib/stock";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bintou — Vêtements africains en wax, bazin et kente" },
      { name: "description", content: "Découvrez Bintou : robes, boubous, chemises et accessoires africains contemporains, taillés dans des tissus wax, bazin et kente." },
      { property: "og:title", content: "Bintou — Vêtements africains en wax, bazin et kente" },
      { property: "og:description", content: "Robes, boubous, chemises et accessoires africains contemporains." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(stockQueryOptions).catch(() => undefined),
  component: Home,
});

const CATEGORY_IMAGES: Record<string, string> = {
  femme: PRODUCTS.find((p) => p.slug === "robe-awa")!.image,
  homme: PRODUCTS.find((p) => p.slug === "ensemble-moussa")!.image,
  accessoires: PRODUCTS.find((p) => p.slug === "duo-dioula")!.image,
};

function Home() {
  const featured = PRODUCTS.filter((p) => p.isNew).concat(PRODUCTS.filter((p) => !p.isNew)).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-indigo-dye">
        <img
          src={hero}
          alt="Femme portant une robe longue Bintou en wax orange et indigo"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground/75 via-foreground/35 to-transparent" />
        <div className="mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-5 pb-16 pt-32 md:justify-center md:px-8 md:pb-0">
          <p className="text-eyebrow animate-rise text-saffron">Nouvelle collection · Soleil d'Afrique</p>
          <h1 className="animate-rise mt-5 max-w-2xl text-5xl font-medium leading-[1.02] text-primary-foreground md:text-7xl [animation-delay:120ms]">
            Portez vos racines <em className="font-normal text-saffron">avec éclat.</em>
          </h1>
          <p className="animate-rise mt-6 max-w-md text-base leading-relaxed text-primary-foreground/85 [animation-delay:240ms]">
            Wax, bazin, kente : des pièces contemporaines qui célèbrent l'élégance africaine, au quotidien comme aux grandes occasions.
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-3 [animation-delay:360ms]">
            <Button asChild variant="sun" size="xl">
              <Link to="/boutique" search={{ cat: undefined }}>Découvrir la collection</Link>
            </Button>
            <Button asChild variant="ghostLight" size="xl">
              <Link to="/a-propos">Notre histoire</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 pt-20 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              to="/boutique"
              search={{ cat: c.value }}
              className="group relative block overflow-hidden rounded-sm"
            >
              <img
                src={CATEGORY_IMAGES[c.value]}
                alt={c.label}
                loading="lazy"
                width={768}
                height={1024}
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105 md:aspect-[3/4]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-primary-foreground">
                <h2 className="text-3xl">{c.label}</h2>
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-5 pt-24 md:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-eyebrow text-primary">Sélection</p>
            <h2 className="mt-3 text-4xl md:text-5xl">Les pièces du moment</h2>
          </div>
          <Link to="/boutique" search={{ cat: undefined }} className="hidden items-center gap-2 text-sm underline-offset-4 hover:underline md:inline-flex">
            Tout voir <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Story band */}
      <section className="mx-auto mt-28 max-w-7xl px-5 md:px-8">
        <div className="grid items-center gap-10 overflow-hidden rounded-sm bg-secondary md:grid-cols-2 md:gap-0">
          <img src={atelier} alt="Couturière découpant un tissu wax dans l'atelier" loading="lazy" width={1280} height={960} className="h-full w-full object-cover" />
          <div className="px-6 pb-12 md:px-14 md:py-16">
            <p className="text-eyebrow text-primary">Savoir-faire</p>
            <h2 className="mt-3 text-4xl leading-tight md:text-5xl">Chaque pièce raconte une histoire.</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Nos tissus sont choisis un à un pour leurs couleurs et leurs symboles, puis confiés à des couturières et tailleurs passionnés. Le résultat : des vêtements uniques, faits pour durer.
            </p>
            <Button asChild variant="ink" size="lg" className="mt-8">
              <Link to="/a-propos">Découvrir notre histoire</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
