-- Replace leftover SAY Auto Care naming from bootstrap / early seed data.

update public.tenants
set name = 'Auto Repair Shop'
where lower(name) like '%say auto care%';

update public.tenant_branding
set
  app_name = case
    when lower(coalesce(app_name, '')) like '%say auto care%' then 'Auto Repair Ops'
    else app_name
  end,
  company_name = case
    when lower(coalesce(company_name, '')) like '%say auto care%' then 'Auto Repair Shop'
    else company_name
  end,
  meta_title = case
    when lower(coalesce(meta_title, '')) like '%say auto care%' then 'Auto Repair Ops'
    else meta_title
  end,
  meta_description = case
    when lower(coalesce(meta_description, '')) like '%say auto care%'
      then 'Workshop operations and customer website.'
    else meta_description
  end;

update public.business_settings
set
  business_name = 'Auto Repair Shop',
  receipt_footer = case
    when lower(coalesce(receipt_footer, '')) like '%say auto care%'
      then 'Thank you for your business.'
    else receipt_footer
  end
where lower(business_name) like '%say auto care%';
