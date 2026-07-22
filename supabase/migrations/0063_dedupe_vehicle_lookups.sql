-- One-time cleanup for duplicate vehicle makes/models (e.g. repeated vPIC/import runs).
-- Keeps one canonical active row per tenant+make name and per make+model name.

create unique index if not exists vehicle_makes_tenant_name_key_uidx
  on public.vehicle_makes (tenant_id, name_key);

-- 1) Merge duplicate makes (same tenant + display name), then deactivate extras.
with ranked_makes as (
  select
    id,
    tenant_id,
    lower(trim(name)) as name_norm,
    row_number() over (
      partition by tenant_id, lower(trim(name))
      order by
        case status when 'active' then 0 else 1 end,
        sort_order asc,
        created_at asc,
        id asc
    ) as rn
  from public.vehicle_makes
),
canonical_makes as (
  select id as canonical_id, tenant_id, name_norm
  from ranked_makes
  where rn = 1
),
duplicate_makes as (
  select rm.id as duplicate_id, cm.canonical_id
  from ranked_makes rm
  inner join canonical_makes cm
    on cm.tenant_id = rm.tenant_id
   and cm.name_norm = rm.name_norm
  where rm.rn > 1
)
update public.vehicle_models vm
set make_id = dm.canonical_id
from duplicate_makes dm
where vm.make_id = dm.duplicate_id
  and not exists (
    select 1
    from public.vehicle_models existing
    where existing.make_id = dm.canonical_id
      and existing.name_key = vm.name_key
      and existing.id <> vm.id
  );

with ranked_makes as (
  select
    id,
    tenant_id,
    lower(trim(name)) as name_norm,
    row_number() over (
      partition by tenant_id, lower(trim(name))
      order by
        case status when 'active' then 0 else 1 end,
        sort_order asc,
        created_at asc,
        id asc
    ) as rn
  from public.vehicle_makes
),
canonical_makes as (
  select id as canonical_id, tenant_id, name_norm
  from ranked_makes
  where rn = 1
),
duplicate_makes as (
  select rm.id as duplicate_id, cm.canonical_id
  from ranked_makes rm
  inner join canonical_makes cm
    on cm.tenant_id = rm.tenant_id
   and cm.name_norm = rm.name_norm
  where rm.rn > 1
)
update public.vehicle_models vm
set status = 'inactive'
from duplicate_makes dm
where vm.make_id = dm.duplicate_id;

with ranked_makes as (
  select
    id,
    tenant_id,
    lower(trim(name)) as name_norm,
    row_number() over (
      partition by tenant_id, lower(trim(name))
      order by
        case status when 'active' then 0 else 1 end,
        sort_order asc,
        created_at asc,
        id asc
    ) as rn
  from public.vehicle_makes
)
update public.vehicle_makes vm
set status = 'inactive'
from ranked_makes rm
where vm.id = rm.id
  and rm.rn > 1;

-- 2) Deactivate duplicate models (same make + model display name).
with ranked_models as (
  select
    id,
    make_id,
    lower(trim(name)) as name_norm,
    row_number() over (
      partition by make_id, lower(trim(name))
      order by
        case status when 'active' then 0 else 1 end,
        sort_order asc,
        created_at asc,
        id asc
    ) as rn
  from public.vehicle_models
)
update public.vehicle_models vm
set status = 'inactive'
from ranked_models rm
where vm.id = rm.id
  and rm.rn > 1;

-- 3) Deactivate duplicate models (same make + name_key), in case keys differ but names match.
with ranked_models as (
  select
    id,
    make_id,
    name_key,
    row_number() over (
      partition by make_id, name_key
      order by
        case status when 'active' then 0 else 1 end,
        sort_order asc,
        created_at asc,
        id asc
    ) as rn
  from public.vehicle_models
)
update public.vehicle_models vm
set status = 'inactive'
from ranked_models rm
where vm.id = rm.id
  and rm.rn > 1;
