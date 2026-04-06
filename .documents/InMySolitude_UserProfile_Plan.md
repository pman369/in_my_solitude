# 📚 IN MY SOLITUDE — The Library
## User Profile Implementation Plan
**Account Features · Profile Settings · Accessibility**
> Prepared for Antigravity + Gemini CLI execution

---

## ◈ SECTION 0 — OVERVIEW

This document covers everything related to the **reader's identity and experience**
inside the library — from their profile page and account settings, to reading
preferences, vault access history, and full accessibility configuration.

The philosophy: a reader's profile is their **personal corner of the library** —
a quiet, private space that reflects their journey through the archive.

---

## ◈ SECTION 1 — DATABASE SCHEMA EXTENSIONS

### 1.1 — Extended user_profiles Table

```sql
-- Drop and recreate with full fields
-- (or ALTER TABLE if user_profiles already exists)

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS bio               TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url        TEXT,
  ADD COLUMN IF NOT EXISTS location          TEXT,         -- optional, e.g. "Lagos, Nigeria"
  ADD COLUMN IF NOT EXISTS reason_joined     TEXT,         -- onboarding answer
  ADD COLUMN IF NOT EXISTS reading_focus     TEXT[],       -- chosen interest categories
  ADD COLUMN IF NOT EXISTS is_public         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_reading_list BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS theme_preference  TEXT DEFAULT 'dark',   -- 'dark' | 'dim' | 'sepia'
  ADD COLUMN IF NOT EXISTS font_size         TEXT DEFAULT 'medium',  -- 'small' | 'medium' | 'large' | 'xl'
  ADD COLUMN IF NOT EXISTS font_family       TEXT DEFAULT 'serif',   -- 'serif' | 'sans' | 'dyslexic'
  ADD COLUMN IF NOT EXISTS reduce_motion     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS high_contrast     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS line_spacing      TEXT DEFAULT 'normal',  -- 'normal' | 'relaxed' | 'loose'
  ADD COLUMN IF NOT EXISTS books_read_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active       TIMESTAMPTZ DEFAULT NOW();
```

---

### 1.2 — Reading List (Saved Books)

```sql
CREATE TABLE reading_list (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  book_id     UUID REFERENCES books(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'saved',   -- 'saved' | 'reading' | 'completed'
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reading list"
  ON reading_list FOR ALL
  USING (auth.uid() = user_id);
```

---

### 1.3 — Reading Progress

```sql
CREATE TABLE reading_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  book_id       UUID REFERENCES books(id) ON DELETE CASCADE,
  current_page  INTEGER DEFAULT 0,
  total_pages   INTEGER,
  percent       NUMERIC(5,2) DEFAULT 0,   -- e.g. 67.50
  last_read_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reading progress"
  ON reading_progress FOR ALL
  USING (auth.uid() = user_id);
```

---

### 1.4 — Book Notes & Annotations

```sql
CREATE TABLE book_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  book_id     UUID REFERENCES books(id) ON DELETE CASCADE,
  note        TEXT NOT NULL,
  page_ref    INTEGER,           -- optional page number reference
  is_private  BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE book_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes"
  ON book_notes FOR ALL
  USING (auth.uid() = user_id);
```

---

### 1.5 — Notification Preferences

```sql
CREATE TABLE notification_preferences (
  user_id                   UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  vault_request_updates     BOOLEAN DEFAULT TRUE,  -- approved/denied vault request
  book_request_fulfilled    BOOLEAN DEFAULT TRUE,  -- requested book added
  new_books_in_category     BOOLEAN DEFAULT FALSE, -- new book in followed categories
  library_announcements     BOOLEAN DEFAULT TRUE,  -- curator announcements
  donation_status_updates   BOOLEAN DEFAULT TRUE   -- donated book accepted/declined
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);
```

---

### 1.6 — Auto-create Notification Preferences on User Creation

