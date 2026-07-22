-- Default catalog units are tenant-scoped. Global unique(name)/unique(abbreviation)
-- blocked seeding the same defaults for every new tenant.

alter table public.units drop constraint if exists units_name_key;
alter table public.units drop constraint if exists units_abbreviation_key;

create unique index if not exists units_tenant_name_uidx
  on public.units (tenant_id, lower(name));

create unique index if not exists units_tenant_abbreviation_uidx
  on public.units (tenant_id, lower(abbreviation));

create or replace function public.seed_default_units_for_tenant(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if p_tenant_id is null then
    raise exception 'tenant_id is required to seed default units.';
  end if;

  insert into public.units (tenant_id, name, abbreviation)
  values
    (p_tenant_id, 'Piece', 'pc'),
    (p_tenant_id, 'Set', 'set'),
    (p_tenant_id, 'Pair', 'pair'),
    (p_tenant_id, 'Liter', 'L'),
    (p_tenant_id, 'Bottle', 'btl'),
    (p_tenant_id, 'Gallon', 'gal'),
    (p_tenant_id, 'Can', 'can')
  on conflict do nothing;
end;
$$;

revoke all on function public.seed_default_units_for_tenant(uuid) from public, anon;
grant execute on function public.seed_default_units_for_tenant(uuid) to authenticated, service_role;

-- Backfill every existing tenant (including ones that currently share no units).
do $$
declare
  v_tenant record;
begin
  for v_tenant in select id from public.tenants loop
    perform public.seed_default_units_for_tenant(v_tenant.id);
  end loop;
end;
$$;

-- Wire into SQL tenant provisioning used by RPCs / triggers.
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
