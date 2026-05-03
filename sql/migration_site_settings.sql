-- Anasayfa teması (moderasyon ekranından değiştirilir)
-- Supabase → SQL Editor’da bir kez çalıştırın.

create table if not exists public.site_settings (
  id smallint primary key default 1,
  homepage_theme text not null default 'v2'
    check (
      homepage_theme in (
        'classic',
        'v2',
        'aurora',
        'sunrise',
        'minimal',
        'slate'
      )
    ),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, homepage_theme)
values (1, 'v2')
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "site_settings read all" on public.site_settings;
create policy "site_settings read all"
on public.site_settings for select
using (true);

-- Güncelleme yalnızca service_role (API route) ile; istemciden doğrudan yazım yok
