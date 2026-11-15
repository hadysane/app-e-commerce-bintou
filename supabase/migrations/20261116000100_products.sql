-- Catalogue: one row per product, managed from /admin
CREATE TABLE public.products (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  category text NOT NULL CHECK (category IN ('femme', 'homme', 'accessoires')),
  price_cents integer NOT NULL CHECK (price_cents > 0),
  fabric text NOT NULL DEFAULT '',
  short text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  sizes text[] NOT NULL CHECK (cardinality(sizes) > 0),
  image_path text, -- object name in the product-images bucket
  is_new boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true, -- false = hidden from the shop
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active products" ON public.products FOR SELECT TO anon, authenticated
  USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER products_touch_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Starting catalogue (photos are uploaded by `npm run seed:images`)
INSERT INTO public.products (slug, name, category, price_cents, fabric, short, description, sizes, image_path, is_new, position) VALUES
  ('robe-awa', 'Robe Awa', 'femme', 8900, 'Wax ankara 100 % coton',
   'Robe longue cintrée, imprimé soleil orange et turquoise.',
   'Une robe longue au décolleté en V et à la taille smockée, taillée dans un wax aux motifs solaires. Fluide, lumineuse, pensée pour les grandes occasions comme pour les journées d''été.',
   ARRAY['XS','S','M','L','XL'], 'robe-awa.jpg', true, 1),
  ('boubou-fatou', 'Boubou Fatou', 'femme', 12900, 'Bazin riche brodé',
   'Boubou ample bleu roi, broderie dorée au col.',
   'Le boubou des cérémonies : un bazin riche au tombé majestueux, rehaussé d''une broderie dorée faite main autour de l''encolure. Coupe ample, taille unique ajustable.',
   ARRAY['Taille unique'], 'boubou-fatou.jpg', false, 2),
  ('jupe-ama', 'Jupe Ama', 'femme', 5900, 'Wax ankara 100 % coton',
   'Jupe midi taille haute, fuchsia et or, avec poches.',
   'Une jupe midi évasée à taille haute, avec de vraies poches. Le wax fuchsia et or se porte aussi bien avec un t-shirt blanc qu''avec un top habillé.',
   ARRAY['XS','S','M','L','XL'], 'jupe-ama.jpg', true, 3),
  ('veste-sekou', 'Bomber Sékou', 'femme', 9500, 'Wax doublé, bords côtes',
   'Bomber court en wax géométrique moutarde et rouge.',
   'Le classique streetwear revisité : un bomber court en wax géométrique, doublé et zippé, avec bords côtes noirs. La pièce qui twiste toutes vos tenues.',
   ARRAY['XS','S','M','L','XL'], 'veste-sekou.jpg', false, 4),
  ('chemise-kofi', 'Chemise Kofi', 'homme', 6900, 'Coton imprimé kente',
   'Chemise manches courtes, col cubain, motif kente.',
   'Une chemise à col cubain et manches courtes, imprimée d''un motif kente aux couleurs or, vert et rouge. Coupe droite décontractée, parfaite ouverte ou boutonnée.',
   ARRAY['S','M','L','XL','XXL'], 'chemise-kofi.jpg', false, 5),
  ('ensemble-moussa', 'Ensemble Moussa', 'homme', 13900, 'Lin coton, bandes bogolan',
   'Tunique et pantalon vert forêt, bandes bogolan indigo.',
   'Un ensemble deux pièces — tunique et pantalon — en lin coton vert forêt, orné de bandes inspirées du bogolan malien. Élégant pour les fêtes, confortable au quotidien.',
   ARRAY['S','M','L','XL','XXL'], 'ensemble-moussa.jpg', true, 6),
  ('duo-dioula', 'Duo Dioula', 'accessoires', 3900, 'Wax ankara 100 % coton',
   'Foulard de tête et tote bag assortis, vert et orange.',
   'Un foulard de tête généreux et son tote bag assorti, dans un wax floral vert émeraude, orange et or. Le duo idéal pour offrir — ou se faire plaisir.',
   ARRAY['Taille unique'], 'duo-dioula.jpg', false, 7);

-- Stock rows now belong to a product (renaming or deleting a product follows through)
ALTER TABLE public.product_stock
  ADD CONSTRAINT product_stock_product_slug_fkey
  FOREIGN KEY (product_slug) REFERENCES public.products(slug) ON UPDATE CASCADE ON DELETE CASCADE;

-- Product photos: public read (public bucket URLs), admin write
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- The storage API also needs SELECT to delete or replace an object
CREATE POLICY "Admins list product images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
