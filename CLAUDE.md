@AGENTS.md

## Project notes
- Hard constraints (prereqs, time conflicts, units, days) must be deterministic, unit-tested code in `src/lib/`. AI is only for interest matching/explanations and one-time prereq-text parsing.
- Never commit transcripts or student data. Transcript parsing happens client-side; store only course codes + terms.
- Next.js 16: `middleware` is now `src/proxy.ts`; `cookies()`/`searchParams` are async. Cache Components are intentionally off.
- Run `npm test`, `npx tsc --noEmit`, `npm run lint` before committing.
