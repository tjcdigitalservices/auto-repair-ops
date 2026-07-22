-- Finish tenant foundation pieces that failed mid-0052 on the first push,
-- plus staff.document_title if the skipped 00371 migration never ran.

alter table public.staff
  add column if not exists document_title text;

comment on column public.staff.document_title is
  'Customer-facing title used on print/PDF documents instead of the internal role label.';

drop policy if exists website_posts_select_published on public.website_posts;
drop policy if exists website_posts_select_admin on public.website_posts;
drop policy if exists website_posts_write_admin on public.website_posts;
drop policy if exists website_posts_public_select on public.website_posts;
drop policy if exists website_posts_tenant_write on public.website_posts;

create policy website_posts_public_select
on public.website_posts for select to anon, authenticated
using (
  (
    status = 'active'
    and exists (
      select 1 from public.tenants t
      where t.id = website_posts.tenant_id
        and t.status in ('trial', 'active', 'past_due')
    )
  )
  or (
    auth.role() = 'authenticated'
    and public.can_access_tenant(tenant_id)
  )
);

create policy website_posts_tenant_write
on public.website_posts for all to authenticated
using (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
)
with check (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
);

revoke all on function public.is_platform_admin() from public, anon;
revoke all on function public.current_tenant_id() from public, anon;
revoke all on function public.can_access_tenant(uuid) from public, anon;
revoke all on function public.tenant_is_operable(uuid) from public, anon;
revoke all on function public.provision_tenant(text, text, text, text, text, uuid) from public, anon, authenticated;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.current_tenant_id() to authenticated, anon;
grant execute on function public.can_access_tenant(uuid) to authenticated;
grant execute on function public.tenant_is_operable(uuid) to authenticated;
grant execute on function public.provision_tenant(text, text, text, text, text, uuid) to authenticated;

grant select on public.tenants to anon, authenticated;
grant select on public.tenant_branding to anon, authenticated;
