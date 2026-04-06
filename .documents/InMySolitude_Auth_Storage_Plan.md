# 📚 IN MY SOLITUDE — The Library
## Auth & Storage Implementation Plan
**Supabase · Email/Password · Magic Link · Storage Buckets**
> Prepared for Antigravity + Gemini CLI execution

---

## ◈ PART 1 — AUTHENTICATION

### Strategy Overview

| Method        | Use Case                                      | Enabled |
|---------------|-----------------------------------------------|---------|
| Email + Password | Standard registration and login            | ✅ Yes  |
| Magic Link    | Passwordless login via email link             | ✅ Yes  |
| Google OAuth  | —                                             | ❌ No   |
| Phone / SMS   | —                                             | ❌ No   |

Both methods share the same user record in `auth.users`.
A user registered via email/password can also use magic link — same account, same email.

---

## ◈ PART 2 — SUPABASE AUTH CONFIGURATION

### 2.1 — Supabase Dashboard Settings
In the Supabase dashboard, navigate to **Authentication → Providers** and apply:

```
Email Provider:          ENABLED
Confirm Email:           ENABLED  (user must verify email before access)
Secure Email Change:     ENABLED
Magic Link:              ENABLED
Double Confirm Changes:  ENABLED
Minimum Password Length: 8 characters
```

### 2.2 — Email Templates (Supabase Dashboard → Auth → Email Templates)

Customize each template to match the library's dark, literary tone.

---

**Template 1 — Confirm Signup**
```
Subject: "Your key to the library — please verify your email"

Body:
---
Welcome to In My Solitude — The Library.

Before you can enter, we need to confirm this is you.

[ Confirm My Email ] ← button linking to {{ .ConfirmationURL }}

If you did not register for this library, you can safely ignore this email.

— The Curator
Built in solitude. Offered freely.
---
```

**Template 2 — Magic Link Login**
```
Subject: "Your entry to the library — one-time login link"

Body:
---
You requested a link to sign in to In My Solitude — The Library.

This link expires in 1 hour and can only be used once.

[ Enter the Library ] ← button linking to {{ .MagicLink }}

If you did not request this, ignore this email.

— The Curator
---
```

**Template 3 — Password Reset**
```
Subject: "Reset your library access password"

Body:
---
A password reset was requested for your account at
In My Solitude — The Library.

[ Reset My Password ] ← button linking to {{ .ConfirmationURL }}

This link expires in 1 hour. If you did not request this, ignore this email.

— The Curator
---
```

**Template 4 — Email Change Confirmation**
```
Subject: "Confirm your new email address"

Body:
---
You requested to update your email address at In My Solitude.

[ Confirm New Email ] ← button linking to {{ .ConfirmationURL }}

— The Curator
---
```

---

### 2.3 — Redirect URLs (Supabase Dashboard → Auth → URL Configuration)

```
Site URL:
  https://your-production-domain.vercel.app

Additional Redirect URLs:
  http://localhost:3000/**
  https://your-production-domain.vercel.app/**
  https://*-your-vercel-project.vercel.app/**   ← covers preview deploys
```

---

## ◈ PART 3 — DATABASE: USER PROFILES TABLE

When a user registers, Supabase creates a record in `auth.users`.
We extend this with a `user_profiles` table that holds app-specific data.

### 3.1 — Table Definition

```sql
CREATE TABLE user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  role            TEXT NOT NULL DEFAULT 'reader',  -- 'reader' | 'admin'
  reason_joined   TEXT,          -- onboarding question answer
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.2 — Auto-Create Profile on Signup

This database function runs automatically every time a new user registers,
creating their profile record without any extra API call needed.

```sql
-- Function that fires on new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'reader'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires after every new row in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 3.3 — Row Level Security on user_profiles

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "Admin can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## ◈ PART 4 — AUTH PAGES (Next.js Implementation)

### 4.1 — Register Page `/auth/register`

**Flow:**
```
1. User enters: Display Name · Email · Password (min 8 chars)
2. Onboarding question: "What brings you to this library?" (textarea, optional)
3. On submit → supabase.auth.signUp({ email, password, options: { data: { display_name } } })
4. Show confirmation screen: "Check your inbox — we sent you a key."
5. User clicks email link → redirected to /auth/confirm (handled by Supabase)
6. After confirmation → redirected to /library
7. Supabase trigger auto-creates user_profiles record
8. reason_joined is saved via a separate upsert after signup confirmation
```

