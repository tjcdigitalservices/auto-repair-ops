-- Separate brand icon (mark) from the full wordmark logo.
alter table public.business_settings
  add column if not exists business_mark_path text;
