-- İlan promosyon bayrakları (Premium / Vitrin / Öne çıkarma) — yönetim panelinden.

alter table public.listings
  add column if not exists promo_premium boolean not null default false;

alter table public.listings
  add column if not exists promo_showcase boolean not null default false;

alter table public.listings
  add column if not exists promo_highlight boolean not null default false;

comment on column public.listings.promo_premium is 'Premium ilan rozeti ve sıralama önceliği.';
comment on column public.listings.promo_showcase is 'Ana sayfa vitrin ve liste önceliği.';
comment on column public.listings.promo_highlight is 'Öne çıkarma rozeti ve sıralama bonusu.';
