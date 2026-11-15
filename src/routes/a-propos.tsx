import { createFileRoute, Link } from "@tanstack/react-router";
import atelier from "@/assets/atelier.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "Notre histoire — Bintou" },
      { name: "description", content: "L'histoire de Bintou : une marque de mode africaine contemporaine qui célèbre le wax, le bazin et le kente." },
      { property: "og:title", content: "Notre histoire — Bintou" },
      { property: "og:description", content: "Une marque de mode africaine contemporaine qui célèbre le wax, le bazin et le kente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const VALUES = [
  { title: "Des tissus choisis", text: "Wax, bazin riche, kente, bogolan : chaque étoffe est sélectionnée pour sa qualité et la force de ses motifs." },
  { title: "Fait main", text: "Nos pièces sont coupées et cousues par des artisans dont le savoir-faire se transmet de génération en génération." },
  { title: "Pour toutes les occasions", text: "Du marché du samedi au mariage du dimanche, des vêtements qui accompagnent tous vos moments." },
];

function About() {
  return (
    <div>
      <section className="mx-auto max-w-4xl px-5 pt-20 text-center md:px-8">
        <p className="text-eyebrow text-primary">Notre histoire</p>
        <h1 className="mt-4 text-5xl leading-[1.05] md:text-7xl">
          Bintou, c'est un prénom, <em className="text-primary">une fierté.</em>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Bintou est née d'une envie simple : porter la beauté des tissus africains au quotidien, avec des coupes modernes qui nous ressemblent. Chaque collection rend hommage aux femmes et aux hommes qui font vivre ces étoffes.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-5 md:px-8">
        <img src={atelier} alt="Couturière dans l'atelier Bintou" loading="lazy" width={1280} height={960} className="aspect-[16/9] w-full rounded-sm object-cover" />
      </section>

      <section className="mx-auto mt-20 grid max-w-6xl gap-10 px-5 md:grid-cols-3 md:px-8">
        {VALUES.map((v, i) => (
          <div key={v.title} className="border-t-2 border-primary pt-6">
            <p className="font-display text-5xl text-saffron">0{i + 1}</p>
            <h2 className="mt-3 text-2xl">{v.title}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{v.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5 md:px-8">
        <div className="rounded-sm bg-indigo-dye px-8 py-16 text-center text-indigo-dye-foreground">
          <h2 className="text-4xl md:text-5xl">Trouvez la pièce qui vous ressemble.</h2>
          <Button asChild variant="sun" size="xl" className="mt-8">
            <Link to="/boutique" search={{ cat: undefined }}>Voir la boutique</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
