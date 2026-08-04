-- Mobile mechanic attendance punch (replaces web-only admin client path for native apps)

create or replace function public.haversine_distance_meters(
  p_lat1 double precision,
  p_lon1 double precision,
  p_lat2 double precision,
  p_lon2 double precision
)
returns double precision
language sql
immutable
as $$
  select
    6371000 * 2 * asin(
      sqrt(
        power(sin(radians(p_lat2 - p_lat1) / 2), 2)
        + cos(radians(p_lat1)) * cos(radians(p_lat2)) * power(sin(radians(p_lon2 - p_lon1) / 2), 2)
      )
    );
$$;

create or replace function public.record_mechanic_attendance_punch(
  p_device_id_hash text,
  p_device_name text default 'Mobile app',
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_accuracy_meters double precision default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid;
  v_branch_id uuid;
  v_role public.staff_role;
  v_attendance_date date;
  v_logged_at timestamptz;
  v_existing public.attendance%rowtype;
  v_log_type text;
  v_saved public.attendance%rowtype;
  v_settings public.business_settings%rowtype;
  v_device public.staff_devices%rowtype;
  v_ip_ok boolean := false;
  v_location_ok boolean := false;
  v_device_ok boolean := false;
  v_active_count integer := 0;
  v_passed_count integer := 0;
  v_required_count integer := 0;
  v_distance_meters double precision;
  v_payroll_lock record;
begin
  perform public.assert_has_any_staff_role(
    array['mechanic']::public.staff_role[],
    'Only mechanics can record attendance punches from the mobile app.'
  );

  v_staff_id := public.current_staff_record_id();
  v_branch_id := public.current_staff_branch_id();

  if v_staff_id is null or v_branch_id is null then
    raise exception 'Active staff profile with branch is required.';
  end if;

  select s.role into v_role
  from public.staff s
  where s.id = v_staff_id;

  if v_role is distinct from 'mechanic'::public.staff_role then
    raise exception 'Only mechanics can record attendance punches from the mobile app.';
  end if;

  if p_device_id_hash is null or length(trim(p_device_id_hash)) = 0 then
    raise exception 'Device identifier is required for mobile attendance.';
  end if;

  v_attendance_date := (timezone('Asia/Manila', now()))::date;
  v_logged_at := timezone('utc', now());

  select pp.id, pp.label, pp.status
  into v_payroll_lock
  from public.payroll_periods pp
  where pp.branch_id = v_branch_id
    and pp.status in ('processing', 'finalized')
    and pp.period_start_date <= v_attendance_date
    and pp.period_end_date >= v_attendance_date
  order by pp.period_start_date desc
  limit 1;

  if found then
    raise exception 'Attendance is locked for payroll period %.', v_payroll_lock.label;
  end if;

  select * into v_settings
  from public.business_settings bs
  where bs.branch_id = v_branch_id;

  select * into v_existing
  from public.attendance a
  where a.staff_id = v_staff_id
    and a.attendance_date = v_attendance_date;

  if v_existing.id is null then
    v_log_type := 'time_in';
  elsif v_existing.time_in is null then
    v_log_type := 'time_in';
  elsif v_existing.time_out is null then
    v_log_type := 'time_out';
  else
    raise exception 'Today''s attendance already has both time in and time out recorded.';
  end if;

  select * into v_device
  from public.staff_devices sd
  where sd.device_id_hash = trim(p_device_id_hash);

  if found and v_device.staff_id <> v_staff_id then
    raise exception 'This device is already bound to another mechanic account.';
  end if;

  if not found then
    insert into public.staff_devices (
      staff_id,
      device_id_hash,
      device_name,
      user_agent,
      first_seen_at,
      last_seen_at,
      last_ip,
      status
    )
    values (
      v_staff_id,
      trim(p_device_id_hash),
      coalesce(nullif(trim(p_device_name), ''), 'Mobile app'),
      'auto-repair-shop-mobile',
      v_logged_at,
      v_logged_at,
      null,
      'pending'
    )
    returning * into v_device;
  else
    update public.staff_devices
    set
      last_seen_at = v_logged_at,
      device_name = coalesce(nullif(trim(p_device_name), ''), v_device.device_name)
    where id = v_device.id
    returning * into v_device;
  end if;

  v_device_ok := v_device.status = 'approved';

  if coalesce(v_settings.require_shop_ip_for_mechanic_attendance, false) then
    v_active_count := v_active_count + 1;
    -- Mobile clients cannot reliably present shop LAN IP to PostgREST.
  end if;

  if coalesce(v_settings.require_shop_location_for_mechanic_attendance, false) then
    v_active_count := v_active_count + 1;

    if p_latitude is null or p_longitude is null then
      v_location_ok := false;
    elsif v_settings.attendance_geofence_latitude is null
      or v_settings.attendance_geofence_longitude is null then
      v_location_ok := false;
    else
      v_distance_meters := public.haversine_distance_meters(
        p_latitude,
        p_longitude,
        v_settings.attendance_geofence_latitude,
        v_settings.attendance_geofence_longitude
      );
      v_location_ok :=
        v_distance_meters <= coalesce(v_settings.attendance_geofence_radius_meters, 100);
    end if;

    if v_location_ok then
      v_passed_count := v_passed_count + 1;
    end if;
  end if;

  v_active_count := v_active_count + 1;
  if v_device_ok then
    v_passed_count := v_passed_count + 1;
  end if;

  if v_active_count >= 3 then
    v_required_count := 2;
  else
    v_required_count := v_active_count;
  end if;

  if v_passed_count < v_required_count then
    raise exception
      'On-site verification failed. Ensure location (if enabled), an approved device, and shop settings allow mobile punch. Device status: %.',
      v_device.status;
  end if;

  if v_log_type = 'time_in' then
    if v_existing.id is null then
      insert into public.attendance (
        branch_id,
        staff_id,
        attendance_date,
        time_in,
        time_out,
        status,
        approved_at,
        approved_by_staff_id
      )
      values (
        v_branch_id,
        v_staff_id,
        v_attendance_date,
        v_logged_at,
        null,
        'present',
        v_logged_at,
        null
      )
      returning * into v_saved;
    else
      update public.attendance
      set
        time_in = v_logged_at,
        status = 'present',
        approved_at = v_logged_at,
        approved_by_staff_id = null
      where id = v_existing.id
      returning * into v_saved;
    end if;
  else
    update public.attendance
    set
      time_out = v_logged_at,
      approved_at = v_logged_at,
      approved_by_staff_id = null
    where id = v_existing.id
    returning * into v_saved;
  end if;

  insert into public.attendance_adjustments (
    branch_id,
    attendance_id,
    staff_id,
    attendance_date,
    action,
    previous_data,
    next_data,
    reason,
    changed_by_staff_id
  )
  values (
    v_branch_id,
    v_saved.id,
    v_staff_id,
    v_attendance_date,
    case when v_existing.id is null then 'created' else 'updated' end,
    case
      when v_existing.id is null then null
      else jsonb_build_object(
        'status', v_existing.status,
        'time_in', v_existing.time_in,
        'time_out', v_existing.time_out,
        'notes', v_existing.notes,
        'approved_at', v_existing.approved_at
      )
    end,
    jsonb_build_object(
      'status', v_saved.status,
      'time_in', v_saved.time_in,
      'time_out', v_saved.time_out,
      'notes', v_saved.notes,
      'approved_at', v_saved.approved_at
    ),
    'Mobile app punch',
    v_staff_id
  );

  insert into public.attendance_time_logs (
    branch_id,
    staff_id,
    attendance_id,
    staff_device_id,
    attendance_date,
    log_type,
    logged_at,
    source,
    request_ip,
    is_shop_ip_valid,
    request_latitude,
    request_longitude,
    location_accuracy_meters,
    is_location_valid
  )
  values (
    v_branch_id,
    v_staff_id,
    v_saved.id,
    v_device.id,
    v_attendance_date,
    v_log_type,
    v_logged_at,
    'mechanic_portal',
    null,
    v_ip_ok,
    p_latitude,
    p_longitude,
    p_accuracy_meters,
    v_location_ok
  );

  return jsonb_build_object(
    'attendance_id', v_saved.id,
    'log_type', v_log_type,
    'time_in', v_saved.time_in,
    'time_out', v_saved.time_out,
    'device_status', v_device.status,
    'message',
      case
        when v_log_type = 'time_in' then 'Time in recorded.'
        else 'Time out recorded.'
      end
  );
end;
$$;

revoke all on function public.haversine_distance_meters(double precision, double precision, double precision, double precision)
  from public, anon;
revoke all on function public.record_mechanic_attendance_punch(text, text, double precision, double precision, double precision)
  from public, anon;

grant execute on function public.haversine_distance_meters(double precision, double precision, double precision, double precision)
  to authenticated;
grant execute on function public.record_mechanic_attendance_punch(text, text, double precision, double precision, double precision)
  to authenticated;
