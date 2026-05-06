-- Yasal ve bilgilendirme metinleri (KVKK, sözleşme, politikalar).
-- Varsayılan: uygulamada gömülü içerik; bu tabloda satır oluşturup body_html dolu olduğunda canlı içerik buradan gösterilir.
-- RLS: herkes okuyabilir (select); yazma yalnızca service_role / admin API ile.

create table if not exists public.site_legal_pages (
  slug text primary key constraint site_legal_pages_slug_allowed check (
    slug in (
      'uyelik-sozlesmesi',
      'gizlilik-politikasi',
      'terms-of-service',
      'privacy-policy',
      'yasakli-urunler'
    )
  ),
  page_title text not null default '',
  meta_description text not null default '',
  body_html text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists site_legal_pages_updated_at_idx
  on public.site_legal_pages (updated_at desc);

alter table public.site_legal_pages enable row level security;

drop policy if exists "site_legal_pages read all" on public.site_legal_pages;
create policy "site_legal_pages read all"
  on public.site_legal_pages
  for select
  using (true);

comment on table public.site_legal_pages is 'Özelleştirilmiş sözleşme ve politika metinleri (body_html boş ise uygulama varsayılanı kullanılır).';
