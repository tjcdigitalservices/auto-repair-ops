-- Allow linked customers to load shop branding for quotation PDF print (mobile WebView).

create or replace function public.current_customer_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.tenant_id
  from public.customers c
  join public.branches b on b.id = c.branch_id
  where c.id = public.current_customer_record_id()
$$;

revoke all on function public.current_customer_tenant_id() from public, anon;
grant execute on function public.current_customer_tenant_id() to authenticated;

drop policy if exists business_settings_select_linked_customer on public.business_settings;
create policy business_settings_select_linked_customer
on public.business_settings
for select
to authenticated
using (
  branch_id = (
    select c.branch_id
    from public.customers c
    where c.id = public.current_customer_record_id()
  )
);

drop policy if exists tenant_branding_select_linked_customer on public.tenant_branding;
create policy tenant_branding_select_linked_customer
on public.tenant_branding
for select
to authenticated
using (tenant_id = public.current_customer_tenant_id());
