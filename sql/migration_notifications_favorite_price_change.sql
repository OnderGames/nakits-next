-- Favoriye eklenen ilanlarda fiyat değişimi bildirimi
-- Favori sahibi kullanıcıya:
--   "Baslik (ilan no) favori ilaninizin fiyati dustu."
--   "Baslik (ilan no) favori ilaninizin fiyati yukseldi."

create or replace function public.trg_listings_price_change_notify_favoriters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_direction text;
  v_body text;
  v_title text;
  v_code text;
begin
  -- Fiyat degismediyse bildirim uretme.
  if new.price is not distinct from old.price then
    return new;
  end if;

  v_direction := case
    when new.price < old.price then 'price_dropped'
    else 'price_increased'
  end;

  v_title := coalesce(nullif(trim(new.title), ''), 'Ilan');
  v_code := coalesce(nullif(trim(new.listing_code), ''), '---');

  v_body := case
    when v_direction = 'price_dropped'
      then v_title || ' (' || v_code || ') favori ilaninizin fiyati dustu.'
    else v_title || ' (' || v_code || ') favori ilaninizin fiyati yukseldi.'
  end;

  insert into public.notifications (profile_id, type, listing_id, actor_profile_id, body, payload)
  select
    f.profile_id,
    v_direction,
    new.id,
    new.seller_id,
    v_body,
    jsonb_build_object(
      'old_price', old.price,
      'new_price', new.price
    )
  from public.favorites f
  where f.listing_id = new.id
    and f.profile_id <> new.seller_id;

  return new;
end;
$$;

drop trigger if exists trg_listings_price_change_notify_favoriters on public.listings;
create trigger trg_listings_price_change_notify_favoriters
after update of price on public.listings
for each row
execute function public.trg_listings_price_change_notify_favoriters();