```sql
-- Add to the existing handle_new_user() function:

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'reader'
  );

  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ◈ SECTION 2 — PROFILE PAGE LAYOUT `/profile`

### 2.1 — Page Structure (Four Tab Layout)

```
/profile
│
├── Tab 1: MY SHELF        → Reading list, saved books, progress
├── Tab 2: THE VAULT       → Vault access requests and approved books
├── Tab 3: MY REQUESTS     → Book requests and donations submitted
└── Tab 4: SETTINGS        → Profile, account, accessibility, notifications
```

---

### 2.2 — Profile Header (shown on all tabs)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   [AVATAR]   DISPLAY NAME                                   │
│   (80x80px)  Member since: Jan 2025                         │
│              "What brought me here..." (reason_joined)       │
│                                                              │
│   [ MY SHELF ] [ THE VAULT ] [ MY REQUESTS ] [ SETTINGS ]  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Stats row beneath tabs:
  📚 12 Books Saved  ·  ✅ 3 Completed  ·  🔐 2 Vault Books  ·  📬 1 Request Pending
```

---

### 2.3 — Tab 1: My Shelf

```
[FILTER ROW]
  All  |  Saved  |  Reading  |  Completed

[BOOK CARDS — Reading List]
  Each card shows:
  - Cover thumbnail
  - Title + Author
  - Category badge
  - Status badge: SAVED / READING / COMPLETED
  - Progress bar (if status = 'reading', shows % from reading_progress)
  - Action buttons: [ Continue Reading ] [ Mark Complete ] [ Remove ]

[EMPTY STATE — if no books saved]
  Icon: open book
  "Your shelf is waiting."
  "Browse the open stacks and save books to begin your journey."
  CTA: "Explore the Library" → /library
```

---

### 2.4 — Tab 2: The Vault

```
[APPROVED VAULT BOOKS]
  Header: "Books you have been granted access to"
  Cards: same as reading list cards, with VAULT badge
  If none: "No vault books approved yet."

[PENDING REQUESTS]
  Header: "Awaiting curator review"
  List: Book title · Date requested · Status chip: PENDING
  Each row: "Submitted [X days ago]"

[DENIED REQUESTS]
  Collapsed by default, expandable
  List: Book title · Admin note (if provided)
  CTA per row: "Request again" (opens form pre-filled)

[REQUEST MORE VAULT ACCESS]
  CTA button: "Browse The Vault" → /vault
```

---

### 2.5 — Tab 3: My Requests

```
[BOOK REQUESTS]
  Header: "Books you have requested"
  Table/List:
    - Book title + author
    - Date requested
    - Status: OPEN / FULFILLED / NOTED / DECLINED
    - Admin note (if any)

[BOOK DONATIONS]
  Header: "Books you have donated"
  Table/List:
    - Book title + author
    - Date submitted
    - Status: UNDER REVIEW / ACCEPTED / DECLINED
    - Admin note (if any)
  If accepted: "Now in the library →" link to book page

[EMPTY STATES]
  "No requests yet."
  CTA: "Visit the Request Desk" → /desk
```

---

### 2.6 — Tab 4: Settings (Five Sub-sections)

```
A. Profile Settings
B. Account & Security
C. Reading Preferences
D. Accessibility
E. Notifications
```

---

## ◈ SECTION 3 — SETTINGS IMPLEMENTATION

### 3.1 — A. Profile Settings

**Fields:**
```
Display Name        text input       (required)
Bio                 textarea         (max 300 chars, optional)
Location            text input       (e.g. "Lagos, Nigeria", optional)
Reading Focus       multi-select     (choose up to 5 categories from the 10)
Profile Visibility  toggle           ON = profile visible to curator | OFF = fully private
Show Reading List   toggle           ON = shelf visible if profile is public
```

