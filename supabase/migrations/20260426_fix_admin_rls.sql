-- ═══════════════════════════════════════════════════════════════
--  Fix: Admin Access & RLS Recursion Prevention
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Helper Function for Admin Check ──────────────────────────
-- Uses SECURITY DEFINER to bypass RLS during the check itself.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'sub_admin')
  ) OR EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Add Admin Bypass to Books ────────────────────────────────
-- Drop and recreate policies with admin bypass
DROP POLICY IF EXISTS "books_select_published" ON public.books;
DROP POLICY IF EXISTS "books_select_vault_approved" ON public.books;

CREATE POLICY "books_admin_all"
ON public.books
FOR ALL
TO authenticated
USING (public.is_admin());

CREATE POLICY "books_select_published"
ON public.books
FOR SELECT
USING (
  is_published = true
  AND is_restricted = false
);

CREATE POLICY "books_select_vault_approved"
ON public.books
FOR SELECT
TO authenticated
USING (
  is_published = true
  AND is_restricted = true
  AND EXISTS (
    SELECT 1 FROM public.vault_access_requests var
    WHERE var.book_id = books.id
      AND var.user_id = auth.uid()
      AND var.status  = 'approved'
  )
);

-- ── 3. Add Admin Bypass to User Profiles ────────────────────────
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_public_profiles" ON public.user_profiles;

CREATE POLICY "user_profiles_admin_all"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin());

CREATE POLICY "user_profiles_select_own"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "user_profiles_update_own"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "user_profiles_insert_own"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_select_public_profiles"
ON public.user_profiles
FOR SELECT
USING (is_public = true);

-- ── 4. Fix RLS for Other Admin Tables ───────────────────────────

-- Admin Profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_profiles_admin_all" ON public.admin_profiles;
CREATE POLICY "admin_profiles_admin_all"
ON public.admin_profiles
FOR ALL
TO authenticated
USING (public.is_admin() OR id = auth.uid());

-- Vault Access Requests
ALTER TABLE public.vault_access_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vault_access_requests_admin_all" ON public.vault_access_requests;
CREATE POLICY "vault_access_requests_admin_all"
ON public.vault_access_requests
FOR ALL
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "vault_access_requests_select_own" ON public.vault_access_requests;
CREATE POLICY "vault_access_requests_select_own"
ON public.vault_access_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "vault_access_requests_insert_own" ON public.vault_access_requests;
CREATE POLICY "vault_access_requests_insert_own"
ON public.vault_access_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Activity Logs (activity_logs)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_logs_admin_all" ON public.activity_logs;
CREATE POLICY "activity_logs_admin_all"
ON public.activity_logs
FOR ALL
TO authenticated
USING (public.is_admin());

-- Book Requests
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "book_requests_admin_all" ON public.book_requests;
CREATE POLICY "book_requests_admin_all"
ON public.book_requests
FOR ALL
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "book_requests_select_own" ON public.book_requests;
CREATE POLICY "book_requests_select_own"
ON public.book_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "book_requests_insert_own" ON public.book_requests;
CREATE POLICY "book_requests_insert_own"
ON public.book_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Book Donations
ALTER TABLE public.book_donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "book_donations_admin_all" ON public.book_donations;
CREATE POLICY "book_donations_admin_all"
ON public.book_donations
FOR ALL
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "book_donations_select_own" ON public.book_donations;
CREATE POLICY "book_donations_select_own"
ON public.book_donations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "book_donations_insert_own" ON public.book_donations;
CREATE POLICY "book_donations_insert_own"
ON public.book_donations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
