-- İlan şikayetleri (kullanıcı → moderasyon kuyruğu)
-- Supabase SQL Editor'da çalıştırın.

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason_key text not null
    constraint listing_reports_reason_check check (
      reason_key in ('spam', 'fraud', 'illegal', 'inappropriate', 'misleading', 'other')
    ),
  details text not null default '',
  status text not null default 'open'
    constraint listing_reports_status_check check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint listing_reports_details_len check (char_length(details) <= 2000)
);

create index if not exists idx_listing_reports_listing on public.listing_reports (listing_id);
create index if not exists idx_listing_reports_status_created on public.listing_reports (status, created_at desc);

-- Aynı kullanıcı aynı ilan için yalnız bir açık şikayet
create unique index if not exists listing_reports_one_open_per_user
  on public.listing_reports (listing_id, reporter_id)
  where (status = 'open');

alter table public.listing_reports enable row level security;

drop policy if exists "listing_reports insert own" on public.listing_reports;
create policy "listing_reports insert own"
on public.listing_reports for insert
with check (auth.uid() = reporter_id);

drop policy if exists "listing_reports select own" on public.listing_reports;
create policy "listing_reports select own"
on public.listing_reports for select
using (auth.uid() = reporter_id);
