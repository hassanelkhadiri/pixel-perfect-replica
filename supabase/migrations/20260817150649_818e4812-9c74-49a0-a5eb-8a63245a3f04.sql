-- Open access: drop all existing policies on app tables
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('projects','project_stages','stage_checklist_items','reviews','ai_briefs')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Attribution columns become optional and unlinked from auth users
alter table public.projects drop constraint if exists projects_created_by_fkey;
alter table public.projects drop constraint if exists projects_assigned_to_fkey;
alter table public.projects alter column created_by drop not null;
alter table public.reviews drop constraint if exists reviews_reviewer_id_fkey;
alter table public.reviews alter column reviewer_id drop not null;

-- Public grants + fully permissive policies
grant select, insert, update, delete on public.projects to anon, authenticated;
grant select, insert, update, delete on public.project_stages to anon, authenticated;
grant select, insert, update, delete on public.stage_checklist_items to anon, authenticated;
grant select, insert, update, delete on public.reviews to anon, authenticated;
grant select, insert, update, delete on public.ai_briefs to anon, authenticated;
grant all on public.projects, public.project_stages, public.stage_checklist_items, public.reviews, public.ai_briefs to service_role;

create policy "public access" on public.projects for all to anon, authenticated using (true) with check (true);
create policy "public access" on public.project_stages for all to anon, authenticated using (true) with check (true);
create policy "public access" on public.stage_checklist_items for all to anon, authenticated using (true) with check (true);
create policy "public access" on public.reviews for all to anon, authenticated using (true) with check (true);
create policy "public access" on public.ai_briefs for all to anon, authenticated using (true) with check (true);

-- Drop account-related objects
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.has_role(uuid, public.app_role) cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.profiles cascade;
drop type if exists public.app_role cascade;