## Project rules

- The project is no longer connected to Lovable: the code, the Supabase project and the secrets are managed here.
- Catalogue lives in the Supabase `products` table, photos in the public `product-images` Storage bucket; both are edited from `/admin` (Produits tab). `src/lib/products.ts` only holds types and helpers, with no product data.
- Stock is per product and size in `product_stock`, linked to `products.slug`. Cart state is client-side in `src/lib/cart.tsx` persisted to localStorage, with pure logic in `src/lib/cart-logic.ts` that takes the catalogue as a parameter.
- Schema changes go in a new file under `supabase/migrations/` (never edit an applied migration), then `npm run db:push` and `npm run db:types` to regenerate `src/integrations/supabase/types.ts`.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) go in `.env` or `.env.local`, both git-ignored; `.env.example` lists every variable. Only `VITE_`-prefixed values reach the browser.
- Sign-in is email + password via Supabase Auth. The first account created becomes admin; others get access through invites in `/admin`.
