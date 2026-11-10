-- Harden customer booking mutations: RPC-only writes + transactional capacity lock.

-- Customers must request/cancel via security-definer RPCs (closed days + capacity).
-- Direct insert/update would bypass those rules (e.g. self-confirm status).
drop policy if exists scheduled_bookings_customer_insert on public.scheduled_bookings;
drop policy if exists scheduled_bookings_customer_update on public.scheduled_bookings;

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
  v_local_date date;
  v_store_hours jsonb;
  v_holidays jsonb;
  v_max_concurrent integer;
  v_slot_minutes integer;
  v_hours_label text;
  v_day_name text;
  v_open integer;
  v_close integer;
  v_local_minutes integer;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_booked_count integer;
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

  v_local_date := (p_scheduled_start at time zone 'Asia/Manila')::date;

  if v_local_date < (timezone('Asia/Manila', now()))::date then
    raise exception 'Choose a today or future open day for the booking.';
  end if;

  select tb.store_hours
  into v_store_hours
  from public.tenant_branding tb
  where tb.tenant_id = v_tenant_id;

  if v_store_hours is null then
    v_store_hours := '[
      {"day":"Monday","hours":"7:00 AM – 5:00 PM"},
      {"day":"Tuesday","hours":"7:00 AM – 5:00 PM"},
      {"day":"Wednesday","hours":"7:00 AM – 5:00 PM"},
      {"day":"Thursday","hours":"7:00 AM – 5:00 PM"},
      {"day":"Friday","hours":"7:00 AM – 5:00 PM"},
      {"day":"Saturday","hours":"7:00 AM – 5:00 PM"},
      {"day":"Sunday","hours":"Closed"}
    ]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(to_char(bh.holiday_date, 'YYYY-MM-DD')),
    '[]'::jsonb
  )
  into v_holidays
  from public.branch_holidays bh
  where bh.branch_id = v_branch_id
    and bh.holiday_date = v_local_date;

  if public.is_shop_closed_on_date(v_local_date, v_store_hours, coalesce(v_holidays, '[]'::jsonb)) then
    raise exception 'The shop is closed on that day. Choose another open day.';
  end if;

  select
    coalesce(bs.booking_max_concurrent, 3),
    coalesce(bs.booking_slot_minutes, 60)
  into v_max_concurrent, v_slot_minutes
  from public.business_settings bs
  where bs.branch_id = v_branch_id;

  if v_max_concurrent is null then
    v_max_concurrent := 3;
  end if;
  if v_slot_minutes is null then
    v_slot_minutes := 60;
  end if;

  v_day_name := trim(to_char(v_local_date, 'Day'));
  select nullif(trim(entry ->> 'hours'), '')
  into v_hours_label
  from jsonb_array_elements(coalesce(v_store_hours, '[]'::jsonb)) as entry
  where lower(trim(entry ->> 'day')) = lower(v_day_name)
  limit 1;

  select w.open_minutes, w.close_minutes
  into v_open, v_close
  from public.parse_store_hours_window(v_hours_label) as w
  limit 1;

  if v_open is null or v_close is null then
    raise exception 'The shop is closed on that day. Choose another open day.';
  end if;

  v_local_minutes :=
    (extract(hour from (p_scheduled_start at time zone 'Asia/Manila'))::integer * 60)
    + extract(minute from (p_scheduled_start at time zone 'Asia/Manila'))::integer;

  if v_local_minutes < v_open
     or v_local_minutes + v_slot_minutes > v_close
     or ((v_local_minutes - v_open) % v_slot_minutes) <> 0
  then
    raise exception 'Choose an available time slot during shop hours.';
  end if;

  v_slot_start := p_scheduled_start;
  v_slot_end := p_scheduled_start + make_interval(mins => v_slot_minutes);

  -- Serialize capacity checks for the same branch + slot window.
  perform pg_advisory_xact_lock(
    hashtext('booking-slot:' || v_branch_id::text),
    hashtext(v_slot_start::text)
  );

  select count(*)::integer
  into v_booked_count
  from public.scheduled_bookings sb
  where sb.branch_id = v_branch_id
    and sb.status in ('requested', 'confirmed', 'checked_in')
    and sb.scheduled_start >= v_slot_start
    and sb.scheduled_start < v_slot_end;

  if coalesce(v_booked_count, 0) >= v_max_concurrent then
    raise exception 'That time slot is full. Choose another available time.';
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
    coalesce(p_scheduled_end, v_slot_end),
    p_service_kind,
    coalesce(nullif(trim(p_customer_concern), ''), 'Vehicle service'),
    'requested',
    'customer'
  )
  returning id into v_booking_id;

  return jsonb_build_object('booking_id', v_booking_id, 'status', 'requested');
end;
$$;

revoke all on function public.customer_request_booking(uuid, timestamptz, text, text, timestamptz)
  from public, anon;
grant execute on function public.customer_request_booking(uuid, timestamptz, text, text, timestamptz)
  to authenticated;
