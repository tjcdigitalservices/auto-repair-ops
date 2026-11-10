-- Staff-created scheduled bookings (confirmed immediately).

create or replace function public.staff_create_booking(
  p_customer_id uuid,
  p_vehicle_id uuid,
  p_scheduled_start timestamptz,
  p_service_kind text default 'checkup',
  p_customer_concern text default '',
  p_notes text default null,
  p_scheduled_end timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid;
  v_branch_id uuid;
  v_tenant_id uuid;
  v_customer public.customers%rowtype;
  v_vehicle public.vehicles%rowtype;
  v_booking_id uuid;
  v_end timestamptz;
begin
  if not public.is_active_staff() then
    raise exception 'Only active staff can create bookings.';
  end if;

  select s.id, s.branch_id, s.tenant_id
  into v_staff_id, v_branch_id, v_tenant_id
  from public.staff s
  where s.linked_user_id = auth.uid()
    and s.status = 'active'
  limit 1;

  if v_staff_id is null then
    raise exception 'Staff profile not found.';
  end if;

  if p_scheduled_start is null then
    raise exception 'Choose a date and time for the booking.';
  end if;

  if p_service_kind not in ('checkup', 'repair', 'other') then
    raise exception 'Service kind must be checkup, repair, or other.';
  end if;

  select *
  into v_customer
  from public.customers
  where id = p_customer_id
    and status = 'active';

  if not found then
    raise exception 'Customer not found.';
  end if;

  if not (public.can_access_tenant(v_tenant_id) and public.can_access_branch(v_customer.branch_id)) then
    raise exception 'Customer is outside your branch access.';
  end if;

  select *
  into v_vehicle
  from public.vehicles
  where id = p_vehicle_id
    and customer_id = p_customer_id
    and status = 'active';

  if not found then
    raise exception 'Vehicle not found for this customer.';
  end if;

  if not public.can_access_branch(v_vehicle.branch_id) then
    raise exception 'Vehicle is outside your branch access.';
  end if;

  v_end := coalesce(
    p_scheduled_end,
    p_scheduled_start + interval '1 hour'
  );

  insert into public.scheduled_bookings (
    tenant_id,
    branch_id,
    customer_id,
    vehicle_id,
    scheduled_start,
    scheduled_end,
    service_kind,
    customer_concern,
    notes,
    status,
    created_by,
    created_by_staff_id,
    confirmed_at
  )
  values (
    v_tenant_id,
    v_customer.branch_id,
    p_customer_id,
    p_vehicle_id,
    p_scheduled_start,
    v_end,
    p_service_kind,
    coalesce(nullif(trim(p_customer_concern), ''), 'Vehicle service'),
    nullif(trim(coalesce(p_notes, '')), ''),
    'confirmed',
    'staff',
    v_staff_id,
    timezone('utc', now())
  )
  returning id into v_booking_id;

  return jsonb_build_object('booking_id', v_booking_id, 'status', 'confirmed');
end;
$$;

revoke all on function public.staff_create_booking(uuid, uuid, timestamptz, text, text, text, timestamptz)
  from public, anon;
grant execute on function public.staff_create_booking(uuid, uuid, timestamptz, text, text, text, timestamptz)
  to authenticated;
