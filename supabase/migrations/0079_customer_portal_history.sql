-- Customer portal: read own job orders / line items / invoices for history

drop policy if exists job_orders_select_linked_customer on public.job_orders;
create policy job_orders_select_linked_customer
on public.job_orders
for select
to authenticated
using (
  customer_id = public.current_customer_record_id()
);

drop policy if exists job_order_items_select_linked_customer on public.job_order_items;
create policy job_order_items_select_linked_customer
on public.job_order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.job_orders jo
    where jo.id = job_order_items.job_order_id
      and jo.customer_id = public.current_customer_record_id()
  )
);

drop policy if exists invoices_select_linked_customer on public.invoices;
create policy invoices_select_linked_customer
on public.invoices
for select
to authenticated
using (
  customer_id = public.current_customer_record_id()
);

-- Light profile update for linked customer (contact fields only)
drop policy if exists customers_update_linked_self on public.customers;
create policy customers_update_linked_self
on public.customers
for update
to authenticated
using (linked_user_id = auth.uid())
with check (linked_user_id = auth.uid());

create or replace function public.customer_update_profile(
  p_contact_number text default null,
  p_email text default null,
  p_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_row public.customers%rowtype;
begin
  v_customer_id := public.current_customer_record_id();
  if v_customer_id is null then
    raise exception 'Customer portal login is not linked to an active customer record.';
  end if;

  update public.customers
  set
    contact_number = case
      when p_contact_number is null then contact_number
      else nullif(trim(p_contact_number), '')
    end,
    email = case
      when p_email is null then email
      else nullif(trim(p_email), '')
    end,
    address = case
      when p_address is null then address
      else nullif(trim(p_address), '')
    end
  where id = v_customer_id
  returning * into v_row;

  return jsonb_build_object(
    'customer_id', v_row.id,
    'contact_number', v_row.contact_number,
    'email', v_row.email,
    'address', v_row.address
  );
end;
$$;

revoke all on function public.customer_update_profile(text, text, text) from public, anon;
grant execute on function public.customer_update_profile(text, text, text) to authenticated;