**Component:**
```tsx
// components/profile/ProfileSettingsForm.tsx

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  'Consciousness & Mind', 'Forbidden & Real History',
  'Spirituality & Mysticism', 'Science & Cosmology',
  'Esoteric & Occult', 'Law & Systems of Control',
  'Psychology & Inner Healing', 'Ancient Civilizations',
  'Technology & Science', 'Philosophy & Creativity',
]

export function ProfileSettingsForm({ profile }: { profile: any }) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    display_name:    profile.display_name ?? '',
    bio:             profile.bio ?? '',
    location:        profile.location ?? '',
    reading_focus:   profile.reading_focus ?? [],
    is_public:       profile.is_public ?? false,
    show_reading_list: profile.show_reading_list ?? true,
  })

  function toggleCategory(cat: string) {
    setForm(prev => ({
      ...prev,
      reading_focus: prev.reading_focus.includes(cat)
        ? prev.reading_focus.filter((c: string) => c !== cat)
        : prev.reading_focus.length < 5
          ? [...prev.reading_focus, cat]
          : prev.reading_focus,
    }))
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('user_profiles')
      .update(form)
      .eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="settings-section">
      <h2>Profile</h2>

      <label>Display Name *</label>
      <input value={form.display_name}
             onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
             required />

      <label>Bio <span>(max 300 characters)</span></label>
      <textarea value={form.bio} maxLength={300}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />

      <label>Location</label>
      <input value={form.location}
             placeholder="e.g. Lagos, Nigeria"
             onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />

      <label>Reading Focus <span>(choose up to 5)</span></label>
      <div className="category-chips">
        {CATEGORIES.map(cat => (
          <button key={cat}
                  className={form.reading_focus.includes(cat) ? 'selected' : ''}
                  onClick={() => toggleCategory(cat)}
                  type="button">
            {cat}
          </button>
        ))}
      </div>

      <label>Profile Visibility</label>
      <Toggle checked={form.is_public}
              onChange={v => setForm(p => ({ ...p, is_public: v }))}
              label="Make my profile visible to the curator" />

      <Toggle checked={form.show_reading_list}
              onChange={v => setForm(p => ({ ...p, show_reading_list: v }))}
              label="Show my reading list on my profile" />

      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Profile'}
      </button>
    </div>
  )
}
```

---

### 3.2 — B. Account & Security

**Fields and Actions:**
```
Email Address        display current · [ Change Email ] button
Password             [ Change Password ] button
Avatar               image upload (Supabase Storage: avatars bucket)
Delete Account       [ Delete My Account ] — destructive, confirmation required
```

**Avatar Upload:**
```tsx
async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `avatars/${userId}.${ext}`

  // Max 2MB, images only
  if (file.size > 2 * 1024 * 1024) throw new Error('Avatar must be under 2MB')

  const { error } = await supabase.storage
    .from('book-covers')   // reuse public bucket, or create avatars bucket
    .upload(path, file, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from('book-covers').getPublicUrl(path)

  await supabase.from('user_profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId)

  return data.publicUrl
}
```

**Change Email:**
```tsx
async function handleEmailChange(newEmail: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  // Supabase sends confirmation to BOTH old and new email
  if (!error) setMessage('Confirmation sent to your new email address.')
}
```

**Change Password:**
```tsx
async function handlePasswordChange(currentPassword: string, newPassword: string) {
  const supabase = createClient()
  // Re-authenticate first for security
  const { data: { user } } = await supabase.auth.getUser()
  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: user!.email!,
    password: currentPassword,
  })
  if (reAuthError) return setError('Current password is incorrect.')

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (!error) setMessage('Password updated successfully.')
}
```

**Delete Account:**
```tsx
// Requires admin Supabase client server-side — never expose service key to browser

// app/api/account/delete/route.ts
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser(
    request.headers.get('Authorization')?.split(' ')[1] ?? ''
  )
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // CASCADE deletes handle user_profiles, reading_list, notes etc
  const { error } = await supabase.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: true })
}
```

---

### 3.3 — C. Reading Preferences

These control the PDF reader and general content presentation.

**Fields:**
```
Font Family       radio buttons:
                    Serif (Georgia)          ← default
                    Sans-serif (Inter)
                    Dyslexia-friendly (OpenDyslexic)

Font Size         slider or radio:
                    Small · Medium · Large · Extra Large

Line Spacing      radio buttons:
                    Normal (1.5) · Relaxed (1.75) · Loose (2.0)

Theme             radio buttons with visual preview:
                    Dark (default) · Dim (dark warm brown) · Sepia (warm paper)
```

