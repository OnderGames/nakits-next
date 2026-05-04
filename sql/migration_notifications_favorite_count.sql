-- Favori sayacı + ilan sahibi bildirimleri (Supabase SQL Editor'da bir kez çalıştırın).
-- Sonrası: Dashboard → Realtime → notifications tablosunu yayına ekleyin (veya aşağıdaki publication satırı).

alter table public.listings
  add column if not exists favorite_count int not null default 0
  check (favorite_count >= 0);

update public.listings l
set favorite_count = coalesce(
  (select count(*)::int from public.favorites f where f.listing_id = l.id),
  0
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  listing_id uuid references public.listings(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null default '{}',
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_profile_created
  on public.notifications(profile_id, created_at desc);

create index if not exists idx_notifications_unread
  on public.notifications(profile_id)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications select own" on public.notifications;
create policy "notifications select own"
on public.notifications for select
using (auth.uid() = profile_id);

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own"
on public.notifications for update
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

-- Realtime: Dashboard → Database → Replication → supabase_realtime → notifications ekleyin.

create or replace function public.trg_favorites_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_actor_name text;
begin
  update public.listings
  set favorite_count = favorite_count + 1
  where id = new.listing_id;

  select l.seller_id into v_seller_id
  from public.listings l
  where l.id = new.listing_id;

  if v_seller_id is null or v_seller_id = new.profile_id then
    return new;
  end if;

  select coalesce(nullif(trim(p.full_name), ''), '')
  into v_actor_name
  from public.profiles p
  where p.id = new.profile_id;

  insert into public.notifications (profile_id, type, listing_id, actor_profile_id, body)
  values (
    v_seller_id,
    'favorite_added',
    new.listing_id,
    new.profile_id,
    case
      when length(v_actor_name) > 0 then v_actor_name || ' ilanınızı favorilerine ekledi.'
      else 'Bir üye ilanınızı favorilerine ekledi.'
    end
  );

  return new;
end;
$$;

create or replace function public.trg_favorites_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set favorite_count = greatest(0, favorite_count - 1)
  where id = old.listing_id;

  return old;
end;
$$;

drop trigger if exists trg_favorites_after_insert on public.favorites;
create trigger trg_favorites_after_insert
after insert on public.favorites
for each row execute function public.trg_favorites_after_insert();

drop trigger if exists trg_favorites_after_delete on public.favorites;
create trigger trg_favorites_after_delete
after delete on public.favorites
for each row execute function public.trg_favorites_after_delete();
