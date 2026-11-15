# Bintou African Fashion

Boutique en ligne de vêtements africains : catalogue, panier, paiement Stripe et espace d'administration (produits, stocks, commandes, équipe).

TanStack Start (React) · Tailwind · Supabase (base, authentification, stockage des photos) · Stripe Checkout.

## Démarrage

Il faut Node.js 22 ou plus (20 fonctionne, avec des avertissements) et un projet sur [supabase.com](https://supabase.com).

```sh
npm install
cp .env.example .env            # puis remplir les valeurs depuis Supabase et Stripe
npx supabase login
npm run db:link                 # choisir le projet Supabase
npm run db:push                 # crée les tables, le bucket photos et le catalogue de départ
npm run seed:images             # envoie les 7 photos de départ dans Supabase Storage
npm run dev                     # http://localhost:8080
```

Créez ensuite votre compte sur `/auth` : **le premier compte devient administrateur**. Les suivants sont invités depuis `/admin` → Équipe.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` puis `npm start` | Version de production (serveur Node) |
| `npm test` | Tests |
| `npm run db:push` | Applique les nouvelles migrations de `supabase/migrations/` |
| `npm run db:types` | Régénère les types TypeScript de la base |
| `npm run seed:images` | Renvoie les photos de départ |

## Structure

- `src/routes/` : pages (boutique, fiche produit, `/admin`…)
- `src/lib/` : panier, logique de stock, fonctions serveur (catalogue, paiement Stripe)
- `src/integrations/supabase/` : clients Supabase (navigateur, serveur, authentification)
- `supabase/migrations/` : schéma de la base
- `supabase/seed/images/` : photos du catalogue de départ
