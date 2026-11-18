-- Step 3: structured prerequisite rules (written by `npm run parse-prereqs -- --upload`).
-- Paste into Supabase → SQL Editor → Run.

create table if not exists public.prereq_rules (
  course_id   text primary key,          -- "CS 161"
  source_text text not null,             -- the catalog text the rule was parsed from
  rule        jsonb not null,            -- see src/lib/prereqs/schema.ts (PrereqRule)
  model       text not null,
  parsed_at   timestamptz not null default now()
);

alter table public.prereq_rules enable row level security;
drop policy if exists "Signed-in users can read prerequisite rules" on public.prereq_rules;
create policy "Signed-in users can read prerequisite rules"
  on public.prereq_rules for select to authenticated using (true);

grant select on public.prereq_rules to authenticated;
grant select, insert, update, delete on public.prereq_rules to service_role;
