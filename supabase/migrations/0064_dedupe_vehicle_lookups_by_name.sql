-- One-time cleanup for duplicate vehicle makes/models.
-- Goal: keep one canonical active row per tenant+make name and per tenant+make name+model name.
-- Notes:
-- - Deactivates extras (does not delete).
-- - Re-merges vehicle_models across duplicate vehicle_makes even when name_key differs,
--   matching by normalized display names instead.

-- Merge duplicate makes and re-point models to the canonical make.
WITH ranked_makes AS (
  SELECT
    id,
    tenant_id,
    lower(trim(name)) AS make_name_norm,
    status,
    sort_order,
    created_at,
    row_number() OVER (
      PARTITION BY tenant_id, lower(trim(name))
      ORDER BY
        CASE status WHEN 'active' THEN 0 ELSE 1 END,
        sort_order ASC,
        created_at ASC,
        id ASC
    ) AS rn
  FROM public.vehicle_makes
),
canonical_makes AS (
  SELECT id AS canonical_make_id, tenant_id, make_name_norm
  FROM ranked_makes
  WHERE rn = 1
),
duplicate_makes AS (
  SELECT id AS duplicate_make_id, tenant_id, make_name_norm
  FROM ranked_makes
  WHERE rn > 1
),
models_to_consider AS (
  SELECT
    vm.id AS model_id,
    cm.canonical_make_id,
    lower(trim(vm.name)) AS model_name_norm
  FROM public.vehicle_models vm
  JOIN duplicate_makes dm
    ON dm.duplicate_make_id = vm.make_id
  JOIN canonical_makes cm
    ON cm.tenant_id = dm.tenant_id
   AND cm.make_name_norm = dm.make_name_norm
),
models_to_move AS (
  SELECT
    mtc.model_id,
    mtc.canonical_make_id
  FROM models_to_consider mtc
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.vehicle_models existing
    WHERE existing.make_id = mtc.canonical_make_id
      AND lower(trim(existing.name)) = mtc.model_name_norm
  )
)
UPDATE public.vehicle_models vm
SET make_id = mtm.canonical_make_id
FROM models_to_move mtm
WHERE vm.id = mtm.model_id;

-- If there are active duplicate models (on duplicate makes) but the canonical make's
-- model with the same normalized name is currently inactive, activate one canonical
-- record so the tenant+make+model combination retains an active row.
WITH ranked_makes AS (
  SELECT
    id,
    tenant_id,
    lower(trim(name)) AS make_name_norm,
    status,
    sort_order,
    created_at,
    row_number() OVER (
      PARTITION BY tenant_id, lower(trim(name))
      ORDER BY
        CASE status WHEN 'active' THEN 0 ELSE 1 END,
        sort_order ASC,
        created_at ASC,
        id ASC
    ) AS rn
  FROM public.vehicle_makes
),
canonical_makes AS (
  SELECT id AS canonical_make_id, tenant_id, make_name_norm
  FROM ranked_makes
  WHERE rn = 1
),
duplicate_makes AS (
  SELECT id AS duplicate_make_id, tenant_id, make_name_norm
  FROM ranked_makes
  WHERE rn > 1
),
active_duplicate_model_groups AS (
  SELECT
    dm.tenant_id,
    dm.make_name_norm,
    lower(trim(vm_dup.name)) AS model_name_norm
  FROM public.vehicle_models vm_dup
  JOIN duplicate_makes dm
    ON dm.duplicate_make_id = vm_dup.make_id
  WHERE vm_dup.status = 'active'
  GROUP BY dm.tenant_id, dm.make_name_norm, lower(trim(vm_dup.name))
),
canonical_models_to_activate AS (
  SELECT
    vm_can.id,
    row_number() OVER (
      PARTITION BY vm_can.make_id, lower(trim(vm_can.name))
      ORDER BY
        CASE vm_can.status WHEN 'active' THEN 0 ELSE 1 END,
        vm_can.sort_order ASC,
        vm_can.created_at ASC,
        vm_can.id ASC
    ) AS rn
  FROM public.vehicle_models vm_can
  JOIN canonical_makes cm
    ON cm.canonical_make_id = vm_can.make_id
  JOIN active_duplicate_model_groups g
    ON g.tenant_id = cm.tenant_id
   AND g.make_name_norm = cm.make_name_norm
   AND lower(trim(vm_can.name)) = g.model_name_norm
)
UPDATE public.vehicle_models vm
SET status = 'active'
WHERE vm.id IN (
  SELECT id
  FROM canonical_models_to_activate
  WHERE rn = 1
);

-- Deactivate any remaining models still pointing at duplicate makes.
WITH ranked_makes AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY tenant_id, lower(trim(name))
      ORDER BY
        CASE status WHEN 'active' THEN 0 ELSE 1 END,
        sort_order ASC,
        created_at ASC,
        id ASC
    ) AS rn
  FROM public.vehicle_makes
)
UPDATE public.vehicle_models vm
SET status = 'inactive'
FROM ranked_makes rm
WHERE vm.make_id = rm.id
  AND rm.rn > 1;

-- Deactivate duplicate makes after models have been re-pointed.
WITH ranked_makes AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY tenant_id, lower(trim(name))
      ORDER BY
        CASE status WHEN 'active' THEN 0 ELSE 1 END,
        sort_order ASC,
        created_at ASC,
        id ASC
    ) AS rn
  FROM public.vehicle_makes
)
UPDATE public.vehicle_makes vm
SET status = 'inactive'
FROM ranked_makes rm
WHERE vm.id = rm.id
  AND rm.rn > 1;

-- Finally, within each make_id, keep only one active model per normalized model name.
WITH ranked_models AS (
  SELECT
    id,
    make_id,
    lower(trim(name)) AS model_name_norm,
    status,
    sort_order,
    created_at,
    row_number() OVER (
      PARTITION BY make_id, lower(trim(name))
      ORDER BY
        CASE status WHEN 'active' THEN 0 ELSE 1 END,
        sort_order ASC,
        created_at ASC,
        id ASC
    ) AS rn
  FROM public.vehicle_models
)
UPDATE public.vehicle_models vm
SET status = 'inactive'
FROM ranked_models rm
WHERE vm.id = rm.id
  AND rm.rn > 1;

