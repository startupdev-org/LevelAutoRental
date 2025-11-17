-- Create RLS policy to allow INSERT operations on the contracts bucket
-- This allows authenticated users to upload contract PDFs

CREATE POLICY "Allow contract uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts'
);

-- Optional: Also allow SELECT (read) operations if you want authenticated users to download contracts
CREATE POLICY "Allow contract downloads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts'
);

-- Optional: Allow public (anonymous) access to read contracts if the bucket is public
-- Uncomment the following if you want anyone to be able to view contracts via public URL
-- CREATE POLICY "Allow public contract access"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (
--   bucket_id = 'contracts'
-- );

