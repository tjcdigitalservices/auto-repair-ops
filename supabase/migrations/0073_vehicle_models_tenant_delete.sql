-- vehicle_makes got tenant-scoped "for all" policies in 0052; vehicle_models still
-- only had insert/update from 0012, so DELETE was blocked at the database layer.

drop policy if exists vehicle_models_select_active_staff on public.vehicle_models;
drop policy if exists vehicle_models_insert_admin on public.vehicle_models;
drop policy if exists vehicle_models_update_admin on public.vehicle_models;

drop policy if exists vehicle_models_tenant_select on public.vehicle_models;
create policy vehicle_models_tenant_select
on public.vehicle_models
for select
to authenticated
using (
  exists (
    select 1
    from public.vehicle_makes vm
    where vm.id = vehicle_models.make_id
      and public.can_access_tenant(vm.tenant_id)
  )
);

drop policy if exists vehicle_models_tenant_write on public.vehicle_models;
create policy vehicle_models_tenant_write
on public.vehicle_models
for all
to authenticated
using (
  exists (
    select 1
    from public.vehicle_makes vm
    where vm.id = vehicle_models.make_id
      and public.can_access_tenant(vm.tenant_id)
      and public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  )
)
with check (
  exists (
    select 1
    from public.vehicle_makes vm
    where vm.id = vehicle_models.make_id
      and public.can_access_tenant(vm.tenant_id)
      and public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  )
);
