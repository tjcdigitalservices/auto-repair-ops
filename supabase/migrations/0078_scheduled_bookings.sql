-- Customer + staff scheduled bookings (checkup / repair appointments)

create table if not exists public.scheduled_bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  service_kind text not null default 'checkup'
    check (service_kind in ('checkup', 'repair', 'other')),
  customer_concern text not null default '',
  notes text,
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'checked_in', 'cancelled', 'no_show')),
  created_by text not null default 'customer'
    check (created_by in ('customer', 'staff')),
  created_by_staff_id uuid references public.staff(id) on delete set null,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  checked_in_at timestamptz,
  daily_arrival_id uuid references public.daily_arrivals(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (scheduled_end is null or scheduled_end >= scheduled_start)
);

create index if not exists scheduled_bookings_branch_start_idx
  on public.scheduled_bookings (branch_id, scheduled_start desc);

create index if not exists scheduled_bookings_customer_start_idx
  on public.scheduled_bookings (customer_id, scheduled_start desc);

create index if not exists scheduled_bookings_branch_status_idx
  on public.scheduled_bookings (branch_id, status, scheduled_start);

create trigger set_scheduled_bookings_updated_at
before update on public.scheduled_bookings
for each row
execute function public.set_updated_at();

alter table public.scheduled_bookings enable row level security;

-- Staff: branch-scoped full access
drop policy if exists scheduled_bookings_staff_select on public.scheduled_bookings;
create policy scheduled_bookings_staff_select
on public.scheduled_bookings
for select
to authenticated
using (
  public.can_access_tenant(tenant_id)
  and public.can_access_branch(branch_id)
  and public.is_active_staff()
);

drop policy if exists scheduled_bookings_staff_write on public.scheduled_bookings;
create policy scheduled_bookings_staff_write
on public.scheduled_bookings
for all
to authenticated
using (
  public.can_access_tenant(tenant_id)
  and public.can_access_branch(branch_id)
  and public.is_active_staff()
)
with check (
  public.can_access_tenant(tenant_id)
  and public.can_access_branch(branch_id)
  and public.is_active_staff()
);

-- Customer: own bookings only
drop policy if exists scheduled_bookings_customer_select on public.scheduled_bookings;
create policy scheduled_bookings_customer_select
on public.scheduled_bookings
for select
to authenticated
using (customer_id = public.current_customer_record_id());

drop policy if exists scheduled_bookings_customer_insert on public.scheduled_bookings;
create policy scheduled_bookings_customer_insert
on public.scheduled_bookings
for insert
to authenticated
with check (
  customer_id = public.current_customer_record_id()
  and created_by = 'customer'
  and status = 'requested'
);

drop policy if exists scheduled_bookings_customer_update on public.scheduled_bookings;
create policy scheduled_bookings_customer_update
on public.scheduled_bookings
for update
to authenticated
using (customer_id = public.current_customer_record_id())
with check (customer_id = public.current_customer_record_id());

-- Allow scheduled_booking as an arrival source
alter table public.daily_arrivals
  drop constraint if exists daily_arrivals_arrival_source_check;

alter table public.daily_arrivals
  add constraint daily_arrivals_arrival_source_check
  check (arrival_source in ('manual', 'plate_scanner', 'quick_search', 'scheduled_booking'));

