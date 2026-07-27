-- Daily arrival queue for reception (Quick Access)

create table if not exists public.daily_arrivals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  queue_date date not null,
  arrived_at timestamptz not null default timezone('utc', now()),
  intake_started_at timestamptz,
  last_activity_at timestamptz not null default timezone('utc', now()),
  arrival_source text not null default 'manual'
    check (arrival_source in ('manual', 'plate_scanner', 'quick_search')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (branch_id, vehicle_id, queue_date)
);

create index if not exists daily_arrivals_branch_queue_date_idx
  on public.daily_arrivals (branch_id, queue_date, arrived_at desc);

create trigger set_daily_arrivals_updated_at
before update on public.daily_arrivals
for each row
execute function public.set_updated_at();

alter table public.daily_arrivals enable row level security;

drop policy if exists daily_arrivals_branch_select on public.daily_arrivals;
create policy daily_arrivals_branch_select
on public.daily_arrivals
for select
to authenticated
using (
  public.can_access_tenant(tenant_id)
  and public.can_access_branch(branch_id)
  and public.is_active_staff()
);

drop policy if exists daily_arrivals_branch_write on public.daily_arrivals;
create policy daily_arrivals_branch_write
on public.daily_arrivals
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
