-- Register a mechanic device for attendance approval without recording a punch.
-- Mobile clients call this when staff_devices has no row yet so owners can approve in Review devices.

create or replace function public.register_mechanic_attendance_device(
  p_device_id_hash text,
  p_device_name text default 'Mobile app'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid;
  v_role public.staff_role;
  v_now timestamptz;
  v_device public.staff_devices%rowtype;
begin
  perform public.assert_has_any_staff_role(
    array['mechanic']::public.staff_role[],
    'Only mechanics can register attendance devices from the mobile app.'
  );

  v_staff_id := public.current_staff_record_id();

  if v_staff_id is null then
    raise exception 'Active staff profile is required.';
  end if;

  select s.role into v_role
  from public.staff s
  where s.id = v_staff_id;

  if v_role is distinct from 'mechanic'::public.staff_role then
    raise exception 'Only mechanics can register attendance devices from the mobile app.';
  end if;

  if p_device_id_hash is null or length(trim(p_device_id_hash)) = 0 then
    raise exception 'Device identifier is required.';
  end if;

  v_now := timezone('utc', now());

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
      v_now,
      v_now,
      null,
      'pending'
    )
    returning * into v_device;
  else
    update public.staff_devices
    set
      last_seen_at = v_now,
      device_name = coalesce(nullif(trim(p_device_name), ''), v_device.device_name)
    where id = v_device.id
    returning * into v_device;
  end if;

  return jsonb_build_object(
    'status', v_device.status,
    'device_name', v_device.device_name,
    'is_approved', v_device.status = 'approved'
  );
end;
$$;

revoke all on function public.register_mechanic_attendance_device(text, text)
  from public, anon;

grant execute on function public.register_mechanic_attendance_device(text, text)
  to authenticated;
