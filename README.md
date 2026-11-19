# Stanford Course Recommender

Personalized, prerequisite-checked Stanford course recommendations and a conflict-free quarter planner.

**Stack:** Next.js (TypeScript, App Router) · Supabase (Postgres + email/Google sign-in) · Vercel (hosting) · Claude via the Hopscotch API (interest matching and explanations).

**Design rule:** hard constraints (prerequisites, time conflicts, units, days) are checked by plain, tested code. AI is used only for interest matching and explanations, and for a one-time conversion of catalog prerequisite text into structured rules.

## Status

| Step | What | Status |
|---|---|---|
| 0 | Project setup + sign-in (email link; Google optional) | ✅ |
| 1 | Catalog sync (ExploreCourses) + search with unit/day/quarter filters | ✅ code done; load data into Supabase (below) |
| 2 | Transcript upload (parsed in the browser) + editable course list | ✅ run `0003_completed_courses.sql` |
| 3 | Prerequisite parsing + eligibility checker | ✅ run `0004_prereq_rules.sql`, then `npm run parse-prereqs -- --upload` |
| 4 | AI recommendations with explanations | ✅ needs `HOPSCOTCH_API_KEY` in production |
| 5 | Planner + conflict-free recommendations + daily limit | ✅ run `0005_plan_and_limits.sql`; deploy below |

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

### 3. Course catalog
1. Supabase → **SQL Editor** → New query → paste all of `supabase/migrations/0001_catalog.sql` → **Run**. (If you ran an earlier version of that file, also run `0002_catalog_grants.sql`.)
2. Add `SUPABASE_SECRET_KEY` (Project Settings → API Keys → Secret keys) to `.env.local`. It's server-only: never expose it to the browser or commit it.
3. Download the catalog and upload it:
   ```bash
   npm run sync-catalog -- --upload
   ```
   This fetches every department from ExploreCourses (~30 seconds, ~9,000 courses), saves `data/catalog.json`, and upserts it into the `courses` table. Re-run it whenever schedules change.

### 4. Student course lists
Supabase → SQL Editor → run `supabase/migrations/0003_completed_courses.sql`. This creates the `completed_courses` table (course codes, titles and quarters only), with Row Level Security so each student sees only their own rows.

### 5. Prerequisite rules
1. Supabase → SQL Editor → run `supabase/migrations/0004_prereq_rules.sql`.
2. `npm run parse-prereqs -- --upload` (needs `HOPSCOTCH_API_KEY` and `data/catalog.json`).

How it works: an AI model (Claude Sonnet 5, one time) turns each course's prerequisite sentence into a rule ("all of these groups; any one option per group"). Its raw output is cached in `prereqs/rules.json` (committed), so re-runs only send new or changed text (~$3 for the whole catalog). Deterministic code then cleans the rules up (`src/lib/prereqs/normalize.ts`) and does all checking (`src/lib/prereqs/evaluate.ts`):
- "recommended" preparation and corequisites are never enforced
- "or consent of instructor", "or equivalent", knowledge requirements → **unverified** (shown with a label, never hidden)
- requirements on courses not offered this year, stale rules, and ambiguous text → unverified
- a course is hidden only when a clear course requirement is missing

### 6. Recommendations
Set `HOPSCOTCH_API_KEY` (server-side only; also in Vercel's environment variables). `RECOMMEND_MODEL` defaults to `anthropic/claude-sonnet-5`.

Pipeline (`src/lib/recommend/pipeline.ts`): AI turns the interests text into search phrases → Postgres full-text search with the student's filters → code drops courses already taken or with missing prerequisites (max 60 left) → AI ranks up to 10 and writes "why it fits" → code discards any pick that isn't in the eligible list. Only the interests text and public catalog data are sent to the AI, never the student's course list. Roughly 3–5¢ and ~20 seconds per request.

### 7. Planner
Supabase → SQL Editor → run `supabase/migrations/0005_plan_and_limits.sql`. Students add courses (with a chosen lecture/seminar section) from search or recommendations. Code (`src/lib/plan/`, `src/lib/prereqs/annotate.ts`) then:
- blocks sections that overlap a planned course in the same quarter (server re-checks on save)
- counts courses planned in **earlier** quarters toward prerequisites (CS 106B in Autumn → CS 107 eligible in Winter)
- hides planned and clashing courses from "Only courses I can take" and recommendations
- limits recommendation requests per student (`RECOMMEND_DAILY_LIMIT`, default 20 per 24 hours)

Not yet handled: discussion/lab sections (only the lecture/seminar time is checked), and sections whose times are TBA (they never count as conflicts).

**Offline development:** after `npm run sync-catalog` (without `--upload`), set `CATALOG_SOURCE=local` and `DEV_SKIP_AUTH=true` in `.env.local` to browse the catalog with `npm run dev` without Supabase. Both settings are ignored in production builds (`DEV_SKIP_AUTH` only works under `npm run dev`).

### 8. Vercel (free hosting)
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
src/lib/catalog/             catalog parsing, filters, search (+ tests)
scripts/sync-catalog.ts      downloads ExploreCourses → data/catalog.json → Supabase
supabase/migrations/         SQL to paste into the Supabase SQL Editor
src/lib/transcript/          transcript PDF → course list (runs in the browser) (+ tests)
src/lib/prereqs/             prerequisite rules: AI prompt, clean-up, eligibility checker (+ tests)
scripts/parse-prereqs.ts     one-time AI pass over prerequisite text → prereqs/rules.json → Supabase
src/lib/ai/                  Claude client (via Hopscotch)
src/lib/recommend/           recommendation pipeline + prompts (+ tests)
src/app/(app)/recommend/     recommendations page
src/lib/plan/                time conflicts, plan validation, plan data (+ tests)
src/app/(app)/plan/          My plan page, Add-to-plan control
src/app/(app)/courses/       course search page
src/app/(app)/my-courses/    transcript upload + editable completed-course list
src/app/login/               sign-in page
src/app/auth/callback/       where Google redirects back after sign-in
```
