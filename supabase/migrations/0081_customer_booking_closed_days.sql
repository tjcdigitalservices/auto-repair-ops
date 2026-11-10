-- Customer booking calendar: expose shop hours/holidays and reject closed days.

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
    'holiday_dates', coalesce(v_holidays, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.customer_get_shop_calendar() from public, anon;
grant execute on function public.customer_get_shop_calendar() to authenticated;

create or replace function public.is_shop_closed_on_date(
  p_date date,
  p_store_hours jsonb,
  p_holiday_dates jsonb default '[]'::jsonb
)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  v_day_name text;
  v_hours text;
  v_date_key text;
begin
  if p_date is null then
    return true;
  end if;

  v_date_key := to_char(p_date, 'YYYY-MM-DD');
  if p_holiday_dates ? v_date_key
     or exists (
       select 1
       from jsonb_array_elements_text(coalesce(p_holiday_dates, '[]'::jsonb)) as holiday(value)
       where holiday.value = v_date_key
     )
  then
    return true;
  end if;

  v_day_name := trim(to_char(p_date, 'Day'));

  select nullif(trim(entry ->> 'hours'), '')
  into v_hours
  from jsonb_array_elements(coalesce(p_store_hours, '[]'::jsonb)) as entry
  where lower(trim(entry ->> 'day')) = lower(v_day_name)
  limit 1;

  if v_hours is null then
    return false;
  end if;

  return lower(v_hours) in ('closed', 'close', 'off');
end;
$$;

revoke all on function public.is_shop_closed_on_date(date, jsonb, jsonb) from public, anon;
grant execute on function public.is_shop_closed_on_date(date, jsonb, jsonb) to authenticated;

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
