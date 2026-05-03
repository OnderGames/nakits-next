-- İlan numarası: 6–9 hane, benzersiz (giriş yapmadan arama ile bulma için).
-- Supabase → SQL Editor’da bir kez çalıştırın.

alter table public.listings
  add column if not exists listing_code text;

-- Mevcut ilanlara benzersiz kod ata
do $$
declare
  r record;
  cand text;
  len int;
  i int;
  attempts int;
begin
  for r in select id from public.listings where listing_code is null
  loop
    attempts := 0;
    cand := null;
    while cand is null and attempts < 120 loop
      attempts := attempts + 1;
      len := 6 + floor(random() * 4)::int;
      cand := '';
      for i in 1..len loop
        cand := cand || (floor(random() * 10))::int::text;
      end loop;
      if exists (select 1 from public.listings where listing_code = cand) then
        cand := null;
      end if;
    end loop;
    if cand is null then
      raise exception 'listing_code atanamadı (id: %)', r.id;
    end if;
    update public.listings set listing_code = cand where id = r.id;
  end loop;
end $$;

alter table public.listings
  alter column listing_code set not null;

alter table public.listings
  drop constraint if exists listings_listing_code_digits;

alter table public.listings
  add constraint listings_listing_code_digits
  check (listing_code ~ '^[0-9]{6,9}$');

create unique index if not exists listings_listing_code_key
  on public.listings (listing_code);
