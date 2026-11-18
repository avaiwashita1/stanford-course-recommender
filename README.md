# Stanford Course Recommender

Personalized, prerequisite-checked Stanford course recommendations and a conflict-free quarter planner.

**Stack:** Next.js (TypeScript, App Router) · Supabase (Postgres + email/Google sign-in) · Vercel (hosting) · Claude via the Hopscotch API (interest matching and explanations).

**Design rule:** hard constraints (prerequisites, time conflicts, units, days) are checked by plain, tested code. AI is used only for interest matching and explanations, and for a one-time conversion of catalog prerequisite text into structured rules.

## Status

| Step | What | Status |
|---|---|---|
| 0 | Project setup + sign-in (email link; Google optional) | ✅ |
| 1 | Catalog sync (ExploreCourses) + search with unit/day filters | ⏳ |
| 2 | Transcript upload (parsed in the browser) + editable course list | ⏳ |
| 3 | Prerequisite parsing + eligibility checker | ⏳ |
| 4 | AI recommendations with explanations | ⏳ |
| 5 | Planner + conflict-free recommendations + deploy | ⏳ |

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
npm test                     # unit tests
```

### 1. Supabase (free database + auth)
1. Create a free account at https://supabase.com and a new project (any region near you; save the database password).
2. Project Settings → **API Keys**: copy the **Project URL** and the **publishable** key into `.env.local`.

### 2. Email sign-in links (default)
Email sign-in is enabled in Supabase by default. You only need to set the allowed redirect URLs:
- Supabase → Authentication → **URL Configuration**: set Site URL to `http://localhost:3000`, and add `http://localhost:3000/auth/callback` (and later `https://YOUR-VERCEL-URL/auth/callback`) under Redirect URLs.

Notes: open the emailed link in the same browser you requested it from. Supabase's free email service only sends a few emails per hour, which is fine for a demo.

### 2b. Google sign-in (optional)
Use a **personal Gmail account** if your Stanford account can't use Google Cloud.
1. In https://console.cloud.google.com create a project → **APIs & Services → OAuth consent screen**: choose *External*, fill in app name and your email.
2. **Credentials → Create credentials → OAuth client ID** → *Web application*.
   - Authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback` (shown in Supabase → Authentication → Sign In / Providers → Google).
3. Copy the Client ID and Client Secret into Supabase → Authentication → Sign In / Providers → **Google**, and enable it.
4. Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` to show the button.

### 3. Vercel (free hosting)
Import this GitHub repo at https://vercel.com/new, add the same environment variables, deploy, then add the Vercel URL to Supabase's Redirect URLs.

## Privacy
- Transcript PDFs are parsed **in your browser**; the file is never uploaded.
- Only course codes and quarters are stored — no grades, name or student ID.
- Transcript contents are never sent to an AI model.
- `*.pdf` files are git-ignored so real transcripts can't be committed by accident.

## Project layout
```
src/proxy.ts                 runs before every request: refreshes session, redirects signed-out users
src/lib/supabase/            Supabase clients for browser, server and proxy
src/lib/auth/                email-domain check (+ tests)
src/app/login/               sign-in page
src/app/auth/callback/       where Google redirects back after sign-in
```
