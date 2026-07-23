-- Quotation revision chain for approved quotations.

create or replace function public.strip_quotation_revision_suffix(p_value text)
returns text
language sql
immutable
as $$
  select regexp_replace(trim(p_value), '\s+Rev\.\d+$', '');
$$;

alter table public.quotations
  add column if not exists root_quotation_id uuid references public.quotations(id) on delete restrict,
  add column if not exists parent_quotation_id uuid references public.quotations(id) on delete restrict,
  add column if not exists revision_number integer not null default 0,
  add column if not exists is_current_revision boolean not null default true,
  add column if not exists base_quotation_number text;

update public.quotations
set
  root_quotation_id = id,
  base_quotation_number = public.strip_quotation_revision_suffix(quotation_number)
where root_quotation_id is null;

create index if not exists quotations_root_quotation_id_idx
  on public.quotations (root_quotation_id);

create index if not exists quotations_parent_quotation_id_idx
  on public.quotations (parent_quotation_id);

create or replace function public.create_quotation_revision_impl(
  p_quotation_id uuid,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.quotations%rowtype;
  v_root_id uuid;
  v_base_number text;
  v_next_revision integer;
  v_new_id uuid;
  v_new_number text;
begin
  select *
  into v_source
  from public.quotations
  where id = p_quotation_id
  for update;

  if not found then
    raise exception 'Quotation does not exist.';
  end if;

  if v_source.status <> 'approved' then
    raise exception 'Only approved quotations can be revised.';
  end if;

  v_root_id := coalesce(v_source.root_quotation_id, v_source.id);
  v_base_number := coalesce(
    v_source.base_quotation_number,
    public.strip_quotation_revision_suffix(v_source.quotation_number)
  );

  select coalesce(max(revision_number), 0) + 1
  into v_next_revision
  from public.quotations
  where coalesce(root_quotation_id, id) = v_root_id;

  v_new_id := gen_random_uuid();
  v_new_number := v_base_number || ' Rev.' || v_next_revision;

  update public.quotations
  set is_current_revision = false
  where coalesce(root_quotation_id, id) = v_root_id;

  insert into public.quotations (
    id,
    quotation_number,
    branch_id,
    customer_id,
    vehicle_id,
    nature_of_repair,
    inspection_notes,
    status,
    subtotal,
    discount,
    tax,
    total_amount,
    customer_name_snapshot,
    customer_contact_snapshot,
    customer_address_snapshot,
    vehicle_make_snapshot,
    vehicle_model_snapshot,
    vehicle_year_snapshot,
    vehicle_plate_number_snapshot,
    vehicle_vin_snapshot,
    prepared_by_name_snapshot,
    prepared_by_title_snapshot,
    created_by,
    approved_at,
    rejected_at,
    root_quotation_id,
    parent_quotation_id,
    revision_number,
    is_current_revision,
    base_quotation_number
  )
  values (
    v_new_id,
    v_new_number,
    v_source.branch_id,
    v_source.customer_id,
    v_source.vehicle_id,
    v_source.nature_of_repair,
    v_source.inspection_notes,
    'draft',
    v_source.subtotal,
    v_source.discount,
    v_source.tax,
    v_source.total_amount,
    v_source.customer_name_snapshot,
    v_source.customer_contact_snapshot,
    v_source.customer_address_snapshot,
    v_source.vehicle_make_snapshot,
    v_source.vehicle_model_snapshot,
    v_source.vehicle_year_snapshot,
    v_source.vehicle_plate_number_snapshot,
    v_source.vehicle_vin_snapshot,
    v_source.prepared_by_name_snapshot,
    v_source.prepared_by_title_snapshot,
    p_user_id,
    null,
    null,
    v_root_id,
    p_quotation_id,
    v_next_revision,
    true,
    v_base_number
  );

  insert into public.quotation_items (
    id,
    quotation_id,
    line_number,
    item_type,
    product_id,
    service_id,
    description,
    quantity,
    unit_label_snapshot,
    unit_price,
    total
  )
  select
    gen_random_uuid(),
    v_new_id,
    qi.line_number,
    qi.item_type,
    qi.product_id,
    qi.service_id,
    qi.description,
    qi.quantity,
    qi.unit_label_snapshot,
    qi.unit_price,
    qi.total
  from public.quotation_items as qi
  where qi.quotation_id = p_quotation_id
  order by qi.line_number;

  return v_new_id;
end;
$$;

create or replace function public.create_quotation_revision(
  p_quotation_id uuid,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can revise quotations.'
  );

  select branch_id
  into v_branch_id
  from public.quotations
  where id = p_quotation_id;

  if v_branch_id is null then
    raise exception 'Quotation does not exist.';
  end if;

  perform public.assert_branch_access(
    v_branch_id,
    'You do not have access to revise quotations for this branch.'
  );

  return public.create_quotation_revision_impl(
    p_quotation_id,
    coalesce(p_user_id, auth.uid())
  );
end;
$$;

revoke all on function public.create_quotation_revision_impl(uuid, uuid) from public, anon, authenticated;
revoke all on function public.create_quotation_revision(uuid, uuid) from public, anon;

grant execute on function public.create_quotation_revision(uuid, uuid) to authenticated;

create or replace function public.set_quotation_root_id()
returns trigger
language plpgsql
as $$
begin
  if new.root_quotation_id is null then
    new.root_quotation_id := new.id;
  end if;

  if new.base_quotation_number is null then
    new.base_quotation_number := public.strip_quotation_revision_suffix(new.quotation_number);
  end if;

  return new;
end;
$$;

drop trigger if exists quotations_set_root_id on public.quotations;
create trigger quotations_set_root_id
before insert on public.quotations
for each row
execute function public.set_quotation_root_id();
