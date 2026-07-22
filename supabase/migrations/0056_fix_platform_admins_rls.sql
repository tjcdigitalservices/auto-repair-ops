-- Fix infinite recursion on platform_admins RLS.
-- The previous FOR ALL write policy re-selected platform_admins inside its own
-- USING clause, which re-triggered RLS on SELECT.

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
  );
$$;

create or replace function public.is_platform_owner()
returns boolean
language sql
security definer
stable
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
      and pa.role = 'platform_owner'
  );
$$;

revoke all on function public.is_platform_admin() from public, anon;
revoke all on function public.is_platform_owner() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_platform_owner() to authenticated;

drop policy if exists platform_admins_select on public.platform_admins;
create policy platform_admins_select
on public.platform_admins
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_platform_admin()
);

-- SELECT must not live on FOR ALL — that caused recursion via nested EXISTS.
drop policy if exists platform_admins_write on public.platform_admins;

create policy platform_admins_insert
on public.platform_admins
for insert
to authenticated
with check (public.is_platform_owner());

create policy platform_admins_update
on public.platform_admins
for update
to authenticated
using (public.is_platform_owner())
with check (public.is_platform_owner());

create policy platform_admins_delete
on public.platform_admins
for delete
to authenticated
using (public.is_platform_owner());
