-- 20260630000000_create_book_files_bucket.sql
-- Create the book-files storage bucket and define RLS policies for book downloads and administrative management

-- 1. Create the book-files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-files', 
  'book-files', 
  false, 
  52428800, 
  ARRAY['application/pdf', 'application/epub+zip']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure RLS is active on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Allow admins full access to the book-files bucket
DROP POLICY IF EXISTS "Admin Full Access for book-files" ON storage.objects;
CREATE POLICY "Admin Full Access for book-files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'book-files' 
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'book-files' 
  AND public.is_admin()
);

-- 3. Allow users to download book files based on book accessibility rules (restricted vs unrestricted)
DROP POLICY IF EXISTS "User download access for book-files" ON storage.objects;
CREATE POLICY "User download access for book-files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'book-files'
  AND (
    -- Admins can download everything
    public.is_admin()
    OR
    -- Check permissions in public.books table
    -- Path mapping assumes file names are structured as '{book_id}/filename.ext'
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[1]
        AND b.is_published = true
        AND (
          b.is_restricted = false
          OR EXISTS (
            SELECT 1 FROM public.vault_access_requests var
            WHERE var.book_id = b.id
              AND var.user_id = auth.uid()
              AND var.status = 'approved'
          )
        )
    )
  )
);
