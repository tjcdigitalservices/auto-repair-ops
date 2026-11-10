-- Booking capacity: max concurrent per slot + open-hours slot generation for customers.

alter table public.business_settings
  add column if not exists booking_max_concurrent integer not null default 3
    check (booking_max_concurrent >= 1 and booking_max_concurrent <= 50),
  add column if not exists booking_slot_minutes integer not null default 60
    check (booking_slot_minutes in (30, 60, 90, 120));

comment on column public.business_settings.booking_max_concurrent is
  'Max active bookings allowed in the same time slot window.';
comment on column public.business_settings.booking_slot_minutes is
  'Length of each bookable slot in minutes (30/60/90/120).';

-- "7:00 AM" / "5:00 PM" → minutes from midnight (0–1439), or null.
create or replace function public.parse_clock_to_minutes(p_clock text)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v_raw text;
  v_hour integer;
  v_minute integer;
  v_period text;
  v_match text[];
begin
  v_raw := upper(trim(coalesce(p_clock, '')));
  if v_raw = '' then
    return null;
  end if;

  v_match := regexp_match(v_raw, '^(\d{1,2}):(\d{2})\s*(AM|PM)$');
  if v_match is null then
    v_match := regexp_match(v_raw, '^(\d{1,2})\s*(AM|PM)$');
    if v_match is null then
      return null;
    end if;
    v_hour := v_match[1]::integer;
    v_minute := 0;
    v_period := v_match[2];
  else
    v_hour := v_match[1]::integer;
    v_minute := v_match[2]::integer;
    v_period := v_match[3];
  end if;

  if v_hour < 1 or v_hour > 12 or v_minute < 0 or v_minute > 59 then
    return null;
  end if;

  v_hour := v_hour % 12;
  if v_period = 'PM' then
    v_hour := v_hour + 12;
  end if;

  return v_hour * 60 + v_minute;
end;
$$;

revoke all on function public.parse_clock_to_minutes(text) from public, anon;
grant execute on function public.parse_clock_to_minutes(text) to authenticated;

-- "7:00 AM – 5:00 PM" → open/close minutes; closed/null hours → no rows.
create or replace function public.parse_store_hours_window(p_hours text)
returns table(open_minutes integer, close_minutes integer)
language plpgsql
immutable
set search_path = public
as $$
declare
  v_raw text;
  v_parts text[];
  v_open integer;
  v_close integer;
begin
  v_raw := trim(coalesce(p_hours, ''));
  if v_raw = '' or lower(v_raw) in ('closed', 'close', 'off') then
    return;
  end if;

  -- Normalize en/em dashes and "to".
  v_raw := regexp_replace(v_raw, '[–—−]', '-', 'g');
  v_raw := regexp_replace(v_raw, '\s+to\s+', '-', 'i');
  v_parts := regexp_split_to_array(v_raw, '\s*-\s*');

  if coalesce(array_length(v_parts, 1), 0) < 2 then
    return;
  end if;

  v_open := public.parse_clock_to_minutes(v_parts[1]);
  v_close := public.parse_clock_to_minutes(v_parts[2]);

  if v_open is null or v_close is null or v_close <= v_open then
    return;
  end if;

  open_minutes := v_open;
  close_minutes := v_close;
  return next;
end;
$$;

revoke all on function public.parse_store_hours_window(text) from public, anon;
grant execute on function public.parse_store_hours_window(text) to authenticated;

create or replace function public.customer_get_shop_calendar()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_branch_id uuid;
  v_tenant_id uuid;
  v_store_hours jsonb;
  v_holidays jsonb;
  v_max_concurrent integer;
  v_slot_minutes integer;
begin
  v_customer_id := public.current_customer_record_id();
  if v_customer_id is null then
    raise exception 'Customer portal login is not linked to an active customer record.';
  end if;

  select c.branch_id, b.tenant_id
  into v_branch_id, v_tenant_id
  from public.customers c
  join public.branches b on b.id = c.branch_id
  where c.id = v_customer_id;

  if v_branch_id is null or v_tenant_id is null then
    raise exception 'Customer branch is not configured.';
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

  select coalesce(
    jsonb_agg(to_char(bh.holiday_date, 'YYYY-MM-DD') order by bh.holiday_date),
    '[]'::jsonb
  )
  into v_holidays
  from public.branch_holidays bh
  where bh.branch_id = v_branch_id
    and bh.holiday_date >= (timezone('Asia/Manila', now()))::date - 30
    and bh.holiday_date <= (timezone('Asia/Manila', now()))::date + 400;

  return jsonb_build_object(
    'branch_id', v_branch_id,
    'store_hours', v_store_hours,
    'holiday_dates', coalesce(v_holidays, '[]'::jsonb),
    'max_concurrent', v_max_concurrent,
    'slot_minutes', v_slot_minutes
  );
