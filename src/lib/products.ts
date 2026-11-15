import robeAwa from "@/assets/robe-awa.jpg";
import chemiseKofi from "@/assets/chemise-kofi.jpg";
import boubouFatou from "@/assets/boubou-fatou.jpg";
import vesteSekou from "@/assets/veste-sekou.jpg";
import jupeAma from "@/assets/jupe-ama.jpg";
import foulardDioula from "@/assets/foulard-dioula.jpg";
import ensembleMoussa from "@/assets/ensemble-moussa.jpg";

export type Category = "femme" | "homme" | "accessoires";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "accessoires", label: "Accessoires" },
];

export type Product = {
  slug: string;
  name: string;
  category: Category;
  price: number; // euros
  fabric: string;
  short: string;
  description: string;
  image: string;
  sizes: string[];
  isNew?: boolean;
};

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];

export const PRODUCTS: Product[] = [
  {
    slug: "robe-awa",
    name: "Robe Awa",
    category: "femme",
    price: 89,
    fabric: "Wax ankara 100 % coton",
    short: "Robe longue cintrée, imprimé soleil orange et turquoise.",
    description:
      "Une robe longue au décolleté en V et à la taille smockée, taillée dans un wax aux motifs solaires. Fluide, lumineuse, pensée pour les grandes occasions comme pour les journées d'été.",
    image: robeAwa,
    sizes: APPAREL_SIZES,
    isNew: true,
  },
  {
    slug: "boubou-fatou",
    name: "Boubou Fatou",
    category: "femme",
    price: 129,
    fabric: "Bazin riche brodé",
    short: "Boubou ample bleu roi, broderie dorée au col.",
    description:
      "Le boubou des cérémonies : un bazin riche au tombé majestueux, rehaussé d'une broderie dorée faite main autour de l'encolure. Coupe ample, taille unique ajustable.",
    image: boubouFatou,
    sizes: ["Taille unique"],
  },
  {
    slug: "jupe-ama",
    name: "Jupe Ama",
    category: "femme",
    price: 59,
    fabric: "Wax ankara 100 % coton",
    short: "Jupe midi taille haute, fuchsia et or, avec poches.",
    description:
      "Une jupe midi évasée à taille haute, avec de vraies poches. Le wax fuchsia et or se porte aussi bien avec un t-shirt blanc qu'avec un top habillé.",
    image: jupeAma,
    sizes: APPAREL_SIZES,
    isNew: true,
  },
  {
    slug: "veste-sekou",
    name: "Bomber Sékou",
    category: "femme",
    price: 95,
    fabric: "Wax doublé, bords côtes",
    short: "Bomber court en wax géométrique moutarde et rouge.",
    description:
      "Le classique streetwear revisité : un bomber court en wax géométrique, doublé et zippé, avec bords côtes noirs. La pièce qui twiste toutes vos tenues.",
    image: vesteSekou,
    sizes: APPAREL_SIZES,
  },
  {
    slug: "chemise-kofi",
    name: "Chemise Kofi",
    category: "homme",
    price: 69,
    fabric: "Coton imprimé kente",
    short: "Chemise manches courtes, col cubain, motif kente.",
    description:
      "Une chemise à col cubain et manches courtes, imprimée d'un motif kente aux couleurs or, vert et rouge. Coupe droite décontractée, parfaite ouverte ou boutonnée.",
    image: chemiseKofi,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    slug: "ensemble-moussa",
    name: "Ensemble Moussa",
    category: "homme",
    price: 139,
    fabric: "Lin coton, bandes bogolan",
    short: "Tunique et pantalon vert forêt, bandes bogolan indigo.",
    description:
      "Un ensemble deux pièces — tunique et pantalon — en lin coton vert forêt, orné de bandes inspirées du bogolan malien. Élégant pour les fêtes, confortable au quotidien.",
    image: ensembleMoussa,
    sizes: ["S", "M", "L", "XL", "XXL"],
    isNew: true,
  },
  {
    slug: "duo-dioula",
    name: "Duo Dioula",
    category: "accessoires",
    price: 39,
    fabric: "Wax ankara 100 % coton",
    short: "Foulard de tête et tote bag assortis, vert et orange.",
    description:
      "Un foulard de tête généreux et son tote bag assorti, dans un wax floral vert émeraude, orange et or. Le duo idéal pour offrir — ou se faire plaisir.",
    image: foulardDioula,
    sizes: ["Taille unique"],
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function formatPrice(euros: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(euros);
}
