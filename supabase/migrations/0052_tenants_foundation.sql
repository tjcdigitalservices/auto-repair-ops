-- Multi-tenant SaaS foundation: tenants above branches, platform admins, branding.

create type public.tenant_status as enum (
  'trial',
  'active',
  'past_due',
  'suspended',
  'canceled'
);

create type public.platform_admin_role as enum (
  'platform_owner',
  'platform_support'
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  status public.tenant_status not null default 'trial',
  plan_key text not null default 'starter',
  trial_ends_at timestamptz,
  billing_customer_id text,
  currency_code text not null default 'PHP',
  timezone text not null default 'Asia/Manila',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tenants_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tenants_slug_unique unique (slug)
);

create trigger set_tenants_updated_at
before update on public.tenants
for each row
execute function public.set_updated_at();

create table if not exists public.tenant_branding (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  app_name text not null default 'Auto Repair Ops',
  company_name text not null default 'Auto Repair Shop',
  support_email text,
  phone text,
  address text,
  primary_color text not null default '225 75% 17%',
  primary_color_strong text not null default '225 74% 12%',
  primary_color_hover text not null default '220 77% 19%',
  accent_color text not null default '0 69% 50%',
  accent_color_dark text not null default '0 72% 42%',
  soft_color text not null default '214 60% 95%',
  border_color text not null default '220 18% 91%',
  font_sans text not null default 'Space Grotesk',
  font_display text not null default 'Barlow Condensed',
  logo_path text,
  logo_tight_path text,
  mark_path text,
  favicon_path text,
  login_background_path text,
  hero_background_path text,
  feature_background_path text,
  facebook_url text,
  facebook_label text,
  maps_url text,
  website_url text,
  google_reviews_url text,
  store_hours jsonb not null default '[
    {"day":"Monday","hours":"7:00 AM – 5:00 PM"},
    {"day":"Tuesday","hours":"7:00 AM – 5:00 PM"},
    {"day":"Wednesday","hours":"7:00 AM – 5:00 PM"},
    {"day":"Thursday","hours":"7:00 AM – 5:00 PM"},
    {"day":"Friday","hours":"7:00 AM – 5:00 PM"},
    {"day":"Saturday","hours":"7:00 AM – 5:00 PM"},
    {"day":"Sunday","hours":"Closed"}
  ]'::jsonb,
  meta_title text,
  meta_description text,
  tagline text,
  receipt_footer_default text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_tenant_branding_updated_at
before update on public.tenant_branding
for each row
execute function public.set_updated_at();

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.platform_admin_role not null default 'platform_support',
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_platform_admins_updated_at
before update on public.platform_admins
for each row
execute function public.set_updated_at();

-- Bootstrap tenant for existing data
insert into public.tenants (id, slug, name, status, plan_key)
values (
  '00000000-0000-4000-8000-000000000001',
  'legacy',
  'Legacy Shop',
  'active',
  'starter'
)
on conflict (slug) do nothing;

insert into public.tenant_branding (
  tenant_id,
  app_name,
  company_name,
  meta_title,
  meta_description,
  tagline,
  receipt_footer_default,
  logo_path,
  logo_tight_path,
  mark_path,
  favicon_path
)
select
  t.id,
  'Auto Repair Ops',
  coalesce(
    (select bs.business_name from public.business_settings bs order by bs.id limit 1),
    'Auto Repair Shop'
  ),
  'Auto Repair Ops',
  'Workshop operations and customer website.',
  'Precision service for every vehicle.',
  'Thank you for your business.',
  '/tenants/_default/logo.png',
  '/tenants/_default/logo-tight.png',
  '/tenants/_default/mark.png',
  '/tenants/_default/favicon.png'
from public.tenants t
where t.slug = 'legacy'
on conflict (tenant_id) do nothing;

-- Attach branches + staff to tenant
alter table public.branches
  add column if not exists tenant_id uuid references public.tenants(id) on delete restrict;

update public.branches
set tenant_id = '00000000-0000-4000-8000-000000000001'
where tenant_id is null;

alter table public.branches
  alter column tenant_id set not null;

alter table public.staff
  add column if not exists tenant_id uuid references public.tenants(id) on delete restrict;

update public.staff s
set tenant_id = b.tenant_id
from public.branches b
where s.branch_id = b.id
  and s.tenant_id is null;

update public.staff
set tenant_id = '00000000-0000-4000-8000-000000000001'
where tenant_id is null;