**Component structure:**
```tsx
// app/(auth)/register/page.tsx

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const displayName = (form.elements.namedItem('display_name') as HTMLInputElement).value
    const reasonJoined = (form.elements.namedItem('reason_joined') as HTMLTextAreaElement).value

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: displayName,
          reason_joined: reasonJoined,
        },
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setStep('confirm')
    }

    setLoading(false)
  }

  if (step === 'confirm') {
    return (
      <div>
        <h1>Check your inbox</h1>
        <p>We sent a confirmation link to your email.
           Click it to unlock the library.</p>
        <p>Didn't receive it? Check your spam folder.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleRegister}>
      <input name="display_name" placeholder="Your name" required />
      <input name="email" type="email" placeholder="Email address" required />
      <input name="password" type="password" placeholder="Password (min 8 chars)"
             minLength={8} required />
      <textarea name="reason_joined"
                placeholder="What brings you to this library? (optional)" />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Opening the gates...' : 'Join the Library'}
      </button>
    </form>
  )
}
```

---

### 4.2 — Login Page `/auth/login`

**Two modes on the same page: Password Login + Magic Link**

```tsx
// app/(auth)/login/page.tsx

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type LoginMode = 'password' | 'magic-link'

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('password')
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // --- Password Login ---
  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/library')
    }

    setLoading(false)
  }

  // --- Magic Link ---
  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMagicSent(true)
    }

    setLoading(false)
  }

  if (magicSent) {
    return (
      <div>
        <h2>Your key has been sent.</h2>
        <p>Check your inbox for a one-time login link.
           It expires in 1 hour.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Mode Toggle */}
      <div>
        <button onClick={() => setMode('password')}
                className={mode === 'password' ? 'active' : ''}>
          Password
        </button>
        <button onClick={() => setMode('magic-link')}
                className={mode === 'magic-link' ? 'active' : ''}>
          Magic Link
        </button>
      </div>

      {/* Password Form */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin}>
          <input name="email" type="email" placeholder="Email address" required />
          <input name="password" type="password" placeholder="Password" required />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Entering...' : 'Enter the Library'}
          </button>
          <a href="/auth/reset-password">Forgot password?</a>
        </form>
      )}

      {/* Magic Link Form */}
      {mode === 'magic-link' && (
        <form onSubmit={handleMagicLink}>
          <input name="email" type="email" placeholder="Email address" required />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send My Login Link'}
          </button>
        </form>
      )}

      <p>No account? <a href="/auth/register">Join the library</a></p>
    </div>
  )
}
```

---

### 4.3 — Auth Callback Route `/auth/callback`

This route handles the redirect after a user clicks any email link
(confirmation, magic link, password reset).

```tsx
// app/auth/callback/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/library'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If something went wrong, redirect to login with error param
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
```

---

### 4.4 — Password Reset Flow

**Step 1 — Request Reset `/auth/reset-password`**
```tsx
async function handleResetRequest(email: string) {
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  })
  // Always show "check your email" — never confirm whether email exists (security)
  setConfirmed(true)
}
```

**Step 2 — Update Password `/auth/update-password`**
```tsx
// User arrives here after clicking reset link in email
// Supabase session is already set at this point

async function handlePasswordUpdate(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (!error) router.push('/library')
}
```

---

### 4.5 — Auth State + Session Management

**Supabase client setup:**
```ts
// lib/supabase/client.ts  (browser)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```ts
// lib/supabase/server.ts  (SSR / server components)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

**Middleware — session refresh on every request:**
```ts
// middleware.ts  (project root)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Refresh session — keeps user logged in across tabs/refreshes
  const { data: { user } } = await supabase.auth.getUser()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect profile route
  if (request.nextUrl.pathname.startsWith('/profile') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/auth/callback'],
}
```

---

### 4.6 — Auth Hook (client-side user access)

```ts
// lib/hooks/useUser.ts

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id)
      else setLoading(false)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, profile, loading, signOut, isAdmin: profile?.role === 'admin' }
}
```

---

## ◈ PART 5 — SUPABASE STORAGE

### 5.1 — Bucket Architecture

