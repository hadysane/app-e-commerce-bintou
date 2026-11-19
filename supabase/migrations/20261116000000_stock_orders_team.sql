-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins remove other admins" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND user_id <> auth.uid());

-- Team invites
CREATE TABLE public.team_invites (
  email text PRIMARY KEY,
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read invites" ON public.team_invites FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create invites" ON public.team_invites FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete invites" ON public.team_invites FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- First account, or invited accounts, become admin on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
     OR EXISTS (SELECT 1 FROM public.team_invites WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role, email) VALUES (NEW.id, 'admin', NEW.email)
    ON CONFLICT DO NOTHING;
    DELETE FROM public.team_invites WHERE lower(email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Inviting someone who already has an account grants the role right away
CREATE OR REPLACE FUNCTION public.handle_team_invite()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  NEW.email := lower(trim(NEW.email));
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = NEW.email LIMIT 1;
  IF _uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, email) VALUES (_uid, 'admin', NEW.email)
    ON CONFLICT DO NOTHING;
    RETURN NULL; -- no pending invite needed
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_team_invite BEFORE INSERT ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.handle_team_invite();

-- Stock per product and size
CREATE TABLE public.product_stock (
  product_slug text NOT NULL,
  size text NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_slug, size)
);
GRANT SELECT ON public.product_stock TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_stock TO authenticated;
GRANT ALL ON public.product_stock TO service_role;
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads stock" ON public.product_stock FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert stock" ON public.product_stock FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update stock" ON public.product_stock FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete stock" ON public.product_stock FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'expired')),
  items jsonb NOT NULL,
  amount_total integer NOT NULL,
  customer_email text,
  customer_name text,
  shipping jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Mark an order paid and decrement stock, once
CREATE OR REPLACE FUNCTION public.fulfill_order(_session_id text, _email text, _name text, _shipping jsonb, _amount integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders; item jsonb;
BEGIN
  SELECT * INTO o FROM public.orders WHERE stripe_session_id = _session_id FOR UPDATE;
  IF NOT FOUND OR o.status <> 'pending' THEN RETURN false; END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(o.items) LOOP
    UPDATE public.product_stock
      SET quantity = GREATEST(0, quantity - (item->>'qty')::int), updated_at = now()
      WHERE product_slug = item->>'slug' AND size = item->>'size';
  END LOOP;
  UPDATE public.orders SET status = 'paid', paid_at = now(),
    customer_email = COALESCE(_email, customer_email),
    customer_name = COALESCE(_name, customer_name),
    shipping = COALESCE(_shipping, shipping),
    amount_total = COALESCE(_amount, amount_total)
  WHERE id = o.id;
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.fulfill_order(text, text, text, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_order(text, text, text, jsonb, integer) TO service_role;

-- Starting stock
INSERT INTO public.product_stock (product_slug, size, quantity) VALUES
  ('robe-awa','XS',4),('robe-awa','S',8),('robe-awa','M',10),('robe-awa','L',6),('robe-awa','XL',3),
  ('boubou-fatou','Taille unique',12),
  ('jupe-ama','XS',5),('jupe-ama','S',7),('jupe-ama','M',9),('jupe-ama','L',4),('jupe-ama','XL',0),
  ('veste-sekou','XS',3),('veste-sekou','S',6),('veste-sekou','M',8),('veste-sekou','L',5),('veste-sekou','XL',2),
  ('chemise-kofi','S',6),('chemise-kofi','M',10),('chemise-kofi','L',10),('chemise-kofi','XL',6),('chemise-kofi','XXL',3),
  ('ensemble-moussa','S',4),('ensemble-moussa','M',6),('ensemble-moussa','L',6),('ensemble-moussa','XL',4),('ensemble-moussa','XXL',2),
  ('duo-dioula','Taille unique',20);