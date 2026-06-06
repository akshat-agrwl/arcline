# ArcLine

An interactive, hand-drawn line graph of a life — plotting **how full each chapter felt**
(life satisfaction) from birth to today, with an honest record of the ups *and* downs.
A warm, personal-journal aesthetic, now with Google sign-in and per-user cloud sync.

## Stack
- **Vite + React** front end (no in-browser Babel anymore — real build step).
- **Supabase** for Google OAuth and storage. Each user's graph is a single JSON
  document in one `graphs` table, guarded by Row Level Security.
- **No client-side encryption.** Privacy rests on Google auth + RLS + Supabase's
  TLS-in-transit and at-rest disk encryption. The host can technically read the DB.

## Project layout
- `index.html` — Vite entry (fonts + `#root` + module script).
- `src/main.jsx` — bootstraps React; routes auth → data load → app; login & loading screens.
- `src/auth.js` — `useSession` hook + Google sign-in / sign-out.
- `src/storage.js` — load/save the graph (Supabase source of truth + localStorage cache).
- `src/supabase.js` — the Supabase client + config check.
- `src/LifeGraphApp.jsx` — the interactive graph (render, drag, editor, PNG export).
- `src/helpers.js` — curve math (Catmull-Rom path + sampling).
- `src/styles.css` — all styling.
- `supabase/schema.sql` — the `graphs` table + RLS policies.

## Setup
1. **Create a Supabase project** at https://supabase.com (free tier is plenty for ~50 users).
2. **Create the table:** open the SQL editor and run `supabase/schema.sql`.
3. **Enable Google auth:** Dashboard → Authentication → Providers → Google. Create an
   OAuth client in the Google Cloud Console, paste the Client ID/Secret, and add the
   callback URL Supabase shows you (`https://<ref>.supabase.co/auth/v1/callback`).
   Add your dev/prod origins under Authentication → URL Configuration → Redirect URLs.
4. **Configure env:** `cp .env.example .env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (Dashboard → Settings → API). The anon key is public by
   design — RLS is what protects the data.
5. **Run it:**
   ```bash
   npm install
   npm run dev
   ```
   Build for production with `npm run build` (output in `dist/`), preview with `npm run preview`.

## What it does
- **A living line** that runs **green while life is climbing** and **red while it's sliding**,
  colored segment-by-segment from the slope, so it always reflects momentum.
- **Drag any point ↕** to set how that moment felt; age stays locked. A feeling face
  (😭→🤩) shows the value while you drag.
- **Add / edit / delete moments.** Click an empty spot to drop one, or use *Add a moment*.
  Double-click a point to edit title, note, age, optional **emoji** (searchable), and feeling.
- **Future zone.** A faint "years ahead" band past today — future moments render ghosted and dashed.
- **Draggable "today" marker** sets your current age; the lived/future split moves with it.
- **Export image** — high-resolution PNG with the hand-drawn fonts embedded.
- **Cloud sync** — auto-saves to Supabase under your account, with a local cache for
  instant loads and offline resilience.

## Data
The default arc is sample data (born → school → most popular → college → a low → first
job → first trip / today). Edit or replace it freely in-app — it persists to your account.