```
Supabase Storage
│
├── book-covers/          ← PUBLIC  — cover images, accessible by anyone
├── book-files/           ← PRIVATE — open stack PDFs, signed URL access
├── vault-files/          ← PRIVATE — restricted PDFs, approved users only
└── donations-inbox/      ← PRIVATE — user PDF uploads, admin review only
```

---

### 5.2 — Bucket Creation SQL

```sql
-- Run in Supabase SQL Editor

-- 1. Public bucket for book covers (images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-covers',
  'book-covers',
  TRUE,                          -- public: no auth needed to view
  5242880,                       -- 5MB max per file
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
);

-- 2. Private bucket for open stack PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-files',
  'book-files',
  FALSE,                         -- private: requires signed URL
  104857600,                     -- 100MB max per file
  ARRAY['application/pdf']
);

-- 3. Private bucket for vault (restricted) PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault-files',
  'vault-files',
  FALSE,
  104857600,
  ARRAY['application/pdf']
);

-- 4. Private bucket for user-donated PDFs (pending review)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donations-inbox',
  'donations-inbox',
  FALSE,
  104857600,
  ARRAY['application/pdf']
);
```

---

### 5.3 — Storage RLS Policies

```sql
-- ============================================================
-- BUCKET: book-covers (PUBLIC)
-- Anyone can view. Only admin can upload/delete.
-- ============================================================

CREATE POLICY "Anyone can view book covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

CREATE POLICY "Admin can upload book covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'book-covers' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete book covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'book-covers' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- BUCKET: book-files (PRIVATE — open stack PDFs)
-- Authenticated users can read. Only admin can upload/delete.
-- PDFs served via signed URLs generated server-side.
-- ============================================================

CREATE POLICY "Authenticated users can read open books"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'book-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Admin can upload open book files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'book-files' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete open book files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'book-files' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- BUCKET: vault-files (PRIVATE — restricted PDFs)
-- Only users with an approved vault_access_request can read.
-- Only admin can upload/delete.
-- ============================================================

CREATE POLICY "Approved users can read vault files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vault-files' AND
    EXISTS (
      SELECT 1
      FROM vault_access_requests var
      JOIN books b ON b.id = var.book_id
      WHERE var.user_id = auth.uid()
        AND var.status = 'approved'
        AND b.file_url LIKE '%' || storage.objects.name
    )
  );

CREATE POLICY "Admin can upload vault files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vault-files' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete vault files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vault-files' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- BUCKET: donations-inbox (PRIVATE)
-- Authenticated users can upload their own donations.
-- Only admin can read/delete.
-- ============================================================

CREATE POLICY "Authenticated users can upload donations"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'donations-inbox' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Admin can read donations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'donations-inbox' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete donations"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'donations-inbox' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### 5.4 — Signed URL Generation (Server-Side)

Never expose raw storage paths to the client.
Always generate short-lived signed URLs server-side.

```ts
// app/api/storage/signed-url/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bucket, path, bookId } = await request.json()

  // For vault files — verify the user has approved access to this specific book
  if (bucket === 'vault-files') {
    const { data: access } = await supabase
      .from('vault_access_requests')
      .select('status')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .eq('status', 'approved')
      .single()

    if (!access) {
      return NextResponse.json({ error: 'Access not granted' }, { status: 403 })
    }
  }

  // Generate signed URL — expires in 1 hour (3600 seconds)
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600)

  if (error || !data) {
    return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
```

**Client usage:**
```ts
// lib/utils/signed-url.ts

export async function getBookUrl(bucket: string, path: string, bookId?: string) {
  const res = await fetch('/api/storage/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, path, bookId }),
  })
  const { url, error } = await res.json()
  if (error) throw new Error(error)
  return url
}
```

---

### 5.5 — File Upload Patterns (Admin)

**Uploading a book cover:**
```ts
async function uploadCover(file: File, bookId: string) {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `covers/${bookId}.${ext}`

  const { error } = await supabase.storage
    .from('book-covers')
    .upload(path, file, { upsert: true })

  if (error) throw error

  // Get the public URL (this bucket is public)
  const { data } = supabase.storage.from('book-covers').getPublicUrl(path)
  return data.publicUrl  // Store this in books.cover_url
}
```

**Uploading a book PDF:**
```ts
async function uploadBookPdf(
  file: File,
  bookId: string,
  isRestricted: boolean
) {
  const supabase = createClient()
  const bucket = isRestricted ? 'vault-files' : 'book-files'
  const path = `${bookId}.pdf`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: 'application/pdf',
    })

  if (error) throw error

  // Store the path (not a full URL) in books.file_url
  // Full URL is always generated server-side on demand
  return path
}
```

**Uploading a user donation:**
```ts
async function uploadDonation(file: File, userId: string, donationId: string) {
  const supabase = createClient()
  const path = `${userId}/${donationId}.pdf`

  const { error } = await supabase.storage
    .from('donations-inbox')
    .upload(path, file, { contentType: 'application/pdf' })

  if (error) throw error
  return path  // Store in book_donations.file_url
}
```

---

## ◈ PART 6 — EDGE FUNCTION: NEW USER WELCOME EMAIL

When a new user confirms their email and their profile is created,
send a welcome email via Resend.

```ts
// supabase/functions/on-new-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { record } = await req.json()  // user_profiles INSERT event

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'The Curator <curator@inmysolitude.com>',
      to: record.email,
      subject: 'You are now inside the library.',
      html: `
        <div style="background:#0D0D0D;color:#F0EDE6;padding:40px;font-family:Georgia,serif;">
          <h1 style="color:#C9A84C;">Welcome to In My Solitude.</h1>
          <p>The library is open to you.</p>
          <p>Explore the open stacks freely. When you feel ready,
             you may request access to The Vault.</p>
          <p>If there is a book you seek that is not here,
             bring your request to the <strong>Request Desk</strong>.</p>
          <br/>
          <p style="color:#9A9088;font-style:italic;">
            "Knowledge kept in the dark finds its light in solitude."
          </p>
          <br/>
          <p>— The Curator</p>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Register this function as a Supabase Database Webhook:**
```
Table:  user_profiles
Event:  INSERT
URL:    https://<your-project-ref>.supabase.co/functions/v1/on-new-user
```

---

## ◈ PART 7 — ENVIRONMENT VARIABLES

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-side only, never expose

# Email
RESEND_API_KEY=re_your_resend_key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000         # change to prod URL on Vercel
ADMIN_EMAIL=your-admin-email@example.com
```

