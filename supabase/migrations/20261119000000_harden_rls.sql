-- Security advisor fixes:
-- * public.has_role was callable by anyone through /rest/v1/rpc and could probe any user id.
--   It is replaced by private.is_admin(), which only checks the caller and lives in a schema
--   the Data API does not expose.
-- * Trigger functions are not meant to be called through the API: revoke EXECUTE.
-- * Policies wrap auth.uid() / is_admin() in (select ...) so Postgres evaluates them once per
--   query instead of once per row, and user_roles gets a single SELECT policy.

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  )
$$;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated, service_role;

-- user_roles
DROP POLICY "Users read own roles" ON public.user_roles;
DROP POLICY "Admins read all roles" ON public.user_roles;
DROP POLICY "Admins remove other admins" ON public.user_roles;
CREATE POLICY "Read own role, admins read all" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "Admins remove other admins" ON public.user_roles FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()) AND user_id <> (SELECT auth.uid()));

-- team_invites
DROP POLICY "Admins read invites" ON public.team_invites;
DROP POLICY "Admins create invites" ON public.team_invites;
DROP POLICY "Admins delete invites" ON public.team_invites;
CREATE POLICY "Admins read invites" ON public.team_invites FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));
CREATE POLICY "Admins create invites" ON public.team_invites FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admins delete invites" ON public.team_invites FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- product_stock ("Anyone reads stock" is unchanged)
DROP POLICY "Admins insert stock" ON public.product_stock;
DROP POLICY "Admins update stock" ON public.product_stock;
DROP POLICY "Admins delete stock" ON public.product_stock;
CREATE POLICY "Admins insert stock" ON public.product_stock FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admins update stock" ON public.product_stock FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admins delete stock" ON public.product_stock FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- orders
DROP POLICY "Admins read orders" ON public.orders;
DROP POLICY "Admins update orders" ON public.orders;
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

-- products
DROP POLICY "Anyone reads active products" ON public.products;
DROP POLICY "Admins insert products" ON public.products;
DROP POLICY "Admins update products" ON public.products;
DROP POLICY "Admins delete products" ON public.products;
CREATE POLICY "Anyone reads active products" ON public.products FOR SELECT TO anon, authenticated
  USING (active OR (SELECT private.is_admin()));
CREATE POLICY "Admins insert products" ON public.products FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admins update products" ON public.products FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- product photos
DROP POLICY "Admins list product images" ON storage.objects;
DROP POLICY "Admins upload product images" ON storage.objects;
DROP POLICY "Admins update product images" ON storage.objects;
DROP POLICY "Admins delete product images" ON storage.objects;
CREATE POLICY "Admins list product images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND (SELECT private.is_admin()));
CREATE POLICY "Admins upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (SELECT private.is_admin()));
CREATE POLICY "Admins update product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND (SELECT private.is_admin()))
  WITH CHECK (bucket_id = 'product-images' AND (SELECT private.is_admin()));
CREATE POLICY "Admins delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND (SELECT private.is_admin()));

-- No policy references has_role any more
DROP FUNCTION public.has_role(uuid, public.app_role);

-- Trigger functions still fire (EXECUTE is checked when the trigger is created), but can no
-- longer be called through /rest/v1/rpc.
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_team_invite() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Added by the project's "automatic RLS" option; an event trigger, not an API function.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
