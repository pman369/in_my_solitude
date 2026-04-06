# 📚 IN MY SOLITUDE — The Library
### A Free Archive of Awakening Knowledge
**Complete Project Blueprint — Built by Antigravity | Assisted by Gemini CLI**

> *"Not all those who wander are lost. Some are in solitude, searching for the books that set them free."*

---

## ◈ SECTION 0 — HOW TO USE THIS PLAN

This document is the **master brief** handed to Antigravity (the autonomous agentic IDE)
for end-to-end construction of the library platform. Gemini CLI assists with code
generation, review, and scaffolding throughout the build process.

**Execution Order for Antigravity:**
1. Initialize Next.js project + Tailwind + Shadcn/UI
2. Configure Supabase (schema, auth, storage buckets)
3. Build layout system and design tokens
4. Build pages in order: Landing → Library → Vault → Request Desk → Admin
5. Wire up Supabase Edge Functions
6. Configure Vercel deployment pipeline
7. Seed initial book data
8. Final QA pass + accessibility audit

---

## ◈ SECTION 1 — PROJECT VISION & MANIFESTO

### The Soul of This Library

This is not a typical digital library. It was born in **solitude** — assembled
book by book during a profound personal journey through the dark night of the soul.
Every title in this archive played a role in one person's path toward consciousness,
clarity, and liberation from mass mental conditioning.

The library answers three sacred questions:

---

### WHY THIS LIBRARY EXISTS
Knowledge has always been the first thing the powerful seek to control.
Entire categories of human understanding — real history, consciousness science,
esoteric traditions, suppressed archaeology — have been buried, ridiculed,
or locked behind paywalls and institutional gatekeeping.

This library exists as an act of resistance and generosity.
Not for profit. Not for prestige. For freedom.

---

### WHAT IS IN THIS LIBRARY
A living, growing archive across disciplines that mainstream academia rarely
touches honestly:

- The real story of human history and ancient civilizations
- The science of consciousness and the nature of mind
- Esoteric, mystical, and spiritual traditions from across cultures
- Suppressed and forbidden knowledge — the books they don't want you reading
- Physics, cosmology, and the deeper nature of reality
- Law, rights, and the hidden architecture of systems of control
- Psychology of awakening, healing, and breaking free from conditioning

---

### HOW IT WORKS
Built by one person. Free for all. No ads. No algorithms.
No gatekeeper deciding what you are "ready" to know.

Certain books are held in **The Vault** — a restricted section for highly
sensitive materials. Access is granted by the curator personally, after
a brief review of the reader's intent and readiness. This is not censorship —
it is curation with care.

The library grows with the community. You can request books. You can donate books.
You can simply read, in solitude, and find your own way home.

---

## ◈ SECTION 2 — TECH STACK

| Layer              | Tool                        | Role                                              | Tier  |
|--------------------|-----------------------------|---------------------------------------------------|-------|
| Agentic IDE        | Antigravity (Google)        | Autonomous project builder & developer            | —     |
| AI Dev Assistant   | Gemini CLI                  | Code generation, review, refactoring              | Free  |
| Frontend Framework | Next.js 14 (App Router)     | SSR, routing, API routes, performance             | Free  |
| Frontend Hosting   | Vercel                      | Auto-deploy from GitHub, CDN, previews            | Free  |
| Database + Auth    | Supabase                    | PostgreSQL, Row-Level Security, Auth              | Free  |
| File Storage       | Supabase Storage            | Book PDFs, cover images, user uploads             | Free  |
| Edge Functions     | Supabase Edge Functions     | Access request logic, email triggers              | Free  |
| Email Service      | Resend                      | Admin notifications, user confirmations           | Free  |
| Styling            | Tailwind CSS + Shadcn/UI    | Utility-first design system, accessible UI        | Free  |
| Animations         | Framer Motion               | Page transitions, atmospheric effects             | Free  |
| Icons              | Lucide React                | Consistent icon library                           | Free  |
| Search             | Supabase Full-Text Search   | Native PostgreSQL FTS, no extra service needed    | Free  |

---

