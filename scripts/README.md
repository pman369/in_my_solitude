# Bulk Import Script

Imports books into the In My Solitude archive from a CSV file + local files — no browser required.

---

## Setup

No extra packages needed. The script uses `@supabase/supabase-js`, which is already installed.

Make sure your `.env.local` has the **service role key** — this bypasses Row Level Security and is required for server-side inserts:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> The service role key is in your Supabase project under **Settings → API → service_role**.  
> **Never commit it. Never expose it client-side.**

---

## Directory Structure

Prepare your files like this before running the script:

```
my-import/
├── books.csv          # Your metadata spreadsheet
├── covers/            # Cover images (JPG, PNG, WebP)
│   ├── kybalion.jpg
│   └── corpus-hermeticum.jpg
└── pdfs/              # Book PDFs
    ├── kybalion.pdf
    └── corpus-hermeticum.pdf
```

---

## Usage

```bash
# From the project root:
node scripts/bulk-import.mjs --csv ./my-import/books.csv --covers ./my-import/covers --pdfs ./my-import/pdfs

# Validate everything first without uploading (recommended first run):
node scripts/bulk-import.mjs --csv ./my-import/books.csv --covers ./my-import/covers --pdfs ./my-import/pdfs --dry-run

# Slow down uploads (milliseconds between each book, default 300):
node scripts/bulk-import.mjs --csv books.csv --covers ./covers --pdfs ./pdfs --delay 500
```

---

## CSV Format

See `sample-books.csv` for a working example. Open it in Excel, Numbers, or Google Sheets.

| Column | Required | Description |
|---|---|---|
| `title` | ✅ | Book title |
| `author` | — | Author name |
| `category` | — | Category **slug** or **name** (e.g. `esoteric`, `Esoteric & Occult`) |
| `description` | — | Shown on book cards and search results |
| `curator_note` | — | Your personal annotation (italic, in a special box on the book page) |
| `tags` | — | Pipe-separated keywords: `hermetic\|alchemy\|philosophy` |
| `is_restricted` | — | `true` → Vault (requires approval). Default: `false` |
| `is_published` | — | `false` → saved but hidden. Default: `true` |
| `language` | — | Default: `English` |
| `publish_date` | — | Original publication year, e.g. `1908` |
| `cover_file` | — | Filename in the `--covers` directory (e.g. `kybalion.jpg`). If omitted, matches on slugified title |
| `pdf_file` | — | Filename in the `--pdfs` directory (e.g. `kybalion.pdf`). If omitted, matches on slugified title |

### File matching

If you don't specify `cover_file` / `pdf_file`, the script tries to match on the slugified title:

- Title: `"The Kybalion"` → looks for `the-kybalion.jpg` / `the-kybalion.pdf`
- Matching is **case-insensitive**
- Extension is flexible — `kybalion.jpg`, `kybalion.jpeg`, `kybalion.png` all work

### Categories

Run this to see all available category slugs:

```bash
node -e "
import('@supabase/supabase-js').then(({createClient}) => {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  s.from('categories').select('slug,name').then(({data}) => data.forEach(c => console.log(c.slug, '-', c.name)));
});
"
```

Or just check the slugs used in the existing library URL: `/library?category=SLUG_HERE`

---

## What the script does (per book)

1. **Validates** — checks files exist, category is valid, title is present
2. **Inserts** a new row in the `books` table (gets a UUID back)
3. **Uploads cover** → `book-covers` bucket as `covers/{id}.jpg` (public)
4. **Uploads PDF** → `book-files` (or `vault-files` if restricted) as `{id}.pdf`
5. **Updates** the book row with `cover_url`, `file_url`, and `file_size_bytes`

If any step fails, the orphan DB record is deleted and the error is logged. The rest of the batch continues.

---

## After the run

- ✅ Successful books appear immediately in `/library` (or `/vault` if restricted)
- ❌ Failed books are written to `failed-import.csv` in the project root — fix and re-import

---

## Supabase Storage Buckets

The script expects these buckets to exist in your Supabase project:

| Bucket | Visibility | Used for |
|---|---|---|
| `book-covers` | Public | Cover images |
| `book-files` | Private | Open library PDFs |
| `vault-files` | Private | Vault (restricted) PDFs |

Create them in **Supabase Dashboard → Storage** if they don't exist.
