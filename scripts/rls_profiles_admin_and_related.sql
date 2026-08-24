-- ============================================================================
-- RLS for Profiles, Cars (admin writes), BorrowRequest, Rentals
-- Run in Supabase SQL Editor after core tables exist.
--
-- Admin gate in the app: useAuth loads "Profiles" WHERE id = auth.uid().
--   Seed UUIDs (e.g. e04d8331-...) MUST match the Auth user id, or admin is false.
--   See: scripts/sync_profile_id_to_auth_user.sql
--
-- app_is_admin() uses SECURITY DEFINER so it can read Profiles without RLS recursion.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.app_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT upper(p.role) IN ('ADMIN', 'MODERATOR')
      FROM public."Profiles" p
      WHERE p.id = (auth.uid())::text
         OR (
           (auth.jwt() ->> 'email') IS NOT NULL
           AND lower(btrim(p.email::text)) = lower(btrim((auth.jwt() ->> 'email')))
         )
      LIMIT 1
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.app_is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.app_is_admin() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profiles (required for /admin: role must load for auth.uid())
-- ---------------------------------------------------------------------------
ALTER TABLE public."Profiles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lvl_profiles_select" ON public."Profiles";
CREATE POLICY "lvl_profiles_select"
ON public."Profiles"
FOR SELECT
TO authenticated
USING (
  id = (auth.uid())::text
  OR public.app_is_admin()
  OR (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND lower(btrim((email)::text)) = lower(btrim((auth.jwt() ->> 'email')))
  )
);

DROP POLICY IF EXISTS "lvl_profiles_update" ON public."Profiles";
CREATE POLICY "lvl_profiles_update"
ON public."Profiles"
FOR UPDATE
TO authenticated
USING (
  id = (auth.uid())::text
  OR public.app_is_admin()
)
WITH CHECK (
  id = (auth.uid())::text
  OR public.app_is_admin()
);

DROP POLICY IF EXISTS "lvl_profiles_insert" ON public."Profiles";
CREATE POLICY "lvl_profiles_insert"
ON public."Profiles"
FOR INSERT
TO authenticated
WITH CHECK (
  id = (auth.uid())::text
  OR public.app_is_admin()
);

GRANT SELECT, INSERT, UPDATE ON public."Profiles" TO authenticated;

-- ---------------------------------------------------------------------------
-- Cars: keep public catalog read; admins see/edit everything (incl. deleted)
-- Requires scripts/rls_public_cars_read.sql run first (enables RLS on Cars).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "lvl_cars_admin_select_all" ON public."Cars";
CREATE POLICY "lvl_cars_admin_select_all"
ON public."Cars"
FOR SELECT
TO authenticated
USING (public.app_is_admin());

DROP POLICY IF EXISTS "lvl_cars_admin_insert" ON public."Cars";
CREATE POLICY "lvl_cars_admin_insert"
ON public."Cars"
FOR INSERT
TO authenticated
WITH CHECK (public.app_is_admin());

DROP POLICY IF EXISTS "lvl_cars_admin_update" ON public."Cars";
CREATE POLICY "lvl_cars_admin_update"
ON public."Cars"
FOR UPDATE
TO authenticated
USING (public.app_is_admin())
WITH CHECK (public.app_is_admin());

DROP POLICY IF EXISTS "lvl_cars_admin_delete" ON public."Cars";
CREATE POLICY "lvl_cars_admin_delete"
ON public."Cars"
FOR DELETE
TO authenticated
USING (public.app_is_admin());

GRANT INSERT, UPDATE, DELETE ON public."Cars" TO authenticated;

-- ---------------------------------------------------------------------------
-- BorrowRequest: anon = public catalog; authenticated = own rows + JWT email +
--   APPROVED (car availability when logged in) + admin. Dashboard also filters in app.
-- Rentals: broad SELECT kept for logged-in car pages; getUserRentals uses auth.uid().
-- Writes from the app often use service role (bypass RLS).
-- ---------------------------------------------------------------------------
ALTER TABLE public."BorrowRequest" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lvl_borrowrequest_select_public" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_select_anon" ON public."BorrowRequest";
CREATE POLICY "lvl_borrowrequest_select_anon"
ON public."BorrowRequest"
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "lvl_borrowrequest_select_admin" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_select_authenticated" ON public."BorrowRequest";
CREATE POLICY "lvl_borrowrequest_select_authenticated"
ON public."BorrowRequest"
FOR SELECT
TO authenticated
USING (
  public.app_is_admin()
  OR (user_id IS NOT NULL AND user_id = (auth.uid())::text)
  OR (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND customer_email IS NOT NULL
    AND lower(trim(customer_email::text)) = lower(trim((auth.jwt() ->> 'email')))
  )
  OR (COALESCE(status::text, '') = 'APPROVED')
);

-- Writes: do NOT use FOR ALL here — it would duplicate SELECT rules for authenticated only
DROP POLICY IF EXISTS "lvl_borrowrequest_write_admin" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_insert_admin" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_update_admin" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_delete_admin" ON public."BorrowRequest";

CREATE POLICY "lvl_borrowrequest_insert_admin"
ON public."BorrowRequest"
FOR INSERT
TO authenticated
WITH CHECK (public.app_is_admin());

CREATE POLICY "lvl_borrowrequest_update_admin"
ON public."BorrowRequest"
FOR UPDATE
TO authenticated
USING (public.app_is_admin())
WITH CHECK (public.app_is_admin());

CREATE POLICY "lvl_borrowrequest_delete_admin"
ON public."BorrowRequest"
FOR DELETE
TO authenticated
USING (public.app_is_admin());

ALTER TABLE public."Rentals" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lvl_rentals_select_public" ON public."Rentals";
CREATE POLICY "lvl_rentals_select_public"
ON public."Rentals"
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "lvl_rentals_select_admin" ON public."Rentals";
CREATE POLICY "lvl_rentals_select_admin"
ON public."Rentals"
FOR SELECT
TO authenticated
USING (public.app_is_admin());

DROP POLICY IF EXISTS "lvl_rentals_write_admin" ON public."Rentals";
DROP POLICY IF EXISTS "lvl_rentals_insert_admin" ON public."Rentals";
DROP POLICY IF EXISTS "lvl_rentals_update_admin" ON public."Rentals";
DROP POLICY IF EXISTS "lvl_rentals_delete_admin" ON public."Rentals";

CREATE POLICY "lvl_rentals_insert_admin"
ON public."Rentals"
FOR INSERT
TO authenticated
WITH CHECK (public.app_is_admin());

CREATE POLICY "lvl_rentals_update_admin"
ON public."Rentals"
FOR UPDATE
TO authenticated
USING (public.app_is_admin())
WITH CHECK (public.app_is_admin());

CREATE POLICY "lvl_rentals_delete_admin"
ON public."Rentals"
FOR DELETE
TO authenticated
USING (public.app_is_admin());

GRANT SELECT ON public."BorrowRequest" TO anon, authenticated;
GRANT SELECT ON public."Rentals" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public."BorrowRequest" TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public."Rentals" TO authenticated;
