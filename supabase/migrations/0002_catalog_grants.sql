-- Newer Supabase projects don't automatically let the API roles use new tables.
-- Paste into Supabase → SQL Editor → Run.

-- Signed-in users may read the catalog (RLS policy from 0001 still applies).
grant select on public.courses to authenticated;
grant execute on function public.search_courses(text, text[], real, real, integer) to authenticated;

-- The sync script (secret key = service_role) may write it.
grant select, insert, update, delete on public.courses to service_role;
