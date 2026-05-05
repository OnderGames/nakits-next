-- İlan yayın süresi (gün): moderasyon / site_settings üzerinden ayarlanır.
-- Supabase → SQL Editor’da bir kez çalıştırın.

alter table public.site_settings
  add column if not exists listing_duration_days smallint;

update public.site_settings
set listing_duration_days = 30
where id = 1 and listing_duration_days is null;

alter table public.site_settings
  alter column listing_duration_days set default 30;

alter table public.site_settings
  alter column listing_duration_days set not null;

alter table public.site_settings
  drop constraint if exists site_settings_listing_duration_days_check;

alter table public.site_settings
  add constraint site_settings_listing_duration_days_check
  check (listing_duration_days >= 7 and listing_duration_days <= 365);
