-- Shop-wide default SSS / PhilHealth / Pag-IBIG contribution amounts,
-- per-staff compensation overrides, period apply flag, system adjustments,
-- and staff Pag-IBIG number.

alter table public.staff
  add column if not exists pagibig_number text;

alter table public.business_settings
  add column if not exists payroll_default_sss_amount numeric(14,4) not null default 0
    check (payroll_default_sss_amount >= 0),
  add column if not exists payroll_default_philhealth_amount numeric(14,4) not null default 0
    check (payroll_default_philhealth_amount >= 0),
  add column if not exists payroll_default_pagibig_amount numeric(14,4) not null default 0
    check (payroll_default_pagibig_amount >= 0);

alter table public.staff_compensation_profiles
  add column if not exists use_shop_default_contributions boolean not null default true,
  add column if not exists sss_amount numeric(14,4)
    check (sss_amount is null or sss_amount >= 0),
  add column if not exists philhealth_amount numeric(14,4)
    check (philhealth_amount is null or philhealth_amount >= 0),
  add column if not exists pagibig_amount numeric(14,4)
    check (pagibig_amount is null or pagibig_amount >= 0);

alter table public.payroll_periods
  add column if not exists apply_government_deductions boolean not null default true;

alter table public.payroll_period_item_adjustments
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'system_government')),
  add column if not exists system_key text
    check (system_key is null or system_key in ('sss', 'philhealth', 'pagibig'));

create unique index if not exists payroll_period_item_adjustments_system_key_uidx
  on public.payroll_period_item_adjustments (payroll_period_item_id, system_key)
  where system_key is not null;
