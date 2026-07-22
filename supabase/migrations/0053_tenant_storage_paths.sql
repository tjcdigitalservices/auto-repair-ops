-- Storage path isolation for multi-tenant assets.
-- New uploads use tenants/{tenantId}/... keys (see src/lib/constants/storage.ts).
-- Existing objects under business-logos/ and product-images/ remain readable.

drop policy if exists business_logos_authenticated_rw on storage.objects;
drop policy if exists business_logos_public_read on storage.objects;
drop policy if exists product_images_inventory_team_rw on storage.objects;
drop policy if exists product_images_public_read on storage.objects;
drop policy if exists business_assets_public_read on storage.objects;
drop policy if exists business_assets_authenticated_write on storage.objects;
drop policy if exists business_assets_tenant_read on storage.objects;
drop policy if exists business_assets_tenant_write on storage.objects;

create policy business_assets_public_read
on storage.objects
for select
to public
using (bucket_id = 'business-assets');

create policy business_assets_tenant_write
on storage.objects
for all
to authenticated
using (
  bucket_id = 'business-assets'
  and (
    public.is_platform_admin()
    or (
      (storage.foldername(name))[1] = 'tenants'
      and (storage.foldername(name))[2] = public.current_tenant_id()::text
    )
    -- legacy prefixes during migration
    or name like 'business-logos/%'
    or name like 'product-images/%'
  )
)
with check (
  bucket_id = 'business-assets'
  and (
    public.is_platform_admin()
    or (
      (storage.foldername(name))[1] = 'tenants'
      and (storage.foldername(name))[2] = public.current_tenant_id()::text
    )
  )
);
