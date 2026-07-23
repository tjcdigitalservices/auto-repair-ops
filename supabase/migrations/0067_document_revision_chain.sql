-- Document revision chain for approved/published documents.

create or replace function public.strip_document_revision_suffix(p_value text)
returns text
language sql
immutable
as $$
  select regexp_replace(trim(p_value), '\s+Rev\.\d+$', '');
$$;

alter table public.documents
  add column if not exists root_document_id uuid references public.documents(id) on delete restrict,
  add column if not exists parent_document_id uuid references public.documents(id) on delete restrict,
  add column if not exists revision_number integer not null default 0,
  add column if not exists is_current_revision boolean not null default true,
  add column if not exists published_at timestamptz;

update public.documents
set root_document_id = id
where root_document_id is null;

update public.documents
set published_at = updated_at
where status = 'published'
  and published_at is null;

create index if not exists documents_root_document_id_idx
  on public.documents (root_document_id);

create index if not exists documents_parent_document_id_idx
  on public.documents (parent_document_id);

create or replace function public.create_document_revision_impl(
  p_document_id uuid,
  p_actor_staff_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.documents%rowtype;
  v_root_id uuid;
  v_base_title text;
  v_next_revision integer;
  v_new_id uuid;
  v_new_title text;
begin
  select *
  into v_source
  from public.documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Document does not exist.';
  end if;

  if v_source.status <> 'published' then
    raise exception 'Only published documents can be revised.';
  end if;

  v_root_id := coalesce(v_source.root_document_id, v_source.id);
  v_base_title := public.strip_document_revision_suffix(v_source.title);

  select coalesce(max(revision_number), 0) + 1
  into v_next_revision
  from public.documents
  where coalesce(root_document_id, id) = v_root_id;

  v_new_id := gen_random_uuid();
  v_new_title := v_base_title || ' Rev.' || v_next_revision;

  update public.documents
  set is_current_revision = false
  where coalesce(root_document_id, id) = v_root_id;

  insert into public.documents (
    id,
    tenant_id,
    branch_id,
    title,
    template,
    content_json,
    status,
    created_by,
    root_document_id,
    parent_document_id,
    revision_number,
    is_current_revision,
    published_at
  )
  values (
    v_new_id,
    v_source.tenant_id,
    v_source.branch_id,
    v_new_title,
    v_source.template,
    v_source.content_json,
    'draft',
    p_actor_staff_id,
    v_root_id,
    p_document_id,
    v_next_revision,
    true,
    null
  );

  return v_new_id;
end;
$$;

create or replace function public.create_document_revision(
  p_document_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch_id uuid;
  v_staff_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can revise documents.'
  );

  select branch_id
  into v_branch_id
  from public.documents
  where id = p_document_id;

  if v_branch_id is null then
    raise exception 'Document does not exist.';
  end if;

  perform public.assert_branch_access(
    v_branch_id,
    'You do not have access to revise documents for this branch.'
  );

  select id
  into v_staff_id
  from public.staff
  where user_id = auth.uid()
    and is_active = true
  limit 1;

  return public.create_document_revision_impl(p_document_id, v_staff_id);
end;
$$;

revoke all on function public.create_document_revision_impl(uuid, uuid) from public, anon, authenticated;
revoke all on function public.create_document_revision(uuid) from public, anon;

grant execute on function public.create_document_revision(uuid) to authenticated;

create or replace function public.set_document_root_id()
returns trigger
language plpgsql
as $$
begin
  if new.root_document_id is null then
    new.root_document_id := new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists documents_set_root_id on public.documents;
create trigger documents_set_root_id
before insert on public.documents
for each row
execute function public.set_document_root_id();
