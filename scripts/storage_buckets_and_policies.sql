-- ============================================================================
-- Supabase Storage: buckets + RLS policies (matches app: cars + contracts)
-- Run in Supabase SQL Editor (same project as VITE_SUPABASE_URL).
--
-- Buckets (code): supabase.storage.from('cars') | .from('contracts')
-- Paths: cars → {slug}/{model}-main.jpg ; contracts → Public/rental-{id}/*.pdf
-- ============================================================================

-- --- Buckets (id must match JS exactly: lowercase) ---
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('cars', 'cars', true),
  ('contracts', 'contracts', true)
ON CONFLICT (id) DO UPDATE SET
  public   = EXCLUDED.public,
  name     = EXCLUDED.name;

-- Optional: tighten types / size (uncomment if your Supabase version supports these columns)
-- UPDATE storage.buckets SET
--   file_size_limit    = 52428800, -- 50 MiB
--   allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']::text[]
-- WHERE id = 'cars';
-- UPDATE storage.buckets SET
--   file_size_limit    = 52428800,
--   allowed_mime_types = ARRAY['application/pdf']::text[]
-- WHERE id = 'contracts';

-- --- Policies on storage.objects (upload/update/delete still require policies for public buckets) ---

-- Read: anyone can fetch via Storage API / list (public URLs work when bucket.public = true)
DROP POLICY IF EXISTS "storage_select_cars_public" ON storage.objects;
CREATE POLICY "storage_select_cars_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cars');


DROP POLICY IF EXISTS "storage_select_contracts_public" ON storage.objects;
CREATE POLICY "storage_select_contracts_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contracts');

-- Write: logged-in users (admin UI uses supabase + session; service_role bypasses RLS)
DROP POLICY IF EXISTS "storage_insert_cars_authenticated" ON storage.objects;
CREATE POLICY "storage_insert_cars_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cars');

DROP POLICY IF EXISTS "storage_update_cars_authenticated" ON storage.objects;
CREATE POLICY "storage_update_cars_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cars')
WITH CHECK (bucket_id = 'cars');

DROP POLICY IF EXISTS "storage_delete_cars_authenticated" ON storage.objects;
CREATE POLICY "storage_delete_cars_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cars');

DROP POLICY IF EXISTS "storage_insert_contracts_authenticated" ON storage.objects;
CREATE POLICY "storage_insert_contracts_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts');

DROP POLICY IF EXISTS "storage_update_contracts_authenticated" ON storage.objects;
CREATE POLICY "storage_update_contracts_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contracts')
WITH CHECK (bucket_id = 'contracts');

DROP POLICY IF EXISTS "storage_delete_contracts_authenticated" ON storage.objects;
CREATE POLICY "storage_delete_contracts_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contracts');