**Component:**
```tsx
// components/profile/ReadingPreferencesForm.tsx

export function ReadingPreferencesForm({ profile }: { profile: any }) {
  const supabase = createClient()
  const [prefs, setPrefs] = useState({
    font_family:  profile.font_family  ?? 'serif',
    font_size:    profile.font_size    ?? 'medium',
    line_spacing: profile.line_spacing ?? 'normal',
    theme_preference: profile.theme_preference ?? 'dark',
  })

  // Apply preferences live to the document root for instant preview
  useEffect(() => {
    const root = document.documentElement
    const sizeMap = { small: '14px', medium: '16px', large: '18px', xl: '20px' }
    const spacingMap = { normal: '1.5', relaxed: '1.75', loose: '2.0' }
    const fontMap = {
      serif: 'Playfair Display, Georgia, serif',
      sans: 'Inter, system-ui, sans-serif',
      dyslexic: 'OpenDyslexic, Arial, sans-serif',
    }
    root.style.setProperty('--reading-font-size', sizeMap[prefs.font_size as keyof typeof sizeMap])
    root.style.setProperty('--reading-line-height', spacingMap[prefs.line_spacing as keyof typeof spacingMap])
    root.style.setProperty('--reading-font-family', fontMap[prefs.font_family as keyof typeof fontMap])
  }, [prefs])

  async function savePrefs() {
    await supabase.from('user_profiles').update(prefs).eq('id', profile.id)
  }

  return (
    <div className="settings-section">
      <h2>Reading Preferences</h2>

      {/* LIVE PREVIEW PANEL */}
      <div className="reading-preview" style={{
        fontFamily: 'var(--reading-font-family)',
        fontSize: 'var(--reading-font-size)',
        lineHeight: 'var(--reading-line-height)',
      }}>
        <p>
          "In my solitude I have found myself, and in that finding,
           discovered the entire universe was never elsewhere."
        </p>
      </div>

      <label>Font Family</label>
      <div className="radio-group">
        {[
          { value: 'serif',    label: 'Serif',             preview: 'Ag' },
          { value: 'sans',     label: 'Sans-serif',        preview: 'Ag' },
          { value: 'dyslexic', label: 'Dyslexia-friendly', preview: 'Ag' },
        ].map(opt => (
          <label key={opt.value} className={prefs.font_family === opt.value ? 'selected' : ''}>
            <input type="radio" name="font_family" value={opt.value}
                   checked={prefs.font_family === opt.value}
                   onChange={() => setPrefs(p => ({ ...p, font_family: opt.value }))} />
            <span className="preview">{opt.preview}</span>
            {opt.label}
          </label>
        ))}
      </div>

      <label>Font Size</label>
      <div className="size-slider">
        {['small', 'medium', 'large', 'xl'].map(size => (
          <button key={size}
                  className={prefs.font_size === size ? 'active' : ''}
                  onClick={() => setPrefs(p => ({ ...p, font_size: size }))}>
            {size === 'xl' ? 'XL' : size.charAt(0).toUpperCase() + size.slice(1)}
          </button>
        ))}
      </div>

      <label>Line Spacing</label>
      <div className="radio-group">
        {['normal', 'relaxed', 'loose'].map(sp => (
          <label key={sp} className={prefs.line_spacing === sp ? 'selected' : ''}>
            <input type="radio" name="line_spacing" value={sp}
                   checked={prefs.line_spacing === sp}
                   onChange={() => setPrefs(p => ({ ...p, line_spacing: sp }))} />
            {sp.charAt(0).toUpperCase() + sp.slice(1)}
          </label>
        ))}
      </div>

      <label>Reading Theme</label>
      <div className="theme-swatches">
        {[
          { value: 'dark',  label: 'Dark',  bg: '#0D0D0D', text: '#F0EDE6' },
          { value: 'dim',   label: 'Dim',   bg: '#1A1209', text: '#E8DFC8' },
          { value: 'sepia', label: 'Sepia', bg: '#F5EBCF', text: '#3D2B1F' },
        ].map(theme => (
          <button key={theme.value}
                  className={prefs.theme_preference === theme.value ? 'selected' : ''}
                  style={{ background: theme.bg, color: theme.text }}
                  onClick={() => setPrefs(p => ({ ...p, theme_preference: theme.value }))}>
            {theme.label}
          </button>
        ))}
      </div>

      <button onClick={savePrefs}>Save Reading Preferences</button>
    </div>
  )
}
```

---

### 3.4 — D. Accessibility Settings

These settings persist per user and are applied globally across the library UI.