alter table public.staff
  alter column tenant_id set not null;

-- Branch uniqueness: code unique per tenant; one main per tenant
alter table public.branches drop constraint if exists branches_code_key;
drop index if exists public.branches_code_key;

create unique index if not exists branches_tenant_code_uidx
  on public.branches (tenant_id, code);

drop index if exists public.branches_one_main_idx;
create unique index if not exists branches_one_main_per_tenant_idx
  on public.branches (tenant_id)
  where is_main = true;

-- Master / shared tables: tenant scope
alter table public.units
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.brands
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.product_categories
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.suppliers
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.vehicle_makes
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

alter table public.website_posts
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

update public.units set tenant_id = '00000000-0000-4000-8000-000000000001' where tenant_id is null;
update public.brands set tenant_id = '00000000-0000-4000-8000-000000000001' where tenant_id is null;
update public.product_categories set tenant_id = '00000000-0000-4000-8000-000000000001' where tenant_id is null;
update public.suppliers set tenant_id = '00000000-0000-4000-8000-000000000001' where tenant_id is null;
update public.vehicle_makes set tenant_id = '00000000-0000-4000-8000-000000000001' where tenant_id is null;
update public.website_posts set tenant_id = '00000000-0000-4000-8000-000000000001' where tenant_id is null;

alter table public.units alter column tenant_id set not null;
alter table public.brands alter column tenant_id set not null;
alter table public.product_categories alter column tenant_id set not null;
alter table public.suppliers alter column tenant_id set not null;
alter table public.vehicle_makes alter column tenant_id set not null;
alter table public.website_posts alter column tenant_id set not null;

-- Auth helpers
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

create or replace function public.current_tenant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select s.tenant_id
  from public.staff s
  where s.linked_user_id = auth.uid()
    and s.status = 'active'
  limit 1;
$$;

create or replace function public.can_access_tenant(p_tenant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    p_tenant_id is not null
    and (
      public.is_platform_admin()
      or p_tenant_id = public.current_tenant_id()
    );
$$;

create or replace function public.has_global_branch_access()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff s
    where s.linked_user_id = auth.uid()
      and s.status = 'active'
      and s.role = 'owner'
  )
  or public.is_platform_admin();
$$;

