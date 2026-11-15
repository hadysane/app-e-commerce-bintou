import { createFileRoute } from "@tanstack/react-router";
import { Mail, Instagram, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Bintou" },
      { name: "description", content: "Une question sur une taille, une commande ou une pièce sur mesure ? Contactez l'équipe Bintou." },
      { property: "og:title", content: "Contact — Bintou" },
      { property: "og:description", content: "Une question sur une taille, une commande ou une pièce sur mesure ? Contactez Bintou." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

const CHANNELS = [
  { icon: Mail, label: "E-mail", value: "contact@bintou.fr", href: "mailto:contact@bintou.fr" },
  { icon: Instagram, label: "Instagram", value: "@bintou", href: "https://instagram.com/" },
  { icon: MessageCircle, label: "WhatsApp", value: "Bientôt disponible", href: undefined },
];

function Contact() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-20 md:px-8">
      <p className="text-eyebrow text-primary">Contact</p>
      <h1 className="mt-4 max-w-2xl text-5xl leading-[1.05] md:text-6xl">Parlons tissus, tailles et sur-mesure.</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
        Une question sur une commande, une taille ou une pièce personnalisée pour un mariage ou une cérémonie ? Écrivez-nous, nous vous répondons avec plaisir.
      </p>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {CHANNELS.map(({ icon: Icon, label, value, href }) => {
          const inner = (
            <>
              <Icon className="size-6 text-primary" />
              <p className="text-eyebrow mt-6 text-muted-foreground">{label}</p>
              <p className="mt-2 font-display text-2xl">{value}</p>
            </>
          );
          return href ? (
            <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="rounded-sm border border-border bg-card p-8 transition-colors hover:border-primary">
              {inner}
            </a>
          ) : (
            <div key={label} className="rounded-sm border border-border bg-card p-8">{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
