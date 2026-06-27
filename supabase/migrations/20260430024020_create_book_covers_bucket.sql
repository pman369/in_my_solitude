
-- Create the book-covers bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the book-covers bucket
-- 1. Allow public read access to all files in the book-covers bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

-- 2. Allow admins to upload/update/delete files in the book-covers bucket
-- Ensure admin policy does not already exist
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;

-- 2. Allow admins to upload/update/delete files in the book-covers bucket
CREATE POLICY "Admin Full Access"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'book-covers' 
  AND (SELECT public.is_admin())
)
WITH CHECK (
  bucket_id = 'book-covers' 
  AND (SELECT public.is_admin())
);
