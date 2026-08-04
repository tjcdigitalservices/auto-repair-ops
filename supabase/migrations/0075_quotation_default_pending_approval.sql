-- Promote legacy drafts into the new product default, then change the column default.
-- Draft remains a valid status for intentional WIP via explicit "Save as draft".

update public.quotations
set status = 'pending_approval'
where status = 'draft';

alter table public.quotations
  alter column status set default 'pending_approval';
