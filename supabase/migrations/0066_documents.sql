-- Reusable ERP documents (TipTap JSON body, template-driven layout).

create type public.document_status as enum (
  'draft',
  'published',
  'archived'
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  title text not null,
  template text not null,
  content_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  status public.document_status not null default 'draft',
  created_by uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint documents_template_check check (
    template in ('blank', 'quotation', 'invoice', 'job-order', 'receipt')
  ),
  constraint documents_title_not_blank check (char_length(trim(title)) > 0)
);

create index if not exists documents_tenant_id_idx on public.documents (tenant_id);
create index if not exists documents_branch_id_idx on public.documents (branch_id);
create index if not exists documents_status_idx on public.documents (status);
create index if not exists documents_updated_at_idx on public.documents (updated_at desc);
create index if not exists documents_created_by_idx on public.documents (created_by);

create trigger set_documents_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

alter table public.documents enable row level security;

drop policy if exists documents_select_active_staff on public.documents;
create policy documents_select_active_staff
on public.documents
for select
to authenticated
using (public.is_active_staff());

drop policy if exists documents_insert_document_team on public.documents;
create policy documents_insert_document_team
on public.documents
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
);

drop policy if exists documents_update_document_team on public.documents;
create policy documents_update_document_team
on public.documents
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]));

drop policy if exists documents_delete_document_team on public.documents;
create policy documents_delete_document_team
on public.documents
for delete
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]));
