-- Service-role provisioning (e.g. create tenant + owner staff) must be able to
-- generate staff codes. next_document_number → assert_branch_access → can_access_branch
-- previously required a user JWT, so service_role inserts failed.

create or replace function public.can_access_branch(p_branch_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
set row_security = off
as $$
  select
    p_branch_id is not null
    and (
      coalesce(auth.role(), '') = 'service_role'
      or public.is_platform_admin()
      or exists (
        select 1
        from public.branches b
        where b.id = p_branch_id
          and b.tenant_id = public.current_tenant_id()
          and (
            public.has_global_branch_access()
            or p_branch_id = public.current_staff_branch_id()
          )
      )
    );
$$;

create or replace function public.assert_branch_access(
  p_branch_id uuid,
  p_message text default 'You do not have access to this branch.'
)
returns void
language plpgsql
security definer
stable
set search_path = public
set row_security = off
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return;
  end if;

  if not public.can_access_branch(p_branch_id) then
    raise exception '%', p_message;
  end if;
end;
$$;
