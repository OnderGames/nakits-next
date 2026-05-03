-- İlan süresi (expires_at), vitrin RLS güncellemesi ve kota için temel.
-- Supabase → SQL Editor’da bir kez çalıştırın.

alter table public.listings
  add column if not exists expires_at timestamptz;

update public.listings
set expires_at = created_at + interval '30 days'
where expires_at is null;

alter table public.listings
  alter column expires_at set default (timezone('utc', now()) + interval '30 days');

alter table public.listings
  alter column expires_at set not null;

create index if not exists idx_listings_expires_at on public.listings (expires_at);

-- Herkese açık: yalnızca süresi dolmamış aktif ilanlar
drop policy if exists "listings public read active" on public.listings;
create policy "listings public read active"
on public.listings for select
using (
  (
    status = 'active'
    and expires_at > now()
  )
  or seller_id = auth.uid()
);

-- Görseller: vitrinde gösterilebilir aktif ilan veya kendi ilanı
drop policy if exists "listing_images public read" on public.listing_images;
create policy "listing_images public read"
on public.listing_images for select
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and (
        (
          l.status = 'active'
          and l.expires_at > now()
        )
        or l.seller_id = auth.uid()
      )
  )
);
