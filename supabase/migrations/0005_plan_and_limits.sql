-- Step 5: quarter plan + daily recommendation limit.
-- Paste into Supabase → SQL Editor → Run.

-- Courses a student plans to take this academic year (one row per course).
create table if not exists public.planned_courses (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course_id  text not null,                       -- "CS 107"
  term       text not null check (term in ('Autumn', 'Winter', 'Spring', 'Summer')),
  class_id   integer,                             -- chosen lecture/seminar section (null = time TBA)
  title      text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table public.planned_courses enable row level security;
drop policy if exists "Students manage own plan" on public.planned_courses;
create policy "Students manage own plan" on public.planned_courses
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.planned_courses to authenticated;

-- One row per recommendation request, used to enforce a per-student daily limit.
create table if not exists public.recommendation_requests (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists recommendation_requests_user_time on public.recommendation_requests (user_id, created_at);

alter table public.recommendation_requests enable row level security;
drop policy if exists "Students read own requests" on public.recommendation_requests;
create policy "Students read own requests" on public.recommendation_requests
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Students log own requests" on public.recommendation_requests;
create policy "Students log own requests" on public.recommendation_requests
  for insert to authenticated with check ((select auth.uid()) = user_id);
grant select, insert on public.recommendation_requests to authenticated;