**Features:**

```
Reduce Motion        toggle
                     OFF = all animations enabled (default)
                     ON  = disables transitions, parallax, fades
                           respects prefers-reduced-motion OS setting too

High Contrast Mode   toggle
                     OFF = standard dark theme
                     ON  = higher contrast text/border ratios
                           gold becomes pure white, muted text becomes brighter

Keyboard Navigation  always enabled (no toggle)
                     focus rings always visible
                     all interactive elements reachable by Tab

Screen Reader Mode   toggle
                     ON  = ensures all images have meaningful aria-labels
                           book cards emit title/author on focus
                           PDF viewer announces page changes

Focus Indicators     radio:
                     Standard · Bold (3px ring) · High Visibility (5px gold ring)

Text Cursor Width    toggle:
                     Standard · Wide (for visibility)
```

**Component:**
```tsx
// components/profile/AccessibilityForm.tsx

export function AccessibilityForm({ profile }: { profile: any }) {
  const supabase = createClient()
  const [a11y, setA11y] = useState({
    reduce_motion:  profile.reduce_motion  ?? false,
    high_contrast:  profile.high_contrast  ?? false,
  })

  // Apply accessibility settings live to document root
  useEffect(() => {
    const root = document.documentElement
    if (a11y.reduce_motion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
    if (a11y.high_contrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
  }, [a11y])

  // Also respect OS-level reduce motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setA11y(prev => ({ ...prev, reduce_motion: true }))
    }
  }, [])

  async function saveA11y() {
    await supabase.from('user_profiles').update(a11y).eq('id', profile.id)
  }

  return (
    <div className="settings-section" role="region" aria-label="Accessibility Settings">
      <h2>Accessibility</h2>
      <p className="section-note">
        These settings apply across the entire library interface.
        Changes take effect immediately and are saved to your account.
      </p>

      <div className="a11y-option">
        <div>
          <label htmlFor="reduce-motion">Reduce Motion</label>
          <p className="description">
            Disables animations, parallax effects, and transitions.
            Also automatically enabled if your device has this set at the OS level.
          </p>
        </div>
        <Toggle
          id="reduce-motion"
          checked={a11y.reduce_motion}
          onChange={v => setA11y(p => ({ ...p, reduce_motion: v }))}
          aria-describedby="reduce-motion-desc"
        />
      </div>

      <div className="a11y-option">
        <div>
          <label htmlFor="high-contrast">High Contrast Mode</label>
          <p className="description">
            Increases contrast between text and backgrounds.
            Particularly helpful for low-vision readers.
          </p>
        </div>
        <Toggle
          id="high-contrast"
          checked={a11y.high_contrast}
          onChange={v => setA11y(p => ({ ...p, high_contrast: v }))}
        />
      </div>

      <div className="a11y-info-box">
        <h3>Always-on Accessibility</h3>
        <ul>
          <li>✓ Full keyboard navigation across all pages</li>
          <li>✓ Visible focus indicators on all interactive elements</li>
          <li>✓ ARIA labels on all book cards, images, and forms</li>
          <li>✓ Screen reader compatible throughout</li>
          <li>✓ Semantic HTML structure on all pages</li>
          <li>✓ Skip-to-content link on every page</li>
          <li>✓ Sufficient colour contrast (WCAG 2.1 AA minimum)</li>
        </ul>
      </div>

      <button onClick={saveA11y}>Save Accessibility Settings</button>
    </div>
  )
}
```

---

### 3.5 — E. Notification Preferences

