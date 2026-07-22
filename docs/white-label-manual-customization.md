# White-label & multi-tenant manual customization

This app is a multi-tenant SaaS platform. Each **tenant** is one auto repair shop subscription. Tenants own **branches**, staff, catalogs, and branding. Platform super-admins manage tenants from `/platform`.

## Apply database migrations

```bash
# Apply 0052_tenants_foundation.sql and 0053_tenant_storage_paths.sql
# using your usual Supabase migration workflow.
```

Existing data is backfilled into bootstrap tenant `slug = legacy`.

## Bootstrap a platform super admin

After auth user exists:

```sql
insert into public.platform_admins (user_id, role, display_name)
values ('<auth-user-uuid>', 'platform_owner', 'Platform Owner')
on conflict (user_id) do update
set role = excluded.role;
```

Sign in at `/login` → redirects to `/platform`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin (tenant provisioning, public site reads) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | e.g. `example.com` for `{slug}.example.com` tenant sites |
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | Fallback slug when host has no subdomain (default `legacy`) |
| Mapbox / PDF / AWS vars | Unchanged; configure per deploy |

## Tenant public sites

Resolution order:

1. Path prefix `/t/{slug}/...` (rewritten by middleware)
2. Subdomain `{slug}.{NEXT_PUBLIC_ROOT_DOMAIN}`
3. Query `?tenant={slug}`
4. Cookie / `NEXT_PUBLIC_DEFAULT_TENANT_SLUG`

**Manual DNS:** wildcard `*.yourdomain.com` → app host; TLS for wildcards (e.g. Cloudflare).

## Per-tenant branding assets

Place static packs under:

```text
public/tenants/<slug>/
  logo.png
  logo-tight.png
  mark.png
  favicon.png
  login-background.png
  hero-background.png
  feature-background.png
```

Default fallbacks live in `public/tenants/_default/`.

Runtime paths are also editable in **Settings → Branches & branding** (`tenant_branding` table). Colors are HSL channel triples (e.g. `225 75% 17%`), matching Tailwind CSS variables.

Branch-level `business_settings` still control print/contact identity (name, VAT, phones, uploaded logo).

## Creating tenants

Platform console → Create tenant (slug, name, optional owner email/password).

This creates: `tenants` + `tenant_branding` + main `branches` + `business_settings` + optional owner `staff` linked to Auth.

## Subscriptions / billing

`tenants.status`: `trial | active | past_due | suspended | canceled`.

Suspended/canceled tenants cannot sign in (staff sessions).

**Not wired yet (manual/future):** Stripe Checkout, webhooks, `billing_customer_id`, plan metering. Set status manually from the platform console.

## Catalog & masters

`units`, `brands` (product brands), `product_categories`, `suppliers`, `vehicle_makes`, `website_posts` are **tenant-scoped**. New inserts must include `tenant_id` (app actions do this).

Seed/import scripts must pass the target tenant id.

## Storage

New uploads:

```text
tenants/{tenantId}/business-logos/{branchId}/...
tenants/{tenantId}/product-images/{productId}/...
```

Legacy `business-logos/` and `product-images/` paths remain readable during migration.

## Still requires manual customization per client / deploy

- Supabase Auth redirect URLs
- Wildcard DNS + custom domains (no self-serve UI yet)
- Stripe (or other billing)
- Transactional email/SMS providers
- Mapbox token for geofence maps
- PDF/Puppeteer hosting constraints
- Quotation legal terms beyond company name (jurisdiction-specific copy)
- Currency / timezone defaults are still `PHP` / `Asia/Manila` (columns exist on `tenants` for future use)
- Partner brand logo grids on marketing pages (content, not schema)
- Initial product/service catalog import
- Google Reviews content (URLs are configurable; review quotes may still be editorial)

## Package identity

npm package name: `auto-repair-ops-platform` (neutral). Catalog import script: `scripts/import-catalog.ts` via `npm run import:catalog`.
