-- Remove duplicate quotation revision chain model.
-- Revisions are tracked in quotation_revisions and applied via sync_quotation_with_job_order.

delete from public.quotation_items
where quotation_id in (
  select id
  from public.quotations
  where parent_quotation_id is not null
    and status <> 'approved'
);

delete from public.quotations
where parent_quotation_id is not null
  and status <> 'approved';

drop trigger if exists quotations_set_root_id on public.quotations;

drop function if exists public.set_quotation_root_id();
drop function if exists public.create_quotation_revision(uuid, uuid);
drop function if exists public.create_quotation_revision_impl(uuid, uuid);
drop function if exists public.strip_quotation_revision_suffix(text);

drop index if exists public.quotations_root_quotation_id_idx;
drop index if exists public.quotations_parent_quotation_id_idx;

alter table public.quotations
  drop column if exists root_quotation_id,
  drop column if exists parent_quotation_id,
  drop column if exists revision_number,
  drop column if exists is_current_revision,
  drop column if exists base_quotation_number;
