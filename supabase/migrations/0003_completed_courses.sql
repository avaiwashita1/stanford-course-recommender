-- Step 2: each student's completed / in-progress courses.
-- Stores course codes, titles and quarters only: no grades, names or student IDs.
-- Paste into Supabase → SQL Editor → Run.

create table if not exists public.completed_courses (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course_id  text not null,                    -- "CS 106B"
  title      text not null default '',
  term       text,                             -- "2023-2024 Winter" (null if entered manually)
  status     text not null check (status in ('completed', 'in_progress')),
  source     text not null check (source in ('transcript', 'manual')),
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- Row Level Security: each student can only see and change their own rows.
alter table public.completed_courses enable row level security;

drop policy if exists "Students read own courses" on public.completed_courses;
create policy "Students read own courses" on public.completed_courses
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Students add own courses" on public.completed_courses;
create policy "Students add own courses" on public.completed_courses
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Students update own courses" on public.completed_courses;
create policy "Students update own courses" on public.completed_courses
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Students delete own courses" on public.completed_courses;
create policy "Students delete own courses" on public.completed_courses
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.completed_courses to authenticated;

-- Replaces the signed-in student's whole list in one transaction (used by the Save button).
create or replace function public.replace_completed_courses(items jsonb)
returns void
language plpgsql security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from public.completed_courses where user_id = auth.uid();
  insert into public.completed_courses (user_id, course_id, title, term, status, source)
  select auth.uid(), x.course_id, coalesce(x.title, ''), x.term, x.status, x.source
  from jsonb_to_recordset(items) as x(course_id text, title text, term text, status text, source text);
end;
$$;

revoke execute on function public.replace_completed_courses(jsonb) from public, anon;
grant execute on function public.replace_completed_courses(jsonb) to authenticated;
