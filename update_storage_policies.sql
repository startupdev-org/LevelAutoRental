-- Update Supabase storage policies to allow car image uploads
-- Run this in your Supabase SQL editor

-- Allow authenticated users to upload images to car folders
CREATE POLICY "Allow authenticated users to upload car images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] != 'restricted' -- Allow any folder except restricted ones
);

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Allow authenticated users to update car images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'cars' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their uploaded images
CREATE POLICY "Allow authenticated users to delete car images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'cars' 
  AND auth.role() = 'authenticated'
);

-- Alternative: If you want to be more permissive and allow any folder structure
-- Replace the above policies with these:

/*
-- Allow service key (admin) to do everything
CREATE POLICY "Allow service key full access" ON storage.objects
FOR ALL USING (
  bucket_id = 'cars' 
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- Allow authenticated users to upload to car-specific folders
CREATE POLICY "Allow uploads to car folders" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cars'
  AND auth.role() = 'authenticated'
  AND storage.foldername(name) LIKE 'cars/%' -- Allow uploads to cars/ subfolder
);
*/

-- Note: You may need to drop the existing restrictive policies first
-- DROP POLICY "Give anon users access to JPG images in folder 1tafz_O" ON storage.objects;
-- DROP POLICY "Give anon users access to JPG images in folder 1tafz_3" ON storage.objects;
-- DROP POLICY "Give anon users access to JPG images in folder 1tafz_2" ON storage.objects;
-- DROP POLICY "Give anon users access to JPG images in folder 1tafz_1" ON storage.objects;
