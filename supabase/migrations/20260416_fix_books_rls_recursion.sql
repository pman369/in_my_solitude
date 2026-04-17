-- ═══════════════════════════════════════════════════════════════
--  Fix: Infinite RLS recursion between books and user_profiles
-- ═══════════════════════════════════════════════════════════════
-- The existing books SELECT policy calls a function or sub-query
-- that reads user_profiles, but user_profiles' own RLS policy
-- similarly references books (or auth.uid() via a helper that does).
-- This causes infinite recursion for anonymous reads.
--
-- Fix: Replace with simple, direct policies that do NOT cross-reference
-- each other. Public books are readable by anyone. user_profiles are
-- readable by anyone (their own) or by the owning user.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Drop all existing policies on books ──────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'books' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.books', r.policyname);
  END LOOP;
END
$$;

-- ── 2. Re-create clean books policies ───────────────────────────

-- Anyone (including anon) can read published, non-restricted books
CREATE POLICY "books_select_published"
ON public.books
FOR SELECT
USING (
  is_published = true
  AND is_restricted = false
);

-- Authenticated users can also read vault books they have approved access to
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

-- Admins (service role) can read everything — no policy needed,
-- service role bypasses RLS entirely.

-- ── 3. Drop all existing policies on user_profiles ──────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', r.policyname);
  END LOOP;
END
$$;

-- ── 4. Re-create clean user_profiles policies ───────────────────

-- Users can read and update their own profile
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

-- Public profiles are readable by anyone (for future public profile pages)
-- Only if is_public = true. Uses a direct column check — no cross-table join.
CREATE POLICY "user_profiles_select_public_profiles"
ON public.user_profiles
FOR SELECT
USING (is_public = true);

-- ── 5. Ensure RLS is enabled on both tables ──────────────────────
ALTER TABLE public.books          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles  ENABLE ROW LEVEL SECURITY;
