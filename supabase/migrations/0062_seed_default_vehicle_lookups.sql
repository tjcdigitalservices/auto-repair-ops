-- Per-tenant default vehicle makes/models (PH-relevant catalog, current model years).
-- Standard options (transmission / fuel / color) remain global from migration 0012.

alter table public.vehicle_makes drop constraint if exists vehicle_makes_name_key_key;

create unique index if not exists vehicle_makes_tenant_name_key_uidx
  on public.vehicle_makes (tenant_id, name_key);

create or replace function public.seed_default_vehicle_lookups_for_tenant(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_make_id uuid;
begin
  if p_tenant_id is null then
    raise exception 'tenant_id is required to seed default vehicle lookups.';
  end if;

  -- Skip if this tenant already has any makes (idempotent for partially populated tenants).
  if exists (select 1 from public.vehicle_makes where tenant_id = p_tenant_id limit 1) then
    return;
  end if;

  -- Toyota
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Toyota', 'toyota', true, 10, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Vios', 'vios', true, 10, 'active'),
    (v_make_id, 'Wigo', 'wigo', true, 20, 'active'),
    (v_make_id, 'Raize', 'raize', true, 30, 'active'),
    (v_make_id, 'Rush', 'rush', true, 40, 'active'),
    (v_make_id, 'Innova', 'innova', true, 50, 'active'),
    (v_make_id, 'Fortuner', 'fortuner', true, 60, 'active'),
    (v_make_id, 'Hilux', 'hilux', true, 70, 'active'),
    (v_make_id, 'Avanza', 'avanza', true, 80, 'active'),
    (v_make_id, 'Veloz', 'veloz', true, 90, 'active'),
    (v_make_id, 'Corolla Cross', 'corolla-cross', true, 100, 'active'),
    (v_make_id, 'Yaris Cross', 'yaris-cross', true, 110, 'active'),
    (v_make_id, 'Land Cruiser', 'land-cruiser', true, 120, 'active');

  -- Honda
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Honda', 'honda', true, 20, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'City', 'city', true, 10, 'active'),
    (v_make_id, 'Civic', 'civic', true, 20, 'active'),
    (v_make_id, 'Brio', 'brio', true, 30, 'active'),
    (v_make_id, 'BR-V', 'br-v', true, 40, 'active'),
    (v_make_id, 'CR-V', 'cr-v', true, 50, 'active'),
    (v_make_id, 'HR-V', 'hr-v', true, 60, 'active'),
    (v_make_id, 'Accord', 'accord', true, 70, 'active'),
    (v_make_id, 'Pilot', 'pilot', true, 80, 'active');

  -- Mitsubishi
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Mitsubishi', 'mitsubishi', true, 30, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Mirage', 'mirage', true, 10, 'active'),
    (v_make_id, 'Mirage G4', 'mirage-g4', true, 20, 'active'),
    (v_make_id, 'Xpander', 'xpander', true, 30, 'active'),
    (v_make_id, 'Xpander Cross', 'xpander-cross', true, 40, 'active'),
    (v_make_id, 'Montero Sport', 'montero-sport', true, 50, 'active'),
    (v_make_id, 'Triton', 'triton', true, 60, 'active'),
    (v_make_id, 'L300', 'l300', true, 70, 'active');

  -- Nissan
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Nissan', 'nissan', true, 40, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Almera', 'almera', true, 10, 'active'),
    (v_make_id, 'Navara', 'navara', true, 20, 'active'),
    (v_make_id, 'Terra', 'terra', true, 30, 'active'),
    (v_make_id, 'Kicks', 'kicks', true, 40, 'active'),
    (v_make_id, 'Livina', 'livina', true, 50, 'active'),
    (v_make_id, 'Patrol', 'patrol', true, 60, 'active');

  -- Ford
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Ford', 'ford', true, 50, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Ranger', 'ranger', true, 10, 'active'),
    (v_make_id, 'Everest', 'everest', true, 20, 'active'),
    (v_make_id, 'Territory', 'territory', true, 30, 'active'),
    (v_make_id, 'Explorer', 'explorer', true, 40, 'active'),
    (v_make_id, 'Mustang', 'mustang', true, 50, 'active');

  -- Hyundai
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Hyundai', 'hyundai', true, 60, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Accent', 'accent', true, 10, 'active'),
    (v_make_id, 'Reina', 'reina', true, 20, 'active'),
    (v_make_id, 'Stargazer', 'stargazer', true, 30, 'active'),
    (v_make_id, 'Creta', 'creta', true, 40, 'active'),
    (v_make_id, 'Tucson', 'tucson', true, 50, 'active'),
    (v_make_id, 'Santa Fe', 'santa-fe', true, 60, 'active'),
    (v_make_id, 'Staria', 'staria', true, 70, 'active');

  -- Kia
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Kia', 'kia', true, 70, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Soluto', 'soluto', true, 10, 'active'),
    (v_make_id, 'Rio', 'rio', true, 20, 'active'),
    (v_make_id, 'Seltos', 'seltos', true, 30, 'active'),
    (v_make_id, 'Sportage', 'sportage', true, 40, 'active'),
    (v_make_id, 'Sorento', 'sorento', true, 50, 'active'),
    (v_make_id, 'Carnival', 'carnival', true, 60, 'active');

  -- Suzuki
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Suzuki', 'suzuki', true, 80, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Swift', 'swift', true, 10, 'active'),
    (v_make_id, 'Dzire', 'dzire', true, 20, 'active'),
    (v_make_id, 'Ertiga', 'ertiga', true, 30, 'active'),
    (v_make_id, 'XL7', 'xl7', true, 40, 'active'),
    (v_make_id, 'Jimny', 'jimny', true, 50, 'active'),
    (v_make_id, 'S-Presso', 's-presso', true, 60, 'active');

  -- Mazda
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Mazda', 'mazda', true, 90, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Mazda2', 'mazda2', true, 10, 'active'),
    (v_make_id, 'Mazda3', 'mazda3', true, 20, 'active'),
    (v_make_id, 'CX-3', 'cx-3', true, 30, 'active'),
    (v_make_id, 'CX-5', 'cx-5', true, 40, 'active'),
    (v_make_id, 'CX-30', 'cx-30', true, 50, 'active'),
    (v_make_id, 'CX-60', 'cx-60', true, 60, 'active'),
    (v_make_id, 'BT-50', 'bt-50', true, 70, 'active');

  -- Isuzu
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Isuzu', 'isuzu', true, 100, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'D-Max', 'd-max', true, 10, 'active'),
    (v_make_id, 'mu-X', 'mu-x', true, 20, 'active'),
    (v_make_id, 'Traviz', 'traviz', true, 30, 'active');

  -- Chevrolet
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Chevrolet', 'chevrolet', true, 110, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Spark', 'spark', true, 10, 'active'),
    (v_make_id, 'Sail', 'sail', true, 20, 'active'),
    (v_make_id, 'Trailblazer', 'trailblazer', true, 30, 'active'),
    (v_make_id, 'Colorado', 'colorado', true, 40, 'active');

  -- MG
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'MG', 'mg', true, 120, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'MG5', 'mg5', true, 10, 'active'),
    (v_make_id, 'ZS', 'zs', true, 20, 'active'),
    (v_make_id, 'HS', 'hs', true, 30, 'active'),
    (v_make_id, 'GT', 'gt', true, 40, 'active'),
    (v_make_id, 'One', 'one', true, 50, 'active');

  -- Geely
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Geely', 'geely', true, 130, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Coolray', 'coolray', true, 10, 'active'),
    (v_make_id, 'Okavango', 'okavango', true, 20, 'active'),
    (v_make_id, 'Emgrand', 'emgrand', true, 30, 'active'),
    (v_make_id, 'GX3 Pro', 'gx3-pro', true, 40, 'active');

  -- BYD
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'BYD', 'byd', true, 140, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Atto 3', 'atto-3', true, 10, 'active'),
    (v_make_id, 'Seal', 'seal', true, 20, 'active'),
    (v_make_id, 'Dolphin', 'dolphin', true, 30, 'active'),
    (v_make_id, 'Shark', 'shark', true, 40, 'active'),
    (v_make_id, 'Sealion 6', 'sealion-6', true, 50, 'active');

  -- Changan
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Changan', 'changan', true, 150, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Alsvin', 'alsvin', true, 10, 'active'),
    (v_make_id, 'CS35 Plus', 'cs35-plus', true, 20, 'active'),
    (v_make_id, 'CS55 Plus', 'cs55-plus', true, 30, 'active'),
    (v_make_id, 'UNI-T', 'uni-t', true, 40, 'active');

  -- Subaru
  insert into public.vehicle_makes (tenant_id, name, name_key, is_seeded, sort_order, status)
  values (p_tenant_id, 'Subaru', 'subaru', true, 160, 'active')
  returning id into v_make_id;
  insert into public.vehicle_models (make_id, name, name_key, is_seeded, sort_order, status)
  values
    (v_make_id, 'Forester', 'forester', true, 10, 'active'),
    (v_make_id, 'XV', 'xv', true, 20, 'active'),
    (v_make_id, 'Outback', 'outback', true, 30, 'active'),
    (v_make_id, 'WRX', 'wrx', true, 40, 'active');