end;
$$;

revoke all on function public.customer_get_shop_calendar() from public, anon;
grant execute on function public.customer_get_shop_calendar() to authenticated;

-- Available bookable slots for a local Manila date.
create or replace function public.customer_get_available_slots(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_branch_id uuid;
  v_tenant_id uuid;
  v_store_hours jsonb;
  v_holidays jsonb;
  v_max_concurrent integer;
  v_slot_minutes integer;
  v_hours_label text;
  v_day_name text;
  v_open integer;
  v_close integer;
  v_cursor integer;
  v_slots jsonb := '[]'::jsonb;
  v_booked_count integer;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_label text;
  v_remaining integer;
  v_now timestamptz := timezone('utc', now());
  v_today date := (timezone('Asia/Manila', now()))::date;
begin
  v_customer_id := public.current_customer_record_id();
  if v_customer_id is null then
    raise exception 'Customer portal login is not linked to an active customer record.';
  end if;

  if p_date is null then
    raise exception 'Choose a date.';
  end if;

  select c.branch_id, b.tenant_id
  into v_branch_id, v_tenant_id
  from public.customers c
  join public.branches b on b.id = c.branch_id
  where c.id = v_customer_id;

  if v_branch_id is null or v_tenant_id is null then
    raise exception 'Customer branch is not configured.';
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

  select coalesce(
    jsonb_agg(to_char(bh.holiday_date, 'YYYY-MM-DD')),
    '[]'::jsonb
  )
  into v_holidays
  from public.branch_holidays bh
  where bh.branch_id = v_branch_id
    and bh.holiday_date = p_date;

  if p_date < v_today
     or public.is_shop_closed_on_date(p_date, v_store_hours, coalesce(v_holidays, '[]'::jsonb))
  then
    return jsonb_build_object(
      'date', to_char(p_date, 'YYYY-MM-DD'),
      'is_closed', true,
      'max_concurrent', v_max_concurrent,
      'slot_minutes', v_slot_minutes,
      'slots', '[]'::jsonb
    );
  end if;

  v_day_name := trim(to_char(p_date, 'Day'));
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
    return jsonb_build_object(
      'date', to_char(p_date, 'YYYY-MM-DD'),
      'is_closed', true,
      'max_concurrent', v_max_concurrent,
      'slot_minutes', v_slot_minutes,
      'slots', '[]'::jsonb
    );
  end if;

  v_cursor := v_open;
  while v_cursor + v_slot_minutes <= v_close loop
    v_slot_start := ((p_date::text || ' ' ||
      lpad(((v_cursor / 60)::text), 2, '0') || ':' ||
      lpad(((v_cursor % 60)::text), 2, '0') || ':00'
    )::timestamp at time zone 'Asia/Manila');
    v_slot_end := v_slot_start + make_interval(mins => v_slot_minutes);

    if v_slot_start > v_now then
      select count(*)::integer
      into v_booked_count
      from public.scheduled_bookings sb
      where sb.branch_id = v_branch_id
        and sb.status in ('requested', 'confirmed', 'checked_in')
        and sb.scheduled_start >= v_slot_start
        and sb.scheduled_start < v_slot_end;

      v_remaining := greatest(v_max_concurrent - coalesce(v_booked_count, 0), 0);
      v_label := to_char(v_slot_start at time zone 'Asia/Manila', 'FMHH12:MI AM');

      v_slots := v_slots || jsonb_build_array(
        jsonb_build_object(
          'start', v_slot_start,
          'label', trim(v_label),
          'booked', coalesce(v_booked_count, 0),
          'remaining', v_remaining,
          'available', v_remaining > 0
        )
      );
    end if;

    v_cursor := v_cursor + v_slot_minutes;
  end loop;

  return jsonb_build_object(
    'date', to_char(p_date, 'YYYY-MM-DD'),
    'is_closed', false,
    'hours_label', v_hours_label,
    'max_concurrent', v_max_concurrent,
    'slot_minutes', v_slot_minutes,
    'slots', v_slots
  );
end;
$$;

revoke all on function public.customer_get_available_slots(date) from public, anon;
grant execute on function public.customer_get_available_slots(date) to authenticated;

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
