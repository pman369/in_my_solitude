# In My Solitude 🕯️

A free, community-driven archive for awakening knowledge. Built in solitude, offered in solidarity. This platform hosts over three hundred volumes across forbidden history, consciousness, and mysticism—without paywalls, ads, or algorithms.

## Technology Stack
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19, Server Components)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security)
- **Styling:** Tailwind CSS & Framer Motion
- **AI Integration:** Google Gemini API (Streaming "Librarian" Chat Agent)

## Authentication & Access Flow

The platform utilizes heavily locked-down Role-Based Access Control (RBAC):
- **Public & Reading Access:** Anyone with a registered account can access open-stack books. Unauthenticated users are redirected to the Login page. 
- **Role Verification:** Middleware intercepts incoming requests. Non-admins attempting to access `/admin` or `/curator` dashboards are hard-redirected to the homepage. API routes are strictly typed and verified on the server side.

### The Vault Access System
Restricted books exist within "The Vault." These books are housed in a secure Supabase storage bucket (`vault-files`). Users cannot access the raw file URLs.
1. The user creates a `vault_access_requests` entry, detailing their intent.
2. An **Admin** (Curator) reviews the request on the Admin Dashboard and updates the status to `approved`.
3. The server-side API Route `/api/storage/signed-url` cross-references the request status against the user session to dynamically issue a temporary, signed read-only link.

## Initial Setup

1. **Clone & Install:**
   ```bash
   git clone https://github.com/pman369/in_my_solitude.git
   cd in_my_solitude
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file and fill in your Supabase connection strings and Google Gemini API keys:
   ```bash
   cp .env.example .env.local
   ```
   *Note: Ensure your Service Role key is only accessed securely within server routes to avoid exposing database capabilities.*

3. **Database Initialization:**
   If this is a fresh setup, push the required schema:
   ```bash
   npx supabase db push
   ```
   (Wait for standard manual seed data syncing if necessary).

4. **Launch Dev Server:**
   ```bash
   npm run dev
   ```
   The platform operates at `http://localhost:3000`.