```tsx
// components/profile/NotificationForm.tsx

export function NotificationForm({ userId }: { userId: string }) {
  const supabase = createClient()
  const [notifs, setNotifs] = useState<any>(null)

  useEffect(() => {
    supabase.from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => setNotifs(data))
  }, [userId])

  async function saveNotifs() {
    await supabase.from('notification_preferences')
      .upsert({ user_id: userId, ...notifs })
  }

  if (!notifs) return <p>Loading...</p>

  const options = [
    {
      key: 'vault_request_updates',
      label: 'Vault Request Updates',
      description: 'When your vault access request is approved or denied.',
    },
    {
      key: 'book_request_fulfilled',
      label: 'Book Requests Fulfilled',
      description: 'When a book you requested is added to the library.',
    },
    {
      key: 'new_books_in_category',
      label: 'New Books in My Categories',
      description: 'When a new book is added in one of my reading focus areas.',
    },
    {
      key: 'library_announcements',
      label: 'Library Announcements',
      description: 'Occasional notes from the curator about the library.',
    },
    {
      key: 'donation_status_updates',
      label: 'Donation Status',
      description: 'When a book you donated is accepted or declined.',
    },
  ]

  return (
    <div className="settings-section">
      <h2>Email Notifications</h2>
      <p className="section-note">
        All emails are sent from the curator. There are no marketing emails,
        no third-party sharing, and you can turn everything off at any time.
      </p>

      {options.map(opt => (
        <div key={opt.key} className="notification-option">
          <div>
            <label>{opt.label}</label>
            <p>{opt.description}</p>
          </div>
          <Toggle
            checked={notifs[opt.key]}
            onChange={v => setNotifs((p: any) => ({ ...p, [opt.key]: v }))}
          />
        </div>
      ))}

      <button onClick={saveNotifs}>Save Notification Preferences</button>
    </div>
  )
}
```

---

## ◈ SECTION 4 — GLOBAL CSS — ACCESSIBILITY CLASSES

These classes are toggled on `<html>` based on user preferences.

```css
/* globals.css */

/* ── REDUCE MOTION ───────────────────────────────────────── */
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

/* Also respect OS-level setting */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── HIGH CONTRAST ───────────────────────────────────────── */
.high-contrast {
  --color-text-primary:   #FFFFFF;
  --color-text-secondary: #DDDDDD;
  --color-border:         #888888;
  --color-accent-gold:    #FFD700;
  --color-bg-secondary:   #0A0A0A;
}

.high-contrast .book-card {
  border: 1px solid var(--color-border);
}

.high-contrast a {
  text-decoration: underline;
}

/* ── FONT SIZES ──────────────────────────────────────────── */
:root {
  --reading-font-size:   16px;
  --reading-line-height: 1.5;
  --reading-font-family: 'Playfair Display', Georgia, serif;
}

/* Applied to book detail and PDF reader */
.reading-content {
  font-size: var(--reading-font-size);
  line-height: var(--reading-line-height);
  font-family: var(--reading-font-family);
}

/* ── FOCUS INDICATORS ────────────────────────────────────── */
/* Always visible — never hidden */
:focus-visible {
  outline: 2px solid var(--color-accent-gold);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

/* ── SKIP TO CONTENT ─────────────────────────────────────── */
.skip-to-content {
  position: absolute;
  top: -100%;
  left: 16px;
  background: var(--color-accent-gold);
  color: var(--color-bg-primary);
  padding: 8px 16px;
  border-radius: 0 0 8px 8px;
  font-weight: bold;
  z-index: 9999;
  transition: top 0.2s;
}

.skip-to-content:focus {
  top: 0;
}

/* ── READING THEMES ──────────────────────────────────────── */
[data-theme="dim"] {
  --color-bg-primary:   #1A1209;
  --color-bg-secondary: #211708;
  --color-text-primary: #E8DFC8;
  --color-accent-gold:  #C9A84C;
}

[data-theme="sepia"] {
  --color-bg-primary:   #F5EBCF;
  --color-bg-secondary: #EDE0C0;
  --color-text-primary: #3D2B1F;
  --color-text-secondary: #6B4F3A;
  --color-accent-gold:  #8B6914;
  --color-border:       #C8AE7D;
}

/* ── DYSLEXIA FONT ───────────────────────────────────────── */
@font-face {
  font-family: 'OpenDyslexic';
  src: url('/fonts/OpenDyslexic-Regular.woff2') format('woff2');
  font-display: swap;
}
```

---

## ◈ SECTION 5 — PREFERENCES LOADER (Layout Level)

Load and apply user preferences at the root layout level on every page,
so the reading theme, font size, and accessibility settings are applied
before anything renders — preventing a flash of unstyled content.