## ◈ SECTION 3 — COMPLETE SITE MAP

```
/                           → Landing Page (Manifesto + Portal Entry)
│
├── /library                → Open Stacks (all freely accessible books)
│   ├── /library/search     → Full-text search results
│   └── /library/[category] → Category-filtered book stacks
│
├── /book/[id]              → Individual Book Page (details, read, download)
│
├── /vault                  → The Vault — Restricted Section (blurred, locked)
│   └── /vault/request/[id] → Access Request Form for a specific vault book
│
├── /desk                   → The Request Desk
│   ├── Book Request        → User asks for a book not in the library
│   └── Book Donation       → User donates/submits a book to the archive
│
├── /about                  → Full Manifesto + Curator's Letter
│
├── /auth
│   ├── /auth/login         → Sign in (Magic Link + Google OAuth)
│   └── /auth/register      → Register with onboarding question
│
├── /profile                → User profile, approved vault books, request history
│
└── /admin                  → Admin Dashboard (curator-only, private route)
    ├── /admin/vault        → Vault access request review queue
    ├── /admin/books        → Add / edit / remove books
    ├── /admin/donations    → Review submitted book donations
    └── /admin/requests     → Review book requests from users
```

---

## ◈ SECTION 4 — DATABASE SCHEMA (Supabase / PostgreSQL)

```sql
-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  color       TEXT,
  sort_order  INTEGER DEFAULT 0
);

-- ============================================================
-- BOOKS
-- ============================================================
CREATE TABLE books (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  author          TEXT,
  category_id     UUID REFERENCES categories(id),
  description     TEXT,
  cover_url       TEXT,
  file_url        TEXT,
  is_restricted   BOOLEAN DEFAULT FALSE,
  tags            TEXT[],
  added_date      DATE DEFAULT CURRENT_DATE,
  curator_note    TEXT,
  views           INTEGER DEFAULT 0,
  downloads       INTEGER DEFAULT 0,
  is_published    BOOLEAN DEFAULT TRUE
);

-- Full-text search index
CREATE INDEX books_fts_idx ON books
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(author,'') || ' ' || COALESCE(description,'')));

-- ============================================================
-- USER PROFILES (extends Supabase Auth)
-- ============================================================
CREATE TABLE user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  avatar_url      TEXT,
  role            TEXT DEFAULT 'reader',
  reason_joined   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VAULT ACCESS REQUESTS
-- ============================================================
CREATE TABLE vault_access_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  book_id         UUID REFERENCES books(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  background      TEXT,
  status          TEXT DEFAULT 'pending',
  admin_note      TEXT,
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  UNIQUE(user_id, book_id)
);

-- ============================================================
-- BOOK REQUESTS (users asking for books not in library)
-- ============================================================
CREATE TABLE book_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  book_title      TEXT NOT NULL,
  book_author     TEXT,
  why_needed      TEXT,
  status          TEXT DEFAULT 'open',
  admin_note      TEXT,
  requested_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOOK DONATIONS
-- ============================================================
CREATE TABLE book_donations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  book_title          TEXT NOT NULL,
  book_author         TEXT,
  file_url            TEXT,
  notes               TEXT,
  suggested_category  TEXT,
  status              TEXT DEFAULT 'under_review',
  submitted_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Public: freely accessible published books
CREATE POLICY "Public books visible to all"
  ON books FOR SELECT
  USING (is_published = TRUE AND is_restricted = FALSE);

-- Vault: restricted books only for approved users
CREATE POLICY "Restricted books for approved users"
  ON books FOR SELECT
  USING (
    is_restricted = TRUE AND
    EXISTS (
      SELECT 1 FROM vault_access_requests
      WHERE vault_access_requests.book_id = books.id
        AND vault_access_requests.user_id = auth.uid()
        AND vault_access_requests.status = 'approved'
    )
  );

-- Admin: full access
CREATE POLICY "Admin full access"
  ON books FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## ◈ SECTION 5 — BOOK CATEGORIES

| # | Category Name              | Slug              | Icon | Color   |
|---|---------------------------|-------------------|------|---------|
| 1 | Consciousness & Mind      | consciousness     | 🧠   | #4F46E5 |
| 2 | Forbidden & Real History  | forbidden-history | 🏛️   | #B45309 |
| 3 | Spirituality & Mysticism  | spirituality      | 🔮   | #7C3AED |
| 4 | Science & Cosmology       | science           | 🌌   | #1D4ED8 |
| 5 | Esoteric & Occult         | esoteric          | 🜂    | #991B1B |
| 6 | Law & Systems of Control  | law               | ⚖️   | #374151 |
| 7 | Psychology & Inner Healing| psychology        | 🌿   | #065F46 |
| 8 | Ancient Civilizations     | ancient           | 𓂀    | #92400E |
| 9 | Technology & Science      | technology        | ⚙️   | #0E7490 |
| 10| Philosophy & Creativity   | philosophy        | ✍️   | #4B5563 |

---

## ◈ SECTION 6 — PAGE-BY-PAGE DESIGN SPEC

---

### PAGE 1 — Landing Page `/`

**Atmosphere:** Dark, ethereal, literary. Candlelit library meets cosmic awareness.

**Design Language:**
- Background: Very dark charcoal (#0D0D0D) with subtle paper/starfield texture
- Headings: Playfair Display (serif), gold (#C9A84C)
- Body: Inter (sans-serif), warm off-white (#F0EDE6)
- Accents: Gold + Violet. Vault sections: deep crimson.
- Motion: Slow fade-ins, parallax, subtle atmospheric particles

**Sections:**
```
[HERO — Full Screen]
  "IN MY SOLITUDE" (large serif, gold)
  "The Library" (small caps, letter-spaced)
  Tagline: "Knowledge kept in the dark finds its light in solitude."
  CTA: "Enter the Library" → /library
  Link: "About this place" → /about