-- Customer requests a booking for their own vehicle
create or replace function public.customer_request_booking(
  p_vehicle_id uuid,
  p_scheduled_start timestamptz,
  p_service_kind text default 'checkup',
  p_customer_concern text default '',
  p_scheduled_end timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_branch_id uuid;
  v_tenant_id uuid;
  v_vehicle public.vehicles%rowtype;
  v_booking_id uuid;
begin
  v_customer_id := public.current_customer_record_id();
  if v_customer_id is null then
    raise exception 'Customer portal login is not linked to an active customer record.';
  end if;

  if p_scheduled_start is null or p_scheduled_start < timezone('utc', now()) - interval '5 minutes' then
    raise exception 'Choose a future date and time for the booking.';
  end if;

  if p_service_kind not in ('checkup', 'repair', 'other') then
    raise exception 'Service kind must be checkup, repair, or other.';
  end if;

  select *
  into v_vehicle
  from public.vehicles
  where id = p_vehicle_id
    and customer_id = v_customer_id
    and status = 'active';

  if not found then
    raise exception 'Vehicle not found or not accessible.';
  end if;

  select c.branch_id, b.tenant_id
  into v_branch_id, v_tenant_id
  from public.customers c
  join public.branches b on b.id = c.branch_id
  where c.id = v_customer_id;

  if v_branch_id is null or v_tenant_id is null then
    raise exception 'Customer branch is not configured.';
  end if;

  insert into public.scheduled_bookings (
    tenant_id,
    branch_id,
    customer_id,
    vehicle_id,
    scheduled_start,
    scheduled_end,
    service_kind,
    customer_concern,
    status,
    created_by
  )
  values (
    v_tenant_id,
    v_branch_id,
    v_customer_id,
    p_vehicle_id,
    p_scheduled_start,
    p_scheduled_end,
    p_service_kind,
    coalesce(nullif(trim(p_customer_concern), ''), 'Vehicle service'),
    'requested',
    'customer'
  )
  returning id into v_booking_id;

  return jsonb_build_object('booking_id', v_booking_id, 'status', 'requested');
end;
$$;

revoke all on function public.customer_request_booking(uuid, timestamptz, text, text, timestamptz) from public, anon;
grant execute on function public.customer_request_booking(uuid, timestamptz, text, text, timestamptz) to authenticated;

-- Customer cancels own requested/confirmed booking
create or replace function public.customer_cancel_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_booking public.scheduled_bookings%rowtype;
begin
  v_customer_id := public.current_customer_record_id();
  if v_customer_id is null then
    raise exception 'Customer portal login is not linked to an active customer record.';
  end if;

  select *
  into v_booking
  from public.scheduled_bookings
  where id = p_booking_id
    and customer_id = v_customer_id
  for update;

  if not found then
    raise exception 'Booking not found or not accessible.';
  end if;

  if v_booking.status not in ('requested', 'confirmed') then
    raise exception 'This booking can no longer be cancelled.';
  end if;

  update public.scheduled_bookings
  set
    status = 'cancelled',
    cancelled_at = timezone('utc', now())
  where id = p_booking_id;

  return jsonb_build_object('booking_id', p_booking_id, 'status', 'cancelled');
end;
$$;

revoke all on function public.customer_cancel_booking(uuid) from public, anon;
grant execute on function public.customer_cancel_booking(uuid) to authenticated;

-- Staff confirms a requested booking
create or replace function public.staff_confirm_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.scheduled_bookings%rowtype;
  v_staff_id uuid;
begin
  if not public.is_active_staff() then
    raise exception 'Only active staff can confirm bookings.';
  end if;

  select id into v_staff_id
  from public.staff
  where linked_user_id = auth.uid()
    and status = 'active'
  limit 1;

  select *
  into v_booking
  from public.scheduled_bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if not (public.can_access_tenant(v_booking.tenant_id) and public.can_access_branch(v_booking.branch_id)) then
    raise exception 'Booking is outside your branch access.';
  end if;

  if v_booking.status <> 'requested' then
    raise exception 'Only requested bookings can be confirmed.';
  end if;

  update public.scheduled_bookings
  set
    status = 'confirmed',
    confirmed_at = timezone('utc', now()),
    created_by_staff_id = coalesce(created_by_staff_id, v_staff_id)
  where id = p_booking_id;

  return jsonb_build_object('booking_id', p_booking_id, 'status', 'confirmed');
end;
$$;

revoke all on function public.staff_confirm_booking(uuid) from public, anon;
grant execute on function public.staff_confirm_booking(uuid) to authenticated;

-- Staff cancels or marks no-show
create or replace function public.staff_update_booking_status(
  p_booking_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.scheduled_bookings%rowtype;
begin
  if not public.is_active_staff() then
    raise exception 'Only active staff can update bookings.';
  end if;

  if p_status not in ('cancelled', 'no_show') then
    raise exception 'Staff status update must be cancelled or no_show.';
  end if;

  select *
  into v_booking
  from public.scheduled_bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if not (public.can_access_tenant(v_booking.tenant_id) and public.can_access_branch(v_booking.branch_id)) then
    raise exception 'Booking is outside your branch access.';
  end if;

  if v_booking.status in ('checked_in', 'cancelled') then
    raise exception 'This booking can no longer be updated.';
  end if;

  update public.scheduled_bookings
  set
    status = p_status,
    cancelled_at = case when p_status = 'cancelled' then timezone('utc', now()) else cancelled_at end
  where id = p_booking_id;

  return jsonb_build_object('booking_id', p_booking_id, 'status', p_status);
end;
$$;

revoke all on function public.staff_update_booking_status(uuid, text) from public, anon;
grant execute on function public.staff_update_booking_status(uuid, text) to authenticated;

-- Staff check-in → daily_arrivals + booking checked_in
create or replace function public.check_in_scheduled_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.scheduled_bookings%rowtype;
  v_queue_date date;
  v_now timestamptz := timezone('utc', now());
  v_arrival_id uuid;
begin
  if not public.is_active_staff() then
    raise exception 'Only active staff can check in bookings.';
  end if;

  select *
  into v_booking
  from public.scheduled_bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if not (public.can_access_tenant(v_booking.tenant_id) and public.can_access_branch(v_booking.branch_id)) then
    raise exception 'Booking is outside your branch access.';
  end if;

  if v_booking.status not in ('requested', 'confirmed') then
    raise exception 'Only requested or confirmed bookings can be checked in.';
  end if;

  v_queue_date := (timezone('Asia/Manila', v_now))::date;

  insert into public.daily_arrivals (
    tenant_id,
    branch_id,
    customer_id,
    vehicle_id,
    queue_date,
    arrived_at,
    last_activity_at,
    arrival_source
  )
  values (
    v_booking.tenant_id,
    v_booking.branch_id,
    v_booking.customer_id,
    v_booking.vehicle_id,
    v_queue_date,
    v_now,
    v_now,
    'scheduled_booking'
  )
  on conflict (branch_id, vehicle_id, queue_date) do update
  set
    last_activity_at = excluded.last_activity_at,
    arrival_source = case
      when public.daily_arrivals.arrival_source = 'scheduled_booking' then public.daily_arrivals.arrival_source
      else excluded.arrival_source
    end
  returning id into v_arrival_id;

  update public.scheduled_bookings
  set
    status = 'checked_in',
    checked_in_at = v_now,
    confirmed_at = coalesce(confirmed_at, v_now),
    daily_arrival_id = v_arrival_id
  where id = p_booking_id;

  return jsonb_build_object(
    'booking_id', p_booking_id,
    'status', 'checked_in',
    'daily_arrival_id', v_arrival_id
  );
end;
$$;

revoke all on function public.check_in_scheduled_booking(uuid) from public, anon;
grant execute on function public.check_in_scheduled_booking(uuid) to authenticated;