```tsx
// app/layout.tsx

import { createClient } from '@/lib/supabase/server'
import { PreferencesProvider } from '@/components/providers/PreferencesProvider'

export default async function RootLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let preferences = null
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('theme_preference, font_size, font_family, line_spacing, reduce_motion, high_contrast')
      .eq('id', user.id)
      .single()
    preferences = data
  }

  return (
    <html lang="en"
          data-theme={preferences?.theme_preference ?? 'dark'}
          className={[
            preferences?.reduce_motion ? 'reduce-motion' : '',
            preferences?.high_contrast ? 'high-contrast' : '',
          ].join(' ')}>
      <body>
        {/* Skip to content — first element in DOM */}
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <PreferencesProvider initialPrefs={preferences}>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  )
}
```

---

## ◈ SECTION 6 — READING LIST HOOKS

```ts
// lib/hooks/useReadingList.ts

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useReadingList(userId: string) {
  const supabase = createClient()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchList()
  }, [userId])

  async function fetchList() {
    const { data } = await supabase
      .from('reading_list')
      .select(`
        *,
        book:books(id, title, author, cover_url, category_id, is_restricted),
        progress:reading_progress(percent, current_page, total_pages)
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false })
    setList(data ?? [])
    setLoading(false)
  }

  async function saveBook(bookId: string) {
    await supabase.from('reading_list')
      .upsert({ user_id: userId, book_id: bookId, status: 'saved' })
    await fetchList()
  }

  async function updateStatus(bookId: string, status: 'saved' | 'reading' | 'completed') {
    await supabase.from('reading_list')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('book_id', bookId)
    await fetchList()
  }

  async function removeBook(bookId: string) {
    await supabase.from('reading_list')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId)
    await fetchList()
  }

  async function updateProgress(bookId: string, currentPage: number, totalPages: number) {
    const percent = Math.round((currentPage / totalPages) * 100 * 100) / 100
    await supabase.from('reading_progress')
      .upsert({
        user_id: userId,
        book_id: bookId,
        current_page: currentPage,
        total_pages: totalPages,
        percent,
        last_read_at: new Date().toISOString(),
      })
    // Auto-update status to 'reading' when progress logged
    if (percent < 100) await updateStatus(bookId, 'reading')
    else await updateStatus(bookId, 'completed')
  }

  const saved     = list.filter(i => i.status === 'saved')
  const reading   = list.filter(i => i.status === 'reading')
  const completed = list.filter(i => i.status === 'completed')

  return { list, saved, reading, completed, loading,
           saveBook, updateStatus, removeBook, updateProgress }
}
```

---

## ◈ SECTION 7 — BOOK NOTES COMPONENT

```tsx
// components/books/BookNotes.tsx

'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function BookNotes({ bookId, userId }: { bookId: string; userId: string }) {
  const supabase = createClient()
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const [pageRef, setPageRef] = useState('')

  useEffect(() => { fetchNotes() }, [bookId])

  async function fetchNotes() {
    const { data } = await supabase
      .from('book_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })
    setNotes(data ?? [])
  }

  async function addNote() {
    if (!newNote.trim()) return
    await supabase.from('book_notes').insert({
      user_id: userId,
      book_id: bookId,
      note: newNote,
      page_ref: pageRef ? parseInt(pageRef) : null,
    })
    setNewNote('')
    setPageRef('')
    await fetchNotes()
  }

  async function deleteNote(id: string) {
    await supabase.from('book_notes').delete().eq('id', id)
    await fetchNotes()
  }

  return (
    <div className="book-notes" aria-label="Your notes for this book">
      <h3>My Notes</h3>

      <div className="add-note">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Write a note, reflection, or quote..."
          aria-label="New note"
          rows={3}
        />
        <input
          value={pageRef}
          onChange={e => setPageRef(e.target.value)}
          placeholder="Page (optional)"
          type="number"
          aria-label="Page reference"
          style={{ width: '100px' }}
        />
        <button onClick={addNote} disabled={!newNote.trim()}>
          Add Note
        </button>
      </div>

      <ul className="notes-list">
        {notes.map(note => (
          <li key={note.id}>
            {note.page_ref && (
              <span className="page-ref">p. {note.page_ref}</span>
            )}
            <p>{note.note}</p>
            <span className="note-date">
              {new Date(note.created_at).toLocaleDateString()}
            </span>
            <button onClick={() => deleteNote(note.id)}
                    aria-label="Delete note">×</button>
          </li>
        ))}
        {notes.length === 0 && (
          <p className="empty">No notes yet. Begin your annotations.</p>
        )}
      </ul>
    </div>
  )
}
```

---

## ◈ SECTION 8 — ARIA & SEMANTIC HTML STANDARDS

Apply consistently across the entire library:

```tsx
// Every book card must include:
<article
  role="article"
  aria-label={`${book.title} by ${book.author}`}