create or replace function public.can_access_branch(p_branch_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    p_branch_id is not null
    and (
      public.is_platform_admin()
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

create or replace function public.tenant_is_operable(p_tenant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.tenants t
    where t.id = p_tenant_id
      and t.status in ('trial', 'active', 'past_due')
  );
$$;

-- Provision branch defaults from tenant main branch
create or replace function public.provision_branch_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_main_branch_id uuid;
begin
  select id
  into v_main_branch_id
  from public.branches
  where tenant_id = new.tenant_id
    and is_main = true
  limit 1;

  if v_main_branch_id is null then
    return new;
  end if;

  insert into public.business_settings (
    branch_id,
    allow_partial_payments,
    allow_release_with_balance,
    require_full_payment_before_release,
    require_additional_item_preapproval,
    require_shop_ip_for_mechanic_attendance,
    allow_dtr_amendments,
    allow_attendance_admin_override,
    enable_barcode_support,
    enable_shelf_location,
    default_tax_rate,
    business_name,
    business_logo_path,
    business_address,
    business_contact,
    business_email,
    business_vat_registration_no,
    receipt_footer
  )
  select
    new.id,
    main_settings.allow_partial_payments,
    main_settings.allow_release_with_balance,
    main_settings.require_full_payment_before_release,
    main_settings.require_additional_item_preapproval,
    main_settings.require_shop_ip_for_mechanic_attendance,
    main_settings.allow_dtr_amendments,
    main_settings.allow_attendance_admin_override,
    main_settings.enable_barcode_support,
    main_settings.enable_shelf_location,
    main_settings.default_tax_rate,
    main_settings.business_name,
    main_settings.business_logo_path,
    main_settings.business_address,
    main_settings.business_contact,
    main_settings.business_email,
    main_settings.business_vat_registration_no,
    main_settings.receipt_footer
  from public.business_settings as main_settings
  where main_settings.branch_id = v_main_branch_id
  on conflict (branch_id) do nothing;

  insert into public.document_sequences (
    key,
    branch_id,
    prefix,
    padding,
    last_value
  )
  select
    main_sequence.key,
    new.id,
    main_sequence.prefix,
    main_sequence.padding,
    0
  from public.document_sequences as main_sequence
  where main_sequence.branch_id = v_main_branch_id
  on conflict (key, branch_id) do nothing;

  return new;
end;
$$;

-- Sync staff.tenant_id from branch on insert/update
create or replace function public.sync_staff_tenant_from_branch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.branch_id is not null then
    select b.tenant_id into new.tenant_id
    from public.branches b
    where b.id = new.branch_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_staff_tenant_from_branch on public.staff;
create trigger sync_staff_tenant_from_branch
before insert or update of branch_id on public.staff
for each row
execute function public.sync_staff_tenant_from_branch();

-- Tenant provisioning helper used by platform admin API
create or replace function public.provision_tenant(
  p_slug text,
  p_name text,
  p_owner_email text default null,
  p_owner_first_name text default 'Owner',
  p_owner_last_name text default 'Account',
  p_owner_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_branch_id uuid;
  v_staff_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform admins can provision tenants.';
  end if;

  insert into public.tenants (slug, name, status, plan_key, trial_ends_at)
  values (p_slug, p_name, 'trial', 'starter', timezone('utc', now()) + interval '14 days')
  returning id into v_tenant_id;

  insert into public.tenant_branding (
    tenant_id,
    app_name,
    company_name,
    meta_title,
    meta_description,
    tagline,
    receipt_footer_default
  )
  values (
    v_tenant_id,
    p_name,
    p_name,
    p_name,
    p_name || ' workshop operations.',
    'Precision service for every vehicle.',
    'Thank you for your business.'
  );

  insert into public.branches (
    tenant_id,
    code,
    name,
    is_main,
    is_active,
    is_default,
    status
  )
  values (
    v_tenant_id,
    'MAIN',
    'Main Branch',
    true,
    true,
    true,
    'active'
  )
  returning id into v_branch_id;

  insert into public.business_settings (
    branch_id,
    business_name,
    receipt_footer,
    default_tax_rate
  )
  values (
    v_branch_id,
    p_name,
    'Thank you for your business.',
    0.12
  )
  on conflict (branch_id) do update
  set business_name = excluded.business_name;

  if p_owner_user_id is not null or p_owner_email is not null then
    insert into public.staff (
      tenant_id,
      branch_id,
      linked_user_id,
      first_name,
      last_name,
      role,
      status
    )
    values (
      v_tenant_id,
      v_branch_id,
      p_owner_user_id,
      p_owner_first_name,
      p_owner_last_name,
      'owner',
      'active'
    )
    returning id into v_staff_id;
  end if;

  return v_tenant_id;
end;
$$;

-- RLS
alter table public.tenants enable row level security;
alter table public.tenant_branding enable row level security;
alter table public.platform_admins enable row level security;

drop policy if exists tenants_select on public.tenants;
create policy tenants_select
on public.tenants
for select
to authenticated
using (
  public.is_platform_admin()
  or id = public.current_tenant_id()
);

drop policy if exists tenants_update_platform on public.tenants;
create policy tenants_update_platform
on public.tenants
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists tenants_insert_platform on public.tenants;
create policy tenants_insert_platform
on public.tenants
for insert
to authenticated
with check (public.is_platform_admin());

drop policy if exists tenant_branding_select on public.tenant_branding;
create policy tenant_branding_select
on public.tenant_branding
for select
to authenticated
using (
  public.is_platform_admin()
  or tenant_id = public.current_tenant_id()
);

drop policy if exists tenant_branding_select_anon on public.tenant_branding;
create policy tenant_branding_select_anon
on public.tenant_branding
for select
to anon
using (true);

drop policy if exists tenants_select_anon on public.tenants;
create policy tenants_select_anon
on public.tenants
for select
to anon
using (status in ('trial', 'active', 'past_due'));

drop policy if exists tenant_branding_write on public.tenant_branding;
create policy tenant_branding_write
on public.tenant_branding
for all
to authenticated
using (
  public.is_platform_admin()
  or (
    tenant_id = public.current_tenant_id()
    and public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  )
)
with check (
  public.is_platform_admin()
  or (
    tenant_id = public.current_tenant_id()
    and public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  )
);

drop policy if exists platform_admins_select on public.platform_admins;
create policy platform_admins_select
on public.platform_admins
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_platform_admin()
);

-- Do not use FOR ALL here: nested EXISTS on platform_admins re-enters RLS on SELECT.
drop policy if exists platform_admins_write on public.platform_admins;
drop policy if exists platform_admins_insert on public.platform_admins;
drop policy if exists platform_admins_update on public.platform_admins;
drop policy if exists platform_admins_delete on public.platform_admins;

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

-- Branch policies: allow tenant owners to insert/update branches in their tenant
drop policy if exists branches_select_active_staff on public.branches;
create policy branches_select_active_staff
on public.branches
for select
to authenticated
using (
  public.is_platform_admin()
  or (
    tenant_id = public.current_tenant_id()
    and (
      public.has_global_branch_access()
      or id = public.current_staff_branch_id()
    )
  )
);

drop policy if exists branches_insert_tenant_owner on public.branches;
create policy branches_insert_tenant_owner
on public.branches
for insert
to authenticated
with check (
  public.is_platform_admin()
  or (
    tenant_id = public.current_tenant_id()
    and public.has_any_staff_role(array['owner']::public.staff_role[])
  )
);

drop policy if exists branches_update_tenant_owner on public.branches;
create policy branches_update_tenant_owner
on public.branches
for update
to authenticated
using (
  public.is_platform_admin()
  or (
    tenant_id = public.current_tenant_id()
    and public.has_any_staff_role(array['owner']::public.staff_role[])
  )
)
with check (
  public.is_platform_admin()
  or (
    tenant_id = public.current_tenant_id()
    and public.has_any_staff_role(array['owner']::public.staff_role[])
  )
);

-- Tenant-scoped catalog policies (append tenant check to existing patterns)
drop policy if exists brands_select_authenticated on public.brands;
drop policy if exists brands_all_admin on public.brands;
create policy brands_tenant_select
on public.brands for select to authenticated
using (public.can_access_tenant(tenant_id));
create policy brands_tenant_write
on public.brands for all to authenticated
using (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
)
with check (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
);

drop policy if exists units_select_authenticated on public.units;
drop policy if exists units_all_admin on public.units;
create policy units_tenant_select
on public.units for select to authenticated
using (public.can_access_tenant(tenant_id));
create policy units_tenant_write
on public.units for all to authenticated
using (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
)
with check (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
);

drop policy if exists product_categories_select_authenticated on public.product_categories;
drop policy if exists product_categories_all_admin on public.product_categories;
create policy product_categories_tenant_select
on public.product_categories for select to authenticated
using (public.can_access_tenant(tenant_id));
create policy product_categories_tenant_write
on public.product_categories for all to authenticated
using (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
)
with check (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
);

drop policy if exists suppliers_select_team on public.suppliers;
drop policy if exists suppliers_write_admin on public.suppliers;
create policy suppliers_tenant_select
on public.suppliers for select to authenticated
using (public.can_access_tenant(tenant_id));
create policy suppliers_tenant_write
on public.suppliers for all to authenticated
using (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
)
with check (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
);

drop policy if exists vehicle_makes_select_authenticated on public.vehicle_makes;
drop policy if exists vehicle_makes_write_admin on public.vehicle_makes;
create policy vehicle_makes_tenant_select
on public.vehicle_makes for select to authenticated
using (public.can_access_tenant(tenant_id));
create policy vehicle_makes_tenant_write
on public.vehicle_makes for all to authenticated
using (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
)
with check (
  public.can_access_tenant(tenant_id)
  and public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
);

drop policy if exists website_posts_select_published on public.website_posts;
drop policy if exists website_posts_select_admin on public.website_posts;
drop policy if exists website_posts_write_admin on public.website_posts;
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
revoke all on function public.is_platform_owner() from public, anon;
revoke all on function public.current_tenant_id() from public, anon;
revoke all on function public.can_access_tenant(uuid) from public, anon;
revoke all on function public.tenant_is_operable(uuid) from public, anon;
revoke all on function public.provision_tenant(text, text, text, text, text, uuid) from public, anon, authenticated;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_platform_owner() to authenticated;
grant execute on function public.current_tenant_id() to authenticated, anon;
grant execute on function public.can_access_tenant(uuid) to authenticated;
grant execute on function public.tenant_is_operable(uuid) to authenticated;
grant execute on function public.provision_tenant(text, text, text, text, text, uuid) to authenticated;

grant select on public.tenants to anon, authenticated;
grant select on public.tenant_branding to anon, authenticated;
