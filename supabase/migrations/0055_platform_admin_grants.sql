-- Ensure authenticated clients can read platform + tenant branding tables.
-- RLS still controls which rows are visible.

grant select on public.platform_admins to authenticated;
grant select, insert, update, delete on public.platform_admins to authenticated;

grant select on public.tenant_branding to authenticated;
grant insert, update, delete on public.tenant_branding to authenticated;

grant select on public.tenants to authenticated;
grant update on public.tenants to authenticated;

-- Confirm anon can still resolve public branding by slug (already granted in 0052).
grant select on public.tenants to anon;
grant select on public.tenant_branding to anon;