end;
$$;

revoke all on function public.seed_default_vehicle_lookups_for_tenant(uuid) from public, anon;
grant execute on function public.seed_default_vehicle_lookups_for_tenant(uuid) to authenticated, service_role;

-- Backfill existing tenants that have no makes yet.
do $$
declare
  v_tenant record;
begin
  for v_tenant in select id from public.tenants loop
    perform public.seed_default_vehicle_lookups_for_tenant(v_tenant.id);
  end loop;
end;
$$;

-- Ensure transmission / fuel / color global defaults stay complete.
insert into public.vehicle_lookup_options (lookup_type, label, value_key, sort_order)
values
  ('transmission', 'Automatic', 'automatic', 10),
  ('transmission', 'Manual', 'manual', 20),
  ('transmission', 'CVT', 'cvt', 30),
  ('transmission', 'DCT', 'dct', 40),
  ('fuel_type', 'Gasoline', 'gasoline', 10),
  ('fuel_type', 'Diesel', 'diesel', 20),
  ('fuel_type', 'Hybrid', 'hybrid', 30),
  ('fuel_type', 'Electric', 'electric', 40),
  ('fuel_type', 'LPG', 'lpg', 50),
  ('fuel_type', 'Plug-in Hybrid', 'plug-in-hybrid', 60),
  ('color', 'White', 'white', 10),
  ('color', 'Black', 'black', 20),
  ('color', 'Silver', 'silver', 30),
  ('color', 'Gray', 'gray', 40),
  ('color', 'Blue', 'blue', 50),
  ('color', 'Red', 'red', 60),
  ('color', 'Green', 'green', 70),
  ('color', 'Brown', 'brown', 80),
  ('color', 'Orange', 'orange', 90),
  ('color', 'Pearl White', 'pearl-white', 100)
on conflict (lookup_type, value_key) do nothing;

-- Wire into SQL tenant provisioning.
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
set row_security = off
as $$
declare
  v_tenant_id uuid;
  v_branch_id uuid;
  v_staff_id uuid;
begin
  if not public.is_platform_admin() and coalesce(auth.role(), '') <> 'service_role' then
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

  insert into public.document_sequences (
    key,
    branch_id,
    prefix,
    padding,
    last_value
  )
  values
    ('quotation', v_branch_id, 'QT-', 4, 0),
    ('job_order', v_branch_id, 'JO-', 4, 0),
    ('invoice', v_branch_id, 'INV-', 4, 0),
    ('sale', v_branch_id, 'POS-', 4, 0),
    ('staff', v_branch_id, 'EMP-', 4, 0)
  on conflict (key, branch_id) do nothing;

  perform public.seed_default_units_for_tenant(v_tenant_id);
  perform public.seed_default_vehicle_lookups_for_tenant(v_tenant_id);

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
