-- Default shop workflow: invoice before vehicle release. Branches can opt out in operational rules.
alter table public.business_settings
  alter column require_invoice_before_vehicle_release set default true;

-- Keep branch-clone settings aligned when copying from the tenant main branch.
create or replace function public.provision_branch_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_main_branch_id uuid;
begin
  select id
  into v_main_branch_id
  from public.branches
  where tenant_id = new.tenant_id
    and is_main = true
  limit 1;

  if v_main_branch_id is null then
    return new;
  end if;

  insert into public.business_settings (
    branch_id,
    allow_partial_payments,
    allow_release_with_balance,
    require_full_payment_before_release,
    require_invoice_before_job_completion,
    require_invoice_before_vehicle_release,
    require_additional_item_preapproval,
    require_shop_ip_for_mechanic_attendance,
    allow_dtr_amendments,
    allow_attendance_admin_override,
    enable_barcode_support,
    enable_shelf_location,
    default_tax_rate,
    business_name,
    business_logo_path,
    business_address,
    business_contact,
    business_email,
    business_vat_registration_no,
    receipt_footer
  )
  select
    new.id,
    main_settings.allow_partial_payments,
    main_settings.allow_release_with_balance,
    main_settings.require_full_payment_before_release,
    main_settings.require_invoice_before_job_completion,
    main_settings.require_invoice_before_vehicle_release,
    main_settings.require_additional_item_preapproval,
    main_settings.require_shop_ip_for_mechanic_attendance,
    main_settings.allow_dtr_amendments,
    main_settings.allow_attendance_admin_override,
    main_settings.enable_barcode_support,
    main_settings.enable_shelf_location,
    main_settings.default_tax_rate,
    main_settings.business_name,
    main_settings.business_logo_path,
    main_settings.business_address,
    main_settings.business_contact,
    main_settings.business_email,
    main_settings.business_vat_registration_no,
    main_settings.receipt_footer
  from public.business_settings as main_settings
  where main_settings.branch_id = v_main_branch_id
  on conflict (branch_id) do nothing;

  insert into public.document_sequences (
    key,
    branch_id,
    prefix,
    padding,
    last_value
  )
  select
    main_sequence.key,
    new.id,
    main_sequence.prefix,
    main_sequence.padding,
    0
  from public.document_sequences as main_sequence
  where main_sequence.branch_id = v_main_branch_id
  on conflict (key, branch_id) do nothing;

  return new;
end;
$$;
