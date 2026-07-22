-- Verification checks for multi-tenant foundation.

do $$
begin
  assert exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'tenants'
  ), 'tenants table missing';

  assert exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'tenant_branding'
  ), 'tenant_branding table missing';

  assert exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'platform_admins'
  ), 'platform_admins table missing';

  assert exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'branches' and column_name = 'tenant_id'
  ), 'branches.tenant_id missing';

  assert exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'staff' and column_name = 'tenant_id'
  ), 'staff.tenant_id missing';

  assert (
    select count(*) = 0 from public.branches where tenant_id is null
  ), 'branches without tenant_id remain';

  assert (
    select count(*) = 0 from public.staff where tenant_id is null
  ), 'staff without tenant_id remain';

  assert exists (
    select 1 from public.tenants where slug = 'legacy'
  ), 'bootstrap legacy tenant missing';
end $$;
