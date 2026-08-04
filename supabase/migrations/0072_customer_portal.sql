-- Customer mobile portal: link Supabase Auth users to customer records

alter table public.customers
  add column if not exists linked_user_id uuid unique references auth.users (id) on delete set null;

create index if not exists customers_linked_user_id_idx on public.customers (linked_user_id)
  where linked_user_id is not null;

create or replace function public.current_customer_record_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.customers c
  where c.linked_user_id = auth.uid()
    and c.status = 'active'
  limit 1;
$$;

revoke all on function public.current_customer_record_id() from public, anon;
grant execute on function public.current_customer_record_id() to authenticated;

drop policy if exists customers_select_linked_self on public.customers;
create policy customers_select_linked_self
on public.customers
for select
to authenticated
using (linked_user_id = auth.uid());

drop policy if exists quotations_select_linked_customer on public.quotations;
create policy quotations_select_linked_customer
on public.quotations
for select
to authenticated
using (
  customer_id = public.current_customer_record_id()
);

drop policy if exists quotation_items_select_linked_customer on public.quotation_items;
create policy quotation_items_select_linked_customer
on public.quotation_items
for select
to authenticated
using (
  exists (
    select 1
    from public.quotations q
    where q.id = quotation_items.quotation_id
      and q.customer_id = public.current_customer_record_id()
  )
);

drop policy if exists vehicles_select_linked_customer on public.vehicles;
create policy vehicles_select_linked_customer
on public.vehicles
for select
to authenticated
using (
  customer_id = public.current_customer_record_id()
);

create or replace function public.customer_respond_to_quotation(
  p_quotation_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_quotation public.quotations%rowtype;
  v_job_order_id uuid;
begin
  v_customer_id := public.current_customer_record_id();

  if v_customer_id is null then
    raise exception 'Customer portal login is not linked to an active customer record.';
  end if;

  select *
  into v_quotation
  from public.quotations
  where id = p_quotation_id
    and customer_id = v_customer_id
  for update;

  if not found then
    raise exception 'Quotation not found or not accessible.';
  end if;

  if p_decision not in ('approve', 'reject') then
    raise exception 'Decision must be approve or reject.';
  end if;

  if v_quotation.status not in ('draft', 'pending_approval') then
    raise exception 'This quotation can no longer be responded to.';
  end if;

  if p_decision = 'reject' then
    update public.quotations
    set
      status = 'rejected',
      rejected_at = timezone('utc', now()),
      approved_at = null
    where id = p_quotation_id;

    return jsonb_build_object('decision', 'reject', 'quotation_id', p_quotation_id);
  end if;

  v_job_order_id := public.approve_quotation_to_job_order_impl(p_quotation_id, auth.uid());

  return jsonb_build_object(
    'decision', 'approve',
    'quotation_id', p_quotation_id,
    'job_order_id', v_job_order_id
  );
end;
$$;

revoke all on function public.customer_respond_to_quotation(uuid, text) from public, anon;
grant execute on function public.customer_respond_to_quotation(uuid, text) to authenticated;