>
  <img src={book.cover_url} alt={`Cover of ${book.title}`} loading="lazy" />
  <h3>{book.title}</h3>
  <p aria-label="Author">{book.author}</p>
  <p aria-label="Description">{book.description}</p>
  {book.is_restricted && (
    <span aria-label="This book is in the restricted vault section">
      VAULT
    </span>
  )}
  <button aria-label={`Save ${book.title} to your reading list`}>
    Save
  </button>
  <button aria-label={`Read ${book.title}`}>
    Read
  </button>
</article>

// Navigation landmarks:
<header role="banner">...</header>
<nav aria-label="Main navigation">...</nav>
<main id="main-content" role="main">...</main>
<aside aria-label="Filters">...</aside>
<footer role="contentinfo">...</footer>

// Live region for async feedback (e.g. after saving settings):
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

---

## ◈ SECTION 9 — AVATARS STORAGE BUCKET

```sql
-- Add avatars bucket to storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152,   -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Users can upload/update their own avatar only
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can view avatars (they are public)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

---

## ◈ SECTION 10 — ANTIGRAVITY EXECUTION CHECKLIST

### Database
- [ ] Run ALTER TABLE user_profiles with all new columns
- [ ] Create reading_list table + RLS
- [ ] Create reading_progress table + RLS
- [ ] Create book_notes table + RLS
- [ ] Create notification_preferences table + RLS
- [ ] Update handle_new_user() trigger to auto-create notification_preferences
- [ ] Create avatars storage bucket + policies

### Profile Page
- [ ] Build /profile route with 4-tab layout
- [ ] Build profile header component with stats row
- [ ] Build Tab 1: My Shelf (reading list with status and progress)
- [ ] Build Tab 2: The Vault (approved books + request history)
- [ ] Build Tab 3: My Requests (book requests + donations)
- [ ] Build Tab 4: Settings (5 sub-sections)

### Settings
- [ ] Build ProfileSettingsForm (name, bio, location, categories, visibility)
- [ ] Build AccountSecurityForm (email change, password change, avatar upload, delete account)
- [ ] Build ReadingPreferencesForm (font, size, spacing, theme) with live preview
- [ ] Build AccessibilityForm (reduce motion, high contrast) with live DOM application
- [ ] Build NotificationForm (5 toggle options)
- [ ] Wire all forms to Supabase update queries
- [ ] Implement delete account API route (server-side, admin client)

### Accessibility
- [ ] Add skip-to-content link in root layout (first DOM element)
- [ ] Add all CSS accessibility classes to globals.css
- [ ] Add data-theme to <html> from user preferences in layout.tsx
- [ ] Add reduce-motion and high-contrast classes to <html> in layout.tsx
- [ ] Audit all book cards for ARIA labels
- [ ] Audit all forms for label associations
- [ ] Audit navigation for landmark roles
- [ ] Add aria-live region for async feedback messages
- [ ] Download and host OpenDyslexic font in /public/fonts/
- [ ] Add prefers-reduced-motion media query to globals.css
- [ ] Verify all focusable elements have visible focus rings
- [ ] Test keyboard-only navigation across all pages

### Hooks & Utilities
- [ ] Build useReadingList hook
- [ ] Build BookNotes component
- [ ] Build PreferencesProvider context
- [ ] Wire preferences loader into root layout.tsx
- [ ] Apply reading preferences (font/size/spacing) to book detail and PDF reader pages

---

*"A library is not just a place of books — it is a place of becoming."*
— The Curator

---
**Document Version:** 1.0
**Scope:** User Profile · Account Features · Reading Preferences · Accessibility
**Builder:** Antigravity | **Assistant:** Gemini CLI | **Backend:** Supabase
