-- Vasıta ilanları: model yılı ve kilometre (opsiyonel)
-- Supabase → SQL Editor’da bir kez çalıştırın.

alter table public.listings
  add column if not exists model_year smallint;

alter table public.listings
  add column if not exists vehicle_km integer;

update public.listings
set
  model_year = null
where model_year is not null and (model_year < 1950 or model_year > 2050);

alter table public.listings
  drop constraint if exists listings_model_year_check;

alter table public.listings
  add constraint listings_model_year_check
  check (model_year is null or (model_year >= 1950 and model_year <= 2050));

alter table public.listings
  drop constraint if exists listings_vehicle_km_check;

alter table public.listings
  add constraint listings_vehicle_km_check
  check (vehicle_km is null or (vehicle_km >= 0 and vehicle_km <= 9999999));
