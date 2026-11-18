-- Step 1: course catalog.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.

create table if not exists public.courses (
  id                text primary key,             -- "CS 107"
  year              text not null,                -- "2026-2027"
  subject           text not null,                -- "CS"
  code              text not null,                -- "107"
  code_num          integer not null default 0,   -- 107 (for sorting)
  title             text not null,
  description       text not null default '',
  units_min         real not null default 0,
  units_max         real not null default 0,
  gers              text[] not null default '{}',
  grading           text not null default '',
  repeatable        boolean not null default false,
  course_id         integer not null default 0,   -- ExploreCourses id (shared by cross-listings)
  cross_listings    text[] not null default '{}', -- other codes for the same class
  prereq_text       text,
  terms             text[] not null default '{}', -- {Autumn,Winter,...}
  independent_study boolean not null default false,
  sections          jsonb not null default '[]',  -- see src/lib/catalog/types.ts (Section[])
  updated_at        timestamptz not null default now(),
  -- Full-text search index over code, title (weighted higher) and description.
  search tsvector generated always as (
    setweight(to_tsvector('english', subject || ' ' || code || ' ' || subject || code || ' ' || title), 'A') ||
    setweight(to_tsvector('english', description), 'B')
  ) stored
);

create index if not exists courses_search_idx on public.courses using gin (search);
create index if not exists courses_subject_idx on public.courses (subject, code_num);

-- Row Level Security: the catalog is public information, readable by any signed-in user.
-- Only the sync script (using the secret key, which bypasses RLS) can write to it.
alter table public.courses enable row level security;
drop policy if exists "Signed-in users can read the catalog" on public.courses;
create policy "Signed-in users can read the catalog"
  on public.courses for select to authenticated using (true);

-- Search function used by the app. `security invoker` means RLS still applies.
create or replace function public.search_courses(
  q        text default null,
  p_terms  text[] default null,
  p_min    real default null,
  p_max    real default null,
  p_limit  integer default 300
) returns setof public.courses
language sql stable security invoker
set search_path = public
as $$
  with params as (
    select nullif(trim(q), '') as q,
           case when nullif(trim(q), '') is null then null
                else websearch_to_tsquery('english', q) end as tsq
  )
  select c.*
  from public.courses c, params p
  where (p.q is null
         or c.search @@ p.tsq
         or c.id = upper(p.q)
         or c.subject = upper(p.q))
    and (p_terms is null or c.terms && p_terms)
    and (p_min is null or c.units_max >= p_min)
    and (p_max is null or c.units_min <= p_max)
  order by (c.id = upper(coalesce(p.q, ''))) desc,
           (c.subject = upper(coalesce(p.q, ''))) desc,
           case when p.tsq is null then 0 else ts_rank(c.search, p.tsq) end desc,
           c.subject, c.code_num, c.code
  limit p_limit;
$$;
