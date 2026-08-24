-- Run in Supabase SQL Editor after "Cars" exists.
-- Fixes empty list from the browser: anon key gets 200 + [] when RLS is on with no SELECT policy.
-- Admin + Profiles: run scripts/rls_profiles_admin_and_related.sql (and optional sync_profile_id_to_auth_user.sql).

ALTER TABLE public."Cars" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read non-deleted cars" ON public."Cars";

CREATE POLICY "Public read non-deleted cars"
ON public."Cars"
FOR SELECT
TO anon, authenticated
USING (status IS NULL OR (status)::text <> 'deleted');

GRANT SELECT ON public."Cars" TO anon, authenticated;
