-- Customer portal approval creates a job order. Document numbering used to call
-- assert_branch_access(), which fails for linked customers (they are not staff).
-- Keep staff-facing next_document_number gated; use an internal impl for trusted
-- security-definer workflows like approve_quotation_to_job_order_impl.

create or replace function public.next_document_number_impl(
  p_key text,
  p_branch_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sequence public.document_sequences%rowtype;
  v_branch_code text;
  v_candidate text;
  v_attempts integer := 0;
begin
  select upper(code)
  into v_branch_code
  from public.branches
  where id = p_branch_id
    and is_active = true;

  if not found then
    raise exception 'Branch document numbering is not configured for the selected branch.';
  end if;

  insert into public.document_sequences (
    key,
    branch_id,
    prefix,
    padding,
    last_value
  )
  select
    required_sequence.key,
    p_branch_id,
    required_sequence.prefix,
    required_sequence.padding,
    0
  from (
    values
      ('quotation', 'QT-', 4),
      ('job_order', 'JO-', 4),
      ('invoice', 'INV-', 4),
      ('sale', 'POS-', 4),
      ('staff', 'EMP-', 4)
  ) as required_sequence (key, prefix, padding)
  where required_sequence.key = p_key
  on conflict (key, branch_id) do nothing;

  loop
    v_attempts := v_attempts + 1;

    if v_attempts > 100 then
      raise exception 'Unable to generate a unique document number for "%".', p_key;
    end if;

    update public.document_sequences
    set last_value = last_value + 1
    where key = p_key
      and branch_id = p_branch_id
    returning * into v_sequence;

    if not found then
      raise exception 'Document sequence "%" is not configured for the selected branch.', p_key;
    end if;

    v_candidate := v_sequence.prefix
      || v_branch_code
      || '-'
      || lpad(v_sequence.last_value::text, v_sequence.padding, '0');

    exit when not public.document_number_exists(p_key, v_candidate);
  end loop;

  return v_candidate;
end;
$$;

revoke all on function public.next_document_number_impl(text, uuid) from public, anon, authenticated;

create or replace function public.next_document_number(
  p_key text,
  p_branch_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_branch_access(
    p_branch_id,
    'You do not have access to generate document numbers for this branch.'
  );

  return public.next_document_number_impl(p_key, p_branch_id);
end;
$$;

create or replace function public.approve_quotation_to_job_order_impl(
  p_quotation_id uuid,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quotation public.quotations%rowtype;
  v_job_order_id uuid;
begin
  select *
  into v_quotation
  from public.quotations
  where id = p_quotation_id
  for update;

  if not found then
    raise exception 'Quotation does not exist.';
  end if;

  select id
  into v_job_order_id
  from public.job_orders
  where quotation_id = p_quotation_id
  limit 1;

  if v_job_order_id is not null then
    return v_job_order_id;
  end if;

  if v_quotation.status not in ('draft', 'pending_approval') then
    raise exception 'Only draft or pending approval quotations can be approved.';
  end if;

  v_job_order_id := gen_random_uuid();

  insert into public.job_orders (
    id,
    job_order_number,
    quotation_id,
    branch_id,
    customer_id,
    vehicle_id,
    status,
    inspection_notes,
    created_by
  )
  values (
    v_job_order_id,
    public.next_document_number_impl('job_order', v_quotation.branch_id),
    v_quotation.id,
    v_quotation.branch_id,
    v_quotation.customer_id,
    v_quotation.vehicle_id,
    'pending',
    v_quotation.inspection_notes,
    p_user_id
  );

  insert into public.job_order_items (
    id,
    job_order_id,
    source_quotation_item_id,
    line_number,
    item_type,
    product_id,
    service_id,
    description,
    quantity,
    unit_price,
    total
  )
  select
    gen_random_uuid(),
    v_job_order_id,
    qi.id,
    qi.line_number,
    qi.item_type,
    qi.product_id,
    qi.service_id,
    qi.description,
    qi.quantity,
    qi.unit_price,
    qi.total
  from public.quotation_items qi
  where qi.quotation_id = p_quotation_id
  order by qi.line_number;

  update public.quotations
  set
    status = 'approved',
    approved_at = timezone('utc', now()),
    rejected_at = null,
    updated_at = timezone('utc', now())
  where id = p_quotation_id;

  return v_job_order_id;
end;
$$;

revoke all on function public.approve_quotation_to_job_order_impl(uuid, uuid) from public, anon, authenticated;
