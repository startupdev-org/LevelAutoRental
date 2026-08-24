-- BorrowRequest RLS (anon vs authenticated). Requires public.app_is_admin().
-- Run in Supabase SQL Editor.

ALTER TABLE public."BorrowRequest" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lvl_borrowrequest_select_public" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_select_anon" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_select_admin" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_select_authenticated" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_write_admin" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_insert_admin" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_update_admin" ON public."BorrowRequest";
DROP POLICY IF EXISTS "lvl_borrowrequest_delete_admin" ON public."BorrowRequest";

CREATE POLICY "lvl_borrowrequest_select_anon"
ON public."BorrowRequest"
FOR SELECT
TO anon
USING (true);

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

GRANT SELECT ON public."BorrowRequest" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public."BorrowRequest" TO authenticated;