[THE THREE TRUTHS — Scroll Sections]
  WHY  — The Manifesto (why this was built)
  WHAT — The Archive (what lives here)
  HOW  — The Rules of the House

[LIVING NUMBERS]
  Animated: "312 Books · 10 Disciplines · 0 Paywalls · 1 Curator"

[CATEGORY PORTAL]
  Grid of category cards with icon, name, book count, color glow on hover

[THE VAULT TEASER]
  "Some knowledge requires more than curiosity."
  Blurred book covers in dark background
  CTA: "Enter the Vault" → /vault

[REQUEST DESK TEASER]
  "Can't find what you're searching for? This library grows with you."
  Two CTAs: "Request a Book" | "Donate a Book" → /desk

[FOOTER]
  "Built in solitude. Offered freely."
  Links: Library · Vault · Request Desk · About
  No ads. No tracking. No social media (unless curator chooses).
```

---

### PAGE 2 — Library `/library`

```
[SEARCH BAR]
  Full-width, prominent. FTS via Supabase.
  Placeholder: "Search by title, author, subject, keyword..."

[FILTER BAR]
  Category pills (horizontal scroll on mobile)
  Tags dropdown
  Sort: Newest · Most Read · A–Z

[CURATOR'S PICKS SHELF]
  Horizontal scroll of 4–6 hand-picked books

[BOOK GRID]
  4 cols desktop / 2 tablet / 1 mobile
  Card: Cover · Title · Author · Category badge · Short blurb
  Hover: "Read" and "Download" buttons appear
  Download requires login (soft gate with prompt)

[PAGINATION]
  Load More button
```

---

### PAGE 3 — Book Detail `/book/[id]`

```
[BOOK HERO]
  Cover image + Title, Author, Category, Tags
  Curator's Note in italics (personal annotation feel)
  Full description

[ACTION BUTTONS]
  "Read Online" → in-browser PDF viewer
  "Download PDF" → requires login

[RELATED BOOKS]
  Same category or overlapping tags
```

---

### PAGE 4 — The Vault `/vault`

**Atmosphere:** Darker, heavier. A sense of entering a restricted archive.

```
[VAULT INTRO]
  "The Vault"  (lock or eye icon)
  "These books are not restricted because they are dangerous.
   They are here because they require context, discernment,
   and readiness. Request access with honesty."

[VAULT BOOK GRID]
  Cards visible but:
  - Cover: blurred/darkened
  - Title + Author: visible
  - Description: first line visible, rest blurred
  - CTA: "Request Access" → /vault/request/[id]
  - If access approved: full card + read/download buttons

[ACCESS REQUEST PAGE /vault/request/[id]]
  Book info displayed (title, author, cover)
  Form:
    1. "Why do you want to read this?" (required, min 100 chars)
    2. "Tell us about your background or current journey" (optional)
    3. Checkbox: "I take full responsibility for how I engage with this content."
  On submit: status = 'pending'
  Confirmation: "Your request is with the curator. Expect a response within a few days."
```

---

### PAGE 5 — The Request Desk `/desk`

**Atmosphere:** A warm, welcoming community notice board.

```
[HEADER]
  "The Request Desk"
  "This library grows with the community. Ask for what you need. Share what you have."

[TWO COLUMNS]

  LEFT — "Find a Book"
    "Looking for a title we don't have? Submit a request
     and the curator will try to source it."
    Form: Book Title (required) · Author · Why this book matters (optional)

  RIGHT — "Donate a Book"
    "Have a PDF that belongs here? Share it.
     All donations are reviewed before being published."
    Form: Title · Author · Upload PDF · Suggested Category · Notes
    Notice: "All donated materials are reviewed for quality and relevance."

[COMMUNITY NOTICE — Bottom]
  "This is a free library maintained by one person.
   If a book matters to you, share the library — not just the files.
   Help keep this place alive by contributing, not only extracting."
```

---

### PAGE 6 — About `/about`

```
[FULL MANIFESTO]
  Long-form essay — the complete WHY / WHAT / HOW
  First-person voice — the curator's authentic narrative
  Serif font, generous line spacing, dark background

[CURATOR'S LETTER]
  Personal narrative: the dark night of the soul
  How books became the compass
  Why this was built for others, not just kept for oneself

[THE RULES OF THE HOUSE]
  Clear, short list:
  - How the library works
  - The Vault access philosophy
  - What happens to donated books
  - No monetization, ever

[CONTACT]
  Simple contact form or curator's email
```

---

### PAGE 7 — Admin Dashboard `/admin` (Curator Only)

```
[/admin — Overview]
  Stats: Total books · Pending vault requests · Open book requests · Pending donations
  Recent activity feed

[/admin/vault — Vault Queue]
  Table: User · Book · Reason · Background · Date Requested
  Actions per row: "Approve" | "Deny" | "Request More Info"
  Optional note field before actioning
  On approve: email sent to user via Resend

[/admin/books — Book Manager]
  Add book: Title, Author, Category, Cover upload, PDF upload,
            Description, Tags, is_restricted toggle, Curator Note
  Edit / Delete existing books
  Toggle published/unpublished

[/admin/donations — Donation Review]
  Table + PDF preview
  Accept (moves to main catalog) / Decline with note

[/admin/requests — Book Request Queue]
  Table of user book requests
  Status management: open → fulfilled / noted / declined
```

---

## ◈ SECTION 7 — AUTHENTICATION FLOW

```
REGISTER (/auth/register):
  1. Email + Password OR Google OAuth
  2. Choose display name
  3. Onboarding question:
     "What brings you to this library?" (stored as reason_joined)
  4. Email verification
  5. Redirect to /library

LOGIN (/auth/login):
  1. Email + Password OR Google OAuth OR Magic Link
  2. Redirect to previous page or /library

ACCESS GATES:
  Browse freely    → No login required
  Download books   → Login required (soft prompt gate)
  Vault books      → Login + approved vault_access_request
  Admin panel      → Login + role = 'admin'
```

---

## ◈ SECTION 8 — SUPABASE EDGE FUNCTIONS

| Function                      | Trigger                                    | Action                                              |
|------------------------------|--------------------------------------------|-----------------------------------------------------|
| `vault-request-submitted`    | INSERT on vault_access_requests            | Email admin: new request with user + book + reason  |
| `vault-request-reviewed`     | UPDATE vault_access_requests (status change)| Email user: approved or denied + optional note     |
| `book-request-submitted`     | INSERT on book_requests                    | Email admin: new book request                       |
| `donation-submitted`         | INSERT on book_donations                   | Email admin: new donation pending review            |

---

## ◈ SECTION 9 — SUPABASE STORAGE BUCKETS

| Bucket Name        | Access  | Contents                           |
|--------------------|---------|------------------------------------|
| `book-covers`      | Public  | Book cover images                  |
| `book-files`       | Private | Published PDF files (open stacks)  |
| `vault-files`      | Private | Restricted PDFs (vault only)       |
| `donations-inbox`  | Private | User-donated PDFs (pending review) |

**Rules:**
- `book-files` and `vault-files`: served only via signed URLs (server-generated, 1hr expiry)
- `donations-inbox`: authenticated write, admin-only read

---

## ◈ SECTION 10 — VERCEL CONFIG

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=
ADMIN_EMAIL=
```

**vercel.json:**
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**Deploy Pipeline:**
- `main` → Production
- `develop` → Preview
- PRs → Unique preview URL

---

## ◈ SECTION 11 — GEMINI CLI USAGE GUIDE

Gemini CLI acts as the intelligent pair-programmer alongside Antigravity.

```bash
# Scaffold a new page
gemini generate page --name vault --layout dark --auth required

# Generate a Supabase query hook
gemini generate hook --name useVaultBooks --table books --filter is_restricted=true

# Generate admin data table component
gemini generate component --name VaultRequestTable --type data-table

# Security review of a generated file
gemini review --file app/admin/vault/page.tsx --focus security,rls

# Generate email template
gemini generate email --name vault-approved --variables user_name,book_title
```

---

## ◈ SECTION 12 — DESIGN TOKENS

```css
/* Typography */
--font-heading: 'Playfair Display', serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Color Palette — Dark Mode First */
--color-bg-primary:    #0D0D0D;   /* near-black background */
--color-bg-secondary:  #141414;   /* card backgrounds */
--color-bg-elevated:   #1A1A1A;   /* modals, dropdowns */
--color-border:        #2A2A2A;   /* subtle borders */
--color-text-primary:  #F0EDE6;   /* warm off-white */
--color-text-secondary:#9A9088;   /* muted text */
--color-accent-gold:   #C9A84C;   /* primary accent */
--color-accent-violet: #7C3AED;   /* secondary accent */
--color-accent-crimson:#991B1B;   /* vault / restricted accent */
--color-success:       #065F46;
--color-warning:       #92400E;

/* Spacing */
--space-xs: 4px;  --space-sm: 8px;   --space-md: 16px;
--space-lg: 24px; --space-xl: 40px;  --space-2xl: 64px; --space-3xl: 96px;

/* Radius */
--radius-sm: 4px; --radius-md: 8px; --radius-lg: 16px; --radius-full: 9999px;

/* Shadows */
--shadow-card:       0 4px 24px rgba(0,0,0,0.4);
--shadow-glow-gold:  0 0 20px rgba(201,168,76,0.15);
--shadow-glow-vault: 0 0 30px rgba(153,27,27,0.2);
```

---

## ◈ SECTION 13 — PROJECT FOLDER STRUCTURE

```
in-my-solitude/
│
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Landing
│   │   ├── library/page.tsx          # Open Stacks
│   │   ├── library/[category]/page.tsx
│   │   ├── book/[id]/page.tsx        # Book Detail
│   │   ├── vault/page.tsx            # The Vault
│   │   ├── vault/request/[id]/page.tsx
│   │   ├── desk/page.tsx             # Request Desk
│   │   └── about/page.tsx
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (protected)/
│   │   └── profile/page.tsx
│   │
│   ├── admin/
│   │   ├── layout.tsx                # Admin auth guard
│   │   ├── page.tsx                  # Dashboard
│   │   ├── vault/page.tsx
│   │   ├── books/page.tsx
│   │   ├── donations/page.tsx
│   │   └── requests/page.tsx
│   │
│   ├── api/
│   │   ├── books/route.ts
│   │   └── storage/signed-url/route.ts
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                           # Shadcn/UI base
│   ├── books/
│   │   ├── BookCard.tsx
│   │   ├── BookGrid.tsx
│   │   ├── BookDetail.tsx
│   │   └── BookSearch.tsx
│   ├── vault/
│   │   ├── VaultCard.tsx             # Blurred restricted card
│   │   └── VaultRequestForm.tsx
│   ├── desk/
│   │   ├── BookRequestForm.tsx
│   │   └── DonationForm.tsx
│   ├── admin/
│   │   ├── VaultQueue.tsx
│   │   ├── BookManager.tsx
│   │   └── StatsCards.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── AdminSidebar.tsx
│   └── shared/
│       ├── CategoryBadge.tsx
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # SSR Supabase client
│   │   └── admin.ts                  # Service role (admin only)
│   ├── hooks/
│   │   ├── useBooks.ts
│   │   ├── useVaultAccess.ts
│   │   └── useUser.ts
│   ├── utils/
│   │   ├── format.ts
│   │   └── signed-url.ts
│   └── email/
│       └── templates.ts              # Resend templates
│
├── types/
│   └── database.ts                   # Supabase generated types
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── og-image.png
│
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── vault-request-notify/
│       ├── vault-request-reviewed/
│       ├── book-request-notify/
│       └── donation-notify/
│
├── .env.local
├── vercel.json
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## ◈ SECTION 14 — ANTIGRAVITY EXECUTION CHECKLIST

### Phase 1 — Foundation
- [ ] Initialize Next.js 14 + TypeScript + Tailwind + Shadcn/UI
- [ ] Set up Supabase: run all migrations, configure RLS policies
- [ ] Configure Supabase Auth (magic link + Google OAuth)
- [ ] Create all 4 storage buckets with access policies
- [ ] Set up Vercel project, link to GitHub, add env variables
- [ ] Install Framer Motion + Lucide React

### Phase 2 — Core Pages
- [ ] Root layout: Navbar, Footer, theme provider
- [ ] Landing Page (all 6 sections)
- [ ] Library page: search + filter + book grid
- [ ] Book detail page with in-browser PDF viewer
- [ ] Category page

### Phase 3 — Vault System
- [ ] Vault overview: blurred book cards
- [ ] Vault access request form + submission
- [ ] User profile page: approved books + request history

### Phase 4 — Request Desk
- [ ] Request Desk: both forms (request + donate)
- [ ] Wire all form submissions to Supabase tables

### Phase 5 — Admin Dashboard
- [ ] Admin layout with role-based auth guard
- [ ] Vault request queue with approve/deny
- [ ] Book manager (add / edit / delete)
- [ ] Donation review queue
- [ ] Book request queue

### Phase 6 — Edge Functions & Email
- [ ] Deploy all 4 Supabase Edge Functions
- [ ] Configure Resend email templates
- [ ] Test full vault flow: request → admin email → approve → user email

### Phase 7 — Polish & Launch
- [ ] Seed database with initial 300+ book catalog
- [ ] Upload covers and PDFs to Supabase Storage
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance audit (Lighthouse score > 90)
- [ ] Mobile QA (all pages)
- [ ] SEO: meta tags, Open Graph, sitemap.xml, robots.txt
- [ ] Launch on Vercel production domain

---

## ◈ SECTION 15 — SUGGESTED DOMAIN NAMES

1. **inmysolitude.com** — Most resonant with the project's soul
2. **solitudelibrary.org** — .org signals non-commercial intent
3. **theawakeningarchive.com** — Speaks to the journey
4. **solitudestack.com** — Clean and modern
5. **thelibraryvault.com** — Emphasizes the vault feature

---

*"The library was built in solitude. It is offered in solidarity."*

— The Curator

---
**Document Version:** 1.0
**Builder:** Antigravity (Google Autonomous Agentic IDE)
**AI Assistant:** Gemini CLI
**Frontend:** Vercel (Next.js 14) | **Backend:** Supabase | **Style:** Dark · Ethereal · Literary