---

## ◈ PART 8 — ANTIGRAVITY EXECUTION CHECKLIST

### Auth Setup
- [ ] Configure Supabase Auth: enable email/password + magic link
- [ ] Disable all OAuth providers (Google, GitHub, etc.)
- [ ] Set minimum password length to 8
- [ ] Enable email confirmation requirement
- [ ] Customize all 4 email templates (Confirm, Magic Link, Reset, Change)
- [ ] Set Site URL and redirect URLs in Supabase dashboard
- [ ] Run `user_profiles` table migration
- [ ] Run `handle_new_user` trigger migration
- [ ] Apply RLS policies to `user_profiles`
- [ ] Set up middleware.ts for session refresh + admin route protection
- [ ] Build `/auth/register` page with display name + onboarding question
- [ ] Build `/auth/login` page with password/magic link toggle
- [ ] Build `/auth/callback` route handler
- [ ] Build `/auth/reset-password` page (request reset)
- [ ] Build `/auth/update-password` page (set new password)
- [ ] Implement `useUser` hook
- [ ] Wire logout button in Navbar

### Storage Setup
- [ ] Create all 4 buckets via SQL (covers, book-files, vault-files, donations-inbox)
- [ ] Apply all storage RLS policies
- [ ] Build `/api/storage/signed-url` API route
- [ ] Implement `getBookUrl` utility function
- [ ] Implement `uploadCover` function (admin book manager)
- [ ] Implement `uploadBookPdf` function (admin book manager)
- [ ] Implement `uploadDonation` function (request desk form)
- [ ] Wire up PDF viewer to use signed URLs
- [ ] Deploy `on-new-user` Edge Function + register as DB webhook
- [ ] Test full flow: register → confirm email → welcome email → login → download book

---

*"Access freely given. Knowledge freely shared."*
— The Curator

---
**Document Version:** 1.0
**Scope:** Authentication + Storage only
**Auth Methods:** Email/Password · Magic Link (no OAuth)
**Builder:** Antigravity | **Assistant:** Gemini CLI | **Backend:** Supabase
