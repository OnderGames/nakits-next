-- Nakits MVP PostgreSQL/Supabase schema

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text,
  city text,
  avatar_url text,
  /** Tarayıcıda görünen üye no (6–9 hane, benzersiz) */
  public_code text not null unique,
  created_at timestamptz not null default now(),
  constraint profiles_public_code_digits check (public_code ~ '^[0-9]{6,9}$')
);

-- Moderasyon (RLS ile dış dünyadan okuma yok; yalnız service_role/API)
create table if not exists profile_staff (
  profile_id uuid primary key references profiles (id) on delete cascade,
  app_role text not null default 'member'
    constraint profile_staff_role_check check (app_role in ('member', 'moderator', 'admin')),
  is_blocked boolean not null default false,
  moderation_flagged boolean not null default false,
  admin_verified_email boolean not null default false,
  admin_verified_phone boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_profile_staff_app_role on profile_staff (app_role);

alter table profile_staff enable row level security;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references categories(id),
  title text not null,
  description text not null,
  price numeric(12,2) not null check (price >= 0),
  city text not null,
  district text,
  condition text not null default 'used' check (condition in ('new', 'used')),
  show_phone_on_listing boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'active', 'sold', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  /** Favori sayısı (tetikleyici ile güncellenir) */
  favorite_count int not null default 0 check (favorite_count >= 0),
  /** Tarayıcıda görünen ilan no (6–9 hane, benzersiz); paylaşım ve arama için */
  listing_code text not null,
  /** Vasıta: kullanıcı girişli model yılı */
  model_year smallint,
  /** Vasıta: kilometre (tam sayı) */
  vehicle_km integer,
  constraint listings_listing_code_digits check (listing_code ~ '^[0-9]{6,9}$'),
  constraint listings_model_year_check check (
    model_year is null or (model_year >= 1950 and model_year <= 2050)
  ),
  constraint listings_vehicle_km_check check (
    vehicle_km is null or (vehicle_km >= 0 and vehicle_km <= 9999999)
  ),
  promo_premium boolean not null default false,
  promo_showcase boolean not null default false,
  promo_highlight boolean not null default false,
  unique (listing_code)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_listings_updated_at on listings;
create trigger trg_listings_updated_at
before update on listings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_profile_staff_updated_at on profile_staff;
create trigger trg_profile_staff_updated_at
before update on profile_staff
for each row
execute function public.set_updated_at();

create table if not exists listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists favorites (
  profile_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, listing_id)
);

create table if not exists listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade,
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

create index if not exists idx_listing_reports_listing on listing_reports (listing_id);
create index if not exists idx_listing_reports_status_created on listing_reports (status, created_at desc);

create unique index if not exists listing_reports_one_open_per_user
  on listing_reports (listing_id, reporter_id)
  where (status = 'open');

alter table listing_reports enable row level security;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  listing_id uuid references listings(id) on delete set null,
  actor_profile_id uuid references profiles(id) on delete set null,
  payload jsonb not null default '{}',
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_profile_created on notifications(profile_id, created_at desc);
create index if not exists idx_notifications_unread on notifications(profile_id) where read_at is null;

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  unique (listing_id, buyer_id, seller_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists conversation_reads (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create index if not exists idx_conversation_reads_profile on conversation_reads(profile_id);

alter table conversation_reads enable row level security;

create index if not exists idx_listings_status_created_at on listings(status, created_at desc);
create index if not exists idx_listings_expires_at on listings(expires_at);
create index if not exists idx_listings_category on listings(category_id);
create index if not exists idx_listings_city on listings(city);
create index if not exists idx_messages_conversation on messages(conversation_id, created_at);
create index if not exists idx_conversations_last_message_at on conversations(last_message_at desc nulls last);

create table if not exists message_reads (
  message_id uuid not null references messages(id) on delete cascade,
  reader_id uuid not null references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, reader_id)
);

create index if not exists idx_message_reads_reader on message_reads(reader_id);

create table if not exists message_hidden_by_user (
  message_id uuid not null references messages(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (message_id, profile_id)
);

create index if not exists idx_message_hidden_profile on message_hidden_by_user(profile_id);

create or replace function public.touch_conversation_last_message()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_messages_touch_conversation on messages;
create trigger trg_messages_touch_conversation
after insert on messages
for each row
execute function public.touch_conversation_last_message();

create or replace function public.my_total_unread_messages()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(count(*), 0)::bigint
  from messages m
  join conversations c on c.id = m.conversation_id
  left join conversation_reads r
    on r.conversation_id = c.id
   and r.profile_id = auth.uid()
  where auth.uid() in (c.buyer_id, c.seller_id)
    and m.sender_id <> auth.uid()
    and m.created_at > coalesce(r.last_read_at, to_timestamp(0));
$$;

grant execute on function public.my_total_unread_messages() to authenticated;

create or replace function public.generate_profile_public_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  candidate text;
  attempts int := 0;
begin
  loop
    attempts := attempts + 1;
    exit when attempts > 100;
    candidate := (100000 + floor(random() * 899900000)::bigint)::text;
    if length(candidate) between 6 and 9
       and not exists (select 1 from public.profiles p where p.public_code = candidate) then
      return candidate;
    end if;
  end loop;
  candidate := ((extract(epoch from clock_timestamp())::bigint % 899900000) + 100000)::text;
  while exists (select 1 from public.profiles p where p.public_code = candidate) loop
    candidate := ((candidate::bigint + 13) % 900000000 + 100000)::text;
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  phone_raw text;
begin
  phone_raw := nullif(
    trim(coalesce(new.raw_user_meta_data ->> 'phone', '')),
    ''
  );

  insert into public.profiles (id, email, full_name, phone, public_code)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    phone_raw,
    public.generate_profile_public_code()
  )
  on conflict (id) do nothing;

  insert into public.profile_staff (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- Alt kategori satirlari (slug: grup_alt, name: liste etiketi; lib/categories ile uyumlu)
insert into categories (slug, name)
values
  ('tasitlar_otomobil', 'Otomobil'),
  ('tasitlar_otomobil-bmw', 'Otomobil › BMW'),
  ('tasitlar_otomobil-bmw-1-serisi', 'Otomobil › BMW › 1 Serisi'),
  ('tasitlar_otomobil-bmw-1-serisi-116d', 'Otomobil › BMW › 1 Serisi › 116d'),
  ('tasitlar_otomobil-bmw-1-serisi-116d-ed', 'Otomobil › BMW › 1 Serisi › 116d ED'),
  ('tasitlar_otomobil-bmw-1-serisi-116i', 'Otomobil › BMW › 1 Serisi › 116i'),
  ('tasitlar_otomobil-bmw-1-serisi-118d', 'Otomobil › BMW › 1 Serisi › 118d'),
  ('tasitlar_otomobil-bmw-1-serisi-118i', 'Otomobil › BMW › 1 Serisi › 118i'),
  ('tasitlar_otomobil-bmw-1-serisi-120', 'Otomobil › BMW › 1 Serisi › 120'),
  ('tasitlar_otomobil-bmw-1-serisi-120d', 'Otomobil › BMW › 1 Serisi › 120d'),
  ('tasitlar_otomobil-bmw-1-serisi-120i', 'Otomobil › BMW › 1 Serisi › 120i'),
  ('tasitlar_otomobil-bmw-1-serisi-128ia', 'Otomobil › BMW › 1 Serisi › 128ia'),
  ('tasitlar_otomobil-bmw-1-serisi-128ti', 'Otomobil › BMW › 1 Serisi › 128ti'),
  ('tasitlar_otomobil-bmw-2-serisi', 'Otomobil › BMW › 2 Serisi'),
  ('tasitlar_otomobil-bmw-2-serisi-216d-active-tourer', 'Otomobil › BMW › 2 Serisi › 216d Active Tourer'),
  ('tasitlar_otomobil-bmw-2-serisi-216d-gran-coupe', 'Otomobil › BMW › 2 Serisi › 216d Gran Coupe'),
  ('tasitlar_otomobil-bmw-2-serisi-216d-gran-tourer', 'Otomobil › BMW › 2 Serisi › 216d Gran Tourer'),
  ('tasitlar_otomobil-bmw-2-serisi-218i', 'Otomobil › BMW › 2 Serisi › 218i'),
  ('tasitlar_otomobil-bmw-2-serisi-218i-active-tourer', 'Otomobil › BMW › 2 Serisi › 218i Active Tourer'),
  ('tasitlar_otomobil-bmw-2-serisi-218i-gran-coupe', 'Otomobil › BMW › 2 Serisi › 218i Gran Coupe'),
  ('tasitlar_otomobil-bmw-2-serisi-220d', 'Otomobil › BMW › 2 Serisi › 220d'),
  ('tasitlar_otomobil-bmw-2-serisi-220-gran-coupe', 'Otomobil › BMW › 2 Serisi › 220 Gran Coupe'),
  ('tasitlar_otomobil-bmw-2-serisi-220i-active-tourer', 'Otomobil › BMW › 2 Serisi › 220i Active Tourer'),
  ('tasitlar_otomobil-bmw-2-serisi-230e-xdrive-active-tourer', 'Otomobil › BMW › 2 Serisi › 230e xDrive Active Tourer'),
  ('tasitlar_otomobil-bmw-3-serisi', 'Otomobil › BMW › 3 Serisi'),
  ('tasitlar_otomobil-bmw-3-serisi-315', 'Otomobil › BMW › 3 Serisi › 315'),
  ('tasitlar_otomobil-bmw-3-serisi-316', 'Otomobil › BMW › 3 Serisi › 316'),
  ('tasitlar_otomobil-bmw-3-serisi-316ci', 'Otomobil › BMW › 3 Serisi › 316Ci'),
  ('tasitlar_otomobil-bmw-3-serisi-316i', 'Otomobil › BMW › 3 Serisi › 316i'),
  ('tasitlar_otomobil-bmw-3-serisi-316ti', 'Otomobil › BMW › 3 Serisi › 316ti'),
  ('tasitlar_otomobil-bmw-3-serisi-318ci', 'Otomobil › BMW › 3 Serisi › 318Ci'),
  ('tasitlar_otomobil-bmw-3-serisi-318d', 'Otomobil › BMW › 3 Serisi › 318d'),
  ('tasitlar_otomobil-bmw-3-serisi-318i', 'Otomobil › BMW › 3 Serisi › 318i'),
  ('tasitlar_otomobil-bmw-3-serisi-318is', 'Otomobil › BMW › 3 Serisi › 318is'),
  ('tasitlar_otomobil-bmw-3-serisi-318tds', 'Otomobil › BMW › 3 Serisi › 318tds'),
  ('tasitlar_otomobil-bmw-3-serisi-318ti', 'Otomobil › BMW › 3 Serisi › 318ti'),
  ('tasitlar_otomobil-bmw-3-serisi-320cd', 'Otomobil › BMW › 3 Serisi › 320Cd'),
  ('tasitlar_otomobil-bmw-3-serisi-320ci', 'Otomobil › BMW › 3 Serisi › 320Ci'),
  ('tasitlar_otomobil-bmw-3-serisi-320d', 'Otomobil › BMW › 3 Serisi › 320d'),
  ('tasitlar_otomobil-bmw-3-serisi-320d-gt', 'Otomobil › BMW › 3 Serisi › 320d GT'),
  ('tasitlar_otomobil-bmw-3-serisi-320d-xdrive', 'Otomobil › BMW › 3 Serisi › 320d xDrive'),
  ('tasitlar_otomobil-bmw-3-serisi-320d-xdrive-gt', 'Otomobil › BMW › 3 Serisi › 320d xDrive GT'),
  ('tasitlar_otomobil-bmw-3-serisi-320i', 'Otomobil › BMW › 3 Serisi › 320i'),
  ('tasitlar_otomobil-bmw-3-serisi-320i-ed', 'Otomobil › BMW › 3 Serisi › 320i ED'),
  ('tasitlar_otomobil-bmw-3-serisi-320si', 'Otomobil › BMW › 3 Serisi › 320si'),
  ('tasitlar_otomobil-bmw-3-serisi-320td', 'Otomobil › BMW › 3 Serisi › 320td'),
  ('tasitlar_otomobil-bmw-3-serisi-323ci', 'Otomobil › BMW › 3 Serisi › 323Ci'),
  ('tasitlar_otomobil-bmw-3-serisi-323i', 'Otomobil › BMW › 3 Serisi › 323i'),
  ('tasitlar_otomobil-bmw-3-serisi-325ci', 'Otomobil › BMW › 3 Serisi › 325Ci'),
  ('tasitlar_otomobil-bmw-3-serisi-325d', 'Otomobil › BMW › 3 Serisi › 325d'),
  ('tasitlar_otomobil-bmw-3-serisi-325i', 'Otomobil › BMW › 3 Serisi › 325i'),
  ('tasitlar_otomobil-bmw-3-serisi-325i-xdrive', 'Otomobil › BMW › 3 Serisi › 325i xDrive'),
  ('tasitlar_otomobil-bmw-3-serisi-325tds', 'Otomobil › BMW › 3 Serisi › 325tds'),
  ('tasitlar_otomobil-bmw-3-serisi-325ti', 'Otomobil › BMW › 3 Serisi › 325ti'),
  ('tasitlar_otomobil-bmw-3-serisi-325xi', 'Otomobil › BMW › 3 Serisi › 325xi'),
  ('tasitlar_otomobil-bmw-3-serisi-328ci', 'Otomobil › BMW › 3 Serisi › 328Ci'),
  ('tasitlar_otomobil-bmw-3-serisi-328i', 'Otomobil › BMW › 3 Serisi › 328i'),
  ('tasitlar_otomobil-bmw-3-serisi-328i-xdrive', 'Otomobil › BMW › 3 Serisi › 328i xDrive'),
  ('tasitlar_otomobil-bmw-3-serisi-330cd', 'Otomobil › BMW › 3 Serisi › 330Cd'),
  ('tasitlar_otomobil-bmw-3-serisi-330ci', 'Otomobil › BMW › 3 Serisi › 330Ci'),
  ('tasitlar_otomobil-bmw-3-serisi-330d', 'Otomobil › BMW › 3 Serisi › 330d'),
  ('tasitlar_otomobil-bmw-3-serisi-330i', 'Otomobil › BMW › 3 Serisi › 330i'),
  ('tasitlar_otomobil-bmw-3-serisi-330i-xdrive', 'Otomobil › BMW › 3 Serisi › 330i xDrive'),
  ('tasitlar_otomobil-bmw-3-serisi-330xd', 'Otomobil › BMW › 3 Serisi › 330xd'),
  ('tasitlar_otomobil-bmw-3-serisi-330xi', 'Otomobil › BMW › 3 Serisi › 330xi'),
  ('tasitlar_otomobil-bmw-3-serisi-335d', 'Otomobil › BMW › 3 Serisi › 335d'),
  ('tasitlar_otomobil-bmw-3-serisi-335i', 'Otomobil › BMW › 3 Serisi › 335i'),
  ('tasitlar_otomobil-bmw-3-serisi-340d-xdrive', 'Otomobil › BMW › 3 Serisi › 340d xDrive'),
  ('tasitlar_otomobil-bmw-3-serisi-340i-xdrive', 'Otomobil › BMW › 3 Serisi › 340i xDrive'),
  ('tasitlar_otomobil-bmw-4-serisi', 'Otomobil › BMW › 4 Serisi'),
  ('tasitlar_otomobil-bmw-4-serisi-418d', 'Otomobil › BMW › 4 Serisi › 418d'),
  ('tasitlar_otomobil-bmw-4-serisi-418d-gran-coupe', 'Otomobil › BMW › 4 Serisi › 418d Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-418i', 'Otomobil › BMW › 4 Serisi › 418i'),
  ('tasitlar_otomobil-bmw-4-serisi-418i-gran-coupe', 'Otomobil › BMW › 4 Serisi › 418i Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-420d', 'Otomobil › BMW › 4 Serisi › 420d'),
  ('tasitlar_otomobil-bmw-4-serisi-420d-gran-coupe', 'Otomobil › BMW › 4 Serisi › 420d Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-420d-xdrive', 'Otomobil › BMW › 4 Serisi › 420d xDrive'),
  ('tasitlar_otomobil-bmw-4-serisi-420d-xdrive-gran-coupe', 'Otomobil › BMW › 4 Serisi › 420d xDrive Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-420i', 'Otomobil › BMW › 4 Serisi › 420i'),
  ('tasitlar_otomobil-bmw-4-serisi-420i-gran-coupe', 'Otomobil › BMW › 4 Serisi › 420i Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-428i', 'Otomobil › BMW › 4 Serisi › 428i'),
  ('tasitlar_otomobil-bmw-4-serisi-428i-gran-coupe', 'Otomobil › BMW › 4 Serisi › 428i Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-428i-xdrive', 'Otomobil › BMW › 4 Serisi › 428i xDrive'),
  ('tasitlar_otomobil-bmw-4-serisi-428i-xdrive-gran-coupe', 'Otomobil › BMW › 4 Serisi › 428i xDrive Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-430i', 'Otomobil › BMW › 4 Serisi › 430i'),
  ('tasitlar_otomobil-bmw-4-serisi-430i-cabrio-edition-m-sport', 'Otomobil › BMW › 4 Serisi › 430i Cabrio Edition M Sport'),
  ('tasitlar_otomobil-bmw-4-serisi-430i-coupe-edition-m-sport', 'Otomobil › BMW › 4 Serisi › 430i Coupe Edition M Sport'),
  ('tasitlar_otomobil-bmw-4-serisi-430i-xdrive', 'Otomobil › BMW › 4 Serisi › 430i xDrive'),
  ('tasitlar_otomobil-bmw-4-serisi-430i-xdrive-gran-coupe', 'Otomobil › BMW › 4 Serisi › 430i xDrive Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-435i', 'Otomobil › BMW › 4 Serisi › 435i'),
  ('tasitlar_otomobil-bmw-4-serisi-440i-xdrive', 'Otomobil › BMW › 4 Serisi › 440i xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi', 'Otomobil › BMW › 5 Serisi'),
  ('tasitlar_otomobil-bmw-5-serisi-518i', 'Otomobil › BMW › 5 Serisi › 518i'),
  ('tasitlar_otomobil-bmw-5-serisi-520', 'Otomobil › BMW › 5 Serisi › 520'),
  ('tasitlar_otomobil-bmw-5-serisi-520d', 'Otomobil › BMW › 5 Serisi › 520d'),
  ('tasitlar_otomobil-bmw-5-serisi-520d-gran-turismo', 'Otomobil › BMW › 5 Serisi › 520d Gran Turismo'),
  ('tasitlar_otomobil-bmw-5-serisi-520d-xdrive', 'Otomobil › BMW › 5 Serisi › 520d xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-520i', 'Otomobil › BMW › 5 Serisi › 520i'),
  ('tasitlar_otomobil-bmw-5-serisi-520li', 'Otomobil › BMW › 5 Serisi › 520Li'),
  ('tasitlar_otomobil-bmw-5-serisi-523i', 'Otomobil › BMW › 5 Serisi › 523i'),
  ('tasitlar_otomobil-bmw-5-serisi-524d', 'Otomobil › BMW › 5 Serisi › 524d'),
  ('tasitlar_otomobil-bmw-5-serisi-524td', 'Otomobil › BMW › 5 Serisi › 524td'),
  ('tasitlar_otomobil-bmw-5-serisi-525d', 'Otomobil › BMW › 5 Serisi › 525d'),
  ('tasitlar_otomobil-bmw-5-serisi-525d-xdrive', 'Otomobil › BMW › 5 Serisi › 525d xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-525i', 'Otomobil › BMW › 5 Serisi › 525i'),
  ('tasitlar_otomobil-bmw-5-serisi-525ix', 'Otomobil › BMW › 5 Serisi › 525ix'),
  ('tasitlar_otomobil-bmw-5-serisi-525td', 'Otomobil › BMW › 5 Serisi › 525td'),
  ('tasitlar_otomobil-bmw-5-serisi-525tds', 'Otomobil › BMW › 5 Serisi › 525tds'),
  ('tasitlar_otomobil-bmw-5-serisi-525-xdrive', 'Otomobil › BMW › 5 Serisi › 525 xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-528i', 'Otomobil › BMW › 5 Serisi › 528i'),
  ('tasitlar_otomobil-bmw-5-serisi-528i-xdrive', 'Otomobil › BMW › 5 Serisi › 528i xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-530d', 'Otomobil › BMW › 5 Serisi › 530d'),
  ('tasitlar_otomobil-bmw-5-serisi-530d-xdrive', 'Otomobil › BMW › 5 Serisi › 530d xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-530i', 'Otomobil › BMW › 5 Serisi › 530i'),
  ('tasitlar_otomobil-bmw-5-serisi-530i-xdrive', 'Otomobil › BMW › 5 Serisi › 530i xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-530xd-gran-turismo', 'Otomobil › BMW › 5 Serisi › 530xd Gran Turismo'),
  ('tasitlar_otomobil-bmw-5-serisi-530-xdrive', 'Otomobil › BMW › 5 Serisi › 530 xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-530xi', 'Otomobil › BMW › 5 Serisi › 530xi'),
  ('tasitlar_otomobil-bmw-5-serisi-535d', 'Otomobil › BMW › 5 Serisi › 535d'),
  ('tasitlar_otomobil-bmw-5-serisi-535d-xdrive', 'Otomobil › BMW › 5 Serisi › 535d xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-535i', 'Otomobil › BMW › 5 Serisi › 535i'),
  ('tasitlar_otomobil-bmw-5-serisi-535i-xdrive', 'Otomobil › BMW › 5 Serisi › 535i xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-540i', 'Otomobil › BMW › 5 Serisi › 540i'),
  ('tasitlar_otomobil-bmw-5-serisi-540i-xdrive', 'Otomobil › BMW › 5 Serisi › 540i xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-545i', 'Otomobil › BMW › 5 Serisi › 545i'),
  ('tasitlar_otomobil-bmw-5-serisi-550d-xdrive', 'Otomobil › BMW › 5 Serisi › 550d xDrive'),
  ('tasitlar_otomobil-bmw-5-serisi-550-xdrive', 'Otomobil › BMW › 5 Serisi › 550 xDrive'),
  ('tasitlar_otomobil-bmw-6-serisi', 'Otomobil › BMW › 6 Serisi'),
  ('tasitlar_otomobil-bmw-6-serisi-620d-xdrive', 'Otomobil › BMW › 6 Serisi › 620d xDrive'),
  ('tasitlar_otomobil-bmw-6-serisi-630ci', 'Otomobil › BMW › 6 Serisi › 630Ci'),
  ('tasitlar_otomobil-bmw-6-serisi-630i', 'Otomobil › BMW › 6 Serisi › 630i'),
  ('tasitlar_otomobil-bmw-6-serisi-630i-gran-turismo', 'Otomobil › BMW › 6 Serisi › 630i Gran Turismo'),
  ('tasitlar_otomobil-bmw-6-serisi-635d', 'Otomobil › BMW › 6 Serisi › 635d'),
  ('tasitlar_otomobil-bmw-6-serisi-640d', 'Otomobil › BMW › 6 Serisi › 640d'),
  ('tasitlar_otomobil-bmw-6-serisi-640d-xdrive', 'Otomobil › BMW › 6 Serisi › 640d xDrive'),
  ('tasitlar_otomobil-bmw-6-serisi-640i', 'Otomobil › BMW › 6 Serisi › 640i'),
  ('tasitlar_otomobil-bmw-6-serisi-645ci', 'Otomobil › BMW › 6 Serisi › 645Ci'),
  ('tasitlar_otomobil-bmw-6-serisi-650ci', 'Otomobil › BMW › 6 Serisi › 650Ci'),
  ('tasitlar_otomobil-bmw-6-serisi-650i-xdrive', 'Otomobil › BMW › 6 Serisi › 650i xDrive'),
  ('tasitlar_otomobil-bmw-7-serisi', 'Otomobil › BMW › 7 Serisi'),
  ('tasitlar_otomobil-bmw-7-serisi-725d', 'Otomobil › BMW › 7 Serisi › 725d'),
  ('tasitlar_otomobil-bmw-7-serisi-725d-long', 'Otomobil › BMW › 7 Serisi › 725d Long'),
  ('tasitlar_otomobil-bmw-7-serisi-725tds', 'Otomobil › BMW › 7 Serisi › 725tds'),
  ('tasitlar_otomobil-bmw-7-serisi-728i', 'Otomobil › BMW › 7 Serisi › 728i'),
  ('tasitlar_otomobil-bmw-7-serisi-728i-long', 'Otomobil › BMW › 7 Serisi › 728i Long'),
  ('tasitlar_otomobil-bmw-7-serisi-730d', 'Otomobil › BMW › 7 Serisi › 730d'),
  ('tasitlar_otomobil-bmw-7-serisi-730d-long', 'Otomobil › BMW › 7 Serisi › 730d Long'),
  ('tasitlar_otomobil-bmw-7-serisi-730d-xdrive', 'Otomobil › BMW › 7 Serisi › 730d xDrive'),
  ('tasitlar_otomobil-bmw-7-serisi-730d-xdrive-long', 'Otomobil › BMW › 7 Serisi › 730d xDrive Long'),
  ('tasitlar_otomobil-bmw-7-serisi-730i', 'Otomobil › BMW › 7 Serisi › 730i'),
  ('tasitlar_otomobil-bmw-7-serisi-730i-long', 'Otomobil › BMW › 7 Serisi › 730i Long'),
  ('tasitlar_otomobil-bmw-7-serisi-735i', 'Otomobil › BMW › 7 Serisi › 735i'),
  ('tasitlar_otomobil-bmw-7-serisi-735i-long', 'Otomobil › BMW › 7 Serisi › 735i Long'),
  ('tasitlar_otomobil-bmw-7-serisi-740d', 'Otomobil › BMW › 7 Serisi › 740d'),
  ('tasitlar_otomobil-bmw-7-serisi-740d-xdrive', 'Otomobil › BMW › 7 Serisi › 740d xDrive'),
  ('tasitlar_otomobil-bmw-7-serisi-740d-xdrive-long', 'Otomobil › BMW › 7 Serisi › 740d xDrive Long'),
  ('tasitlar_otomobil-bmw-7-serisi-740e-xdrive-long', 'Otomobil › BMW › 7 Serisi › 740e xDrive Long'),
  ('tasitlar_otomobil-bmw-7-serisi-740i', 'Otomobil › BMW › 7 Serisi › 740i'),
  ('tasitlar_otomobil-bmw-7-serisi-740i-long', 'Otomobil › BMW › 7 Serisi › 740i Long'),
  ('tasitlar_otomobil-bmw-7-serisi-745d', 'Otomobil › BMW › 7 Serisi › 745d'),
  ('tasitlar_otomobil-bmw-7-serisi-745i', 'Otomobil › BMW › 7 Serisi › 745i'),
  ('tasitlar_otomobil-bmw-7-serisi-745i-long', 'Otomobil › BMW › 7 Serisi › 745i Long'),
  ('tasitlar_otomobil-bmw-7-serisi-750d-xdrive-long', 'Otomobil › BMW › 7 Serisi › 750d xDrive Long'),
  ('tasitlar_otomobil-bmw-7-serisi-750i', 'Otomobil › BMW › 7 Serisi › 750i'),
  ('tasitlar_otomobil-bmw-7-serisi-750-ial', 'Otomobil › BMW › 7 Serisi › 750 ial'),
  ('tasitlar_otomobil-bmw-7-serisi-750i-long', 'Otomobil › BMW › 7 Serisi › 750i Long'),
  ('tasitlar_otomobil-bmw-7-serisi-750i-xdrive', 'Otomobil › BMW › 7 Serisi › 750i xDrive'),
  ('tasitlar_otomobil-bmw-7-serisi-750i-xdrive-long', 'Otomobil › BMW › 7 Serisi › 750i xDrive Long'),
  ('tasitlar_otomobil-bmw-7-serisi-760i', 'Otomobil › BMW › 7 Serisi › 760i'),
  ('tasitlar_otomobil-bmw-7-serisi-760i-long', 'Otomobil › BMW › 7 Serisi › 760i Long'),
  ('tasitlar_otomobil-bmw-8-serisi', 'Otomobil › BMW › 8 Serisi'),
  ('tasitlar_otomobil-bmw-8-serisi-840ci', 'Otomobil › BMW › 8 Serisi › 840Ci'),
  ('tasitlar_otomobil-bmw-8-serisi-840d-xdrive-gran-coupe', 'Otomobil › BMW › 8 Serisi › 840d xDrive Gran Coupe'),
  ('tasitlar_otomobil-bmw-8-serisi-840i-xdrive', 'Otomobil › BMW › 8 Serisi › 840i xDrive'),
  ('tasitlar_otomobil-bmw-8-serisi-840i-xdrive-gran-coupe', 'Otomobil › BMW › 8 Serisi › 840i xDrive Gran Coupe'),
  ('tasitlar_otomobil-bmw-8-serisi-850ci', 'Otomobil › BMW › 8 Serisi › 850Ci'),
  ('tasitlar_otomobil-bmw-8-serisi-850csi', 'Otomobil › BMW › 8 Serisi › 850CSi'),
  ('tasitlar_otomobil-bmw-i-serisi', 'Otomobil › BMW › i Serisi'),
  ('tasitlar_otomobil-bmw-i-serisi-i3', 'Otomobil › BMW › i Serisi › i3'),
  ('tasitlar_otomobil-bmw-i-serisi-i4', 'Otomobil › BMW › i Serisi › i4'),
  ('tasitlar_otomobil-bmw-i-serisi-i5', 'Otomobil › BMW › i Serisi › i5'),
  ('tasitlar_otomobil-bmw-i-serisi-i7', 'Otomobil › BMW › i Serisi › i7'),
  ('tasitlar_otomobil-bmw-i-serisi-i8', 'Otomobil › BMW › i Serisi › i8'),
  ('tasitlar_otomobil-bmw-z-serisi', 'Otomobil › BMW › Z Serisi'),
  ('tasitlar_otomobil-bmw-z-serisi-z1', 'Otomobil › BMW › Z Serisi › Z1'),
  ('tasitlar_otomobil-bmw-z-serisi-z3', 'Otomobil › BMW › Z Serisi › Z3'),
  ('tasitlar_otomobil-bmw-z-serisi-z4', 'Otomobil › BMW › Z Serisi › Z4'),
  ('tasitlar_otomobil-bmw-m-serisi', 'Otomobil › BMW › M Serisi'),
  ('tasitlar_otomobil-bmw-m-serisi-m1', 'Otomobil › BMW › M Serisi › M1'),
  ('tasitlar_otomobil-bmw-m-serisi-m2', 'Otomobil › BMW › M Serisi › M2'),
  ('tasitlar_otomobil-bmw-m-serisi-m235i-xdrive', 'Otomobil › BMW › M Serisi › M235i xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m240i-xdrive', 'Otomobil › BMW › M Serisi › M240i xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m2-competition', 'Otomobil › BMW › M Serisi › M2 Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-m3', 'Otomobil › BMW › M Serisi › M3'),
  ('tasitlar_otomobil-bmw-m-serisi-m3-cabrio', 'Otomobil › BMW › M Serisi › M3 Cabrio'),
  ('tasitlar_otomobil-bmw-m-serisi-m3-competition', 'Otomobil › BMW › M Serisi › M3 Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-m3-coupe', 'Otomobil › BMW › M Serisi › M3 Coupe'),
  ('tasitlar_otomobil-bmw-m-serisi-m3-touring', 'Otomobil › BMW › M Serisi › M3 Touring'),
  ('tasitlar_otomobil-bmw-m-serisi-m4', 'Otomobil › BMW › M Serisi › M4'),
  ('tasitlar_otomobil-bmw-m-serisi-m440i-xdrive', 'Otomobil › BMW › M Serisi › M440i xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m4-competition', 'Otomobil › BMW › M Serisi › M4 Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-m5', 'Otomobil › BMW › M Serisi › M5'),
  ('tasitlar_otomobil-bmw-m-serisi-m5-competition', 'Otomobil › BMW › M Serisi › M5 Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-m5-touring', 'Otomobil › BMW › M Serisi › M5 Touring'),
  ('tasitlar_otomobil-bmw-m-serisi-m5-xdrive', 'Otomobil › BMW › M Serisi › M5 xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m6', 'Otomobil › BMW › M Serisi › M6'),
  ('tasitlar_otomobil-bmw-m-serisi-m6-cabrio', 'Otomobil › BMW › M Serisi › M6 Cabrio'),
  ('tasitlar_otomobil-bmw-m-serisi-m6-gran-coupe', 'Otomobil › BMW › M Serisi › M6 Gran Coupe'),
  ('tasitlar_otomobil-bmw-m-serisi-m760e-xdrive', 'Otomobil › BMW › M Serisi › M760e xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m850i-xdrive', 'Otomobil › BMW › M Serisi › M850i xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m8-coupe-xdrive-competition', 'Otomobil › BMW › M Serisi › M8 Coupe xDrive Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-m8-gran-coupe-xdrive-competition', 'Otomobil › BMW › M Serisi › M8 Gran Coupe xDrive Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-z3-m-cabrio', 'Otomobil › BMW › M Serisi › Z3 M Cabrio'),
  ('tasitlar_otomobil-chery', 'Otomobil › Chery'),
  ('tasitlar_otomobil-chery-alia', 'Otomobil › Chery › Alia'),
  ('tasitlar_otomobil-chery-chance', 'Otomobil › Chery › Chance'),
  ('tasitlar_otomobil-chery-kimo', 'Otomobil › Chery › Kimo'),
  ('tasitlar_otomobil-chery-niche', 'Otomobil › Chery › Niche'),
  ('tasitlar_otomobil-citroen', 'Otomobil › Citroën'),
  ('tasitlar_otomobil-citroen-ami', 'Otomobil › Citroën › AMI'),
  ('tasitlar_otomobil-citroen-c-elysee', 'Otomobil › Citroën › C-Elysée'),
  ('tasitlar_otomobil-citroen-c1', 'Otomobil › Citroën › C1'),
  ('tasitlar_otomobil-citroen-c2', 'Otomobil › Citroën › C2'),
  ('tasitlar_otomobil-citroen-c3', 'Otomobil › Citroën › C3'),
  ('tasitlar_otomobil-citroen-e-c3', 'Otomobil › Citroën › e-C3'),
  ('tasitlar_otomobil-citroen-c3-picasso', 'Otomobil › Citroën › C3 Picasso'),
  ('tasitlar_otomobil-citroen-c4', 'Otomobil › Citroën › C4'),
  ('tasitlar_otomobil-citroen-c4-grand-picasso', 'Otomobil › Citroën › C4 Grand Picasso'),
  ('tasitlar_otomobil-citroen-c4-picasso', 'Otomobil › Citroën › C4 Picasso'),
  ('tasitlar_otomobil-citroen-c4-x', 'Otomobil › Citroën › C4 X'),
  ('tasitlar_otomobil-citroen-e-c4', 'Otomobil › Citroën › e-C4'),
  ('tasitlar_otomobil-citroen-e-c4-x', 'Otomobil › Citroën › e-C4 X'),
  ('tasitlar_otomobil-citroen-c5', 'Otomobil › Citroën › C5'),
  ('tasitlar_otomobil-citroen-c6', 'Otomobil › Citroën › C6'),
  ('tasitlar_otomobil-citroen-c8', 'Otomobil › Citroën › C8'),
  ('tasitlar_otomobil-citroen-saxo', 'Otomobil › Citroën › Saxo'),
  ('tasitlar_otomobil-citroen-xsara', 'Otomobil › Citroën › Xsara'),
  ('tasitlar_otomobil-citroen-bx', 'Otomobil › Citroën › BX'),
  ('tasitlar_otomobil-citroen-xantia', 'Otomobil › Citroën › Xantia'),
  ('tasitlar_otomobil-citroen-xm', 'Otomobil › Citroën › XM'),
  ('tasitlar_otomobil-citroen-zx', 'Otomobil › Citroën › ZX'),
  ('tasitlar_otomobil-fiat', 'Otomobil › Fiat'),
  ('tasitlar_otomobil-fiat-124-spider', 'Otomobil › Fiat › 124 Spider'),
  ('tasitlar_otomobil-fiat-albea', 'Otomobil › Fiat › Albea'),
  ('tasitlar_otomobil-fiat-brava', 'Otomobil › Fiat › Brava'),
  ('tasitlar_otomobil-fiat-bravo', 'Otomobil › Fiat › Bravo'),
  ('tasitlar_otomobil-fiat-126-bis', 'Otomobil › Fiat › 126 Bis'),
  ('tasitlar_otomobil-fiat-coupe', 'Otomobil › Fiat › Coupe'),
  ('tasitlar_otomobil-fiat-croma', 'Otomobil › Fiat › Croma'),
  ('tasitlar_otomobil-fiat-500-ailesi', 'Otomobil › Fiat › 500 Ailesi'),
  ('tasitlar_otomobil-fiat-egea', 'Otomobil › Fiat › Egea'),
  ('tasitlar_otomobil-fiat-idea', 'Otomobil › Fiat › Idea'),
  ('tasitlar_otomobil-fiat-linea', 'Otomobil › Fiat › Linea'),
  ('tasitlar_otomobil-fiat-marea', 'Otomobil › Fiat › Marea'),
  ('tasitlar_otomobil-fiat-mirafiori', 'Otomobil › Fiat › Mirafiori'),
  ('tasitlar_otomobil-fiat-palio', 'Otomobil › Fiat › Palio'),
  ('tasitlar_otomobil-fiat-panda', 'Otomobil › Fiat › Panda'),
  ('tasitlar_otomobil-fiat-punto', 'Otomobil › Fiat › Punto'),
  ('tasitlar_otomobil-fiat-siena', 'Otomobil › Fiat › Siena'),
  ('tasitlar_otomobil-fiat-stilo', 'Otomobil › Fiat › Stilo'),
  ('tasitlar_otomobil-fiat-tempra', 'Otomobil › Fiat › Tempra'),
  ('tasitlar_otomobil-fiat-tipo', 'Otomobil › Fiat › Tipo'),
  ('tasitlar_otomobil-fiat-topolino', 'Otomobil › Fiat › Topolino'),
  ('tasitlar_otomobil-fiat-ulysse', 'Otomobil › Fiat › Ulysse'),
  ('tasitlar_otomobil-fiat-uno', 'Otomobil › Fiat › UNO'),
  ('tasitlar_otomobil-ford', 'Otomobil › Ford'),
  ('tasitlar_otomobil-ford-b-max', 'Otomobil › Ford › B-Max'),
  ('tasitlar_otomobil-ford-c-max', 'Otomobil › Ford › C-Max'),
  ('tasitlar_otomobil-ford-escort', 'Otomobil › Ford › Escort'),
  ('tasitlar_otomobil-ford-fiesta', 'Otomobil › Ford › Fiesta'),
  ('tasitlar_otomobil-ford-focus', 'Otomobil › Ford › Focus'),
  ('tasitlar_otomobil-ford-fusion', 'Otomobil › Ford › Fusion'),
  ('tasitlar_otomobil-ford-galaxy', 'Otomobil › Ford › Galaxy'),
  ('tasitlar_otomobil-ford-grand-c-max', 'Otomobil › Ford › Grand C-Max'),
  ('tasitlar_otomobil-ford-ka', 'Otomobil › Ford › Ka'),
  ('tasitlar_otomobil-ford-mondeo', 'Otomobil › Ford › Mondeo'),
  ('tasitlar_otomobil-ford-mustang', 'Otomobil › Ford › Mustang'),
  ('tasitlar_otomobil-ford-s-max', 'Otomobil › Ford › S-Max'),
  ('tasitlar_otomobil-ford-taurus', 'Otomobil › Ford › Taurus'),
  ('tasitlar_otomobil-ford-cougar', 'Otomobil › Ford › Cougar'),
  ('tasitlar_otomobil-ford-festiva', 'Otomobil › Ford › Festiva'),
  ('tasitlar_otomobil-ford-granada', 'Otomobil › Ford › Granada'),
  ('tasitlar_otomobil-ford-orion', 'Otomobil › Ford › Orion'),
  ('tasitlar_otomobil-ford-probe', 'Otomobil › Ford › Probe'),
  ('tasitlar_otomobil-ford-scorpio', 'Otomobil › Ford › Scorpio'),
  ('tasitlar_otomobil-ford-sierra', 'Otomobil › Ford › Sierra'),
  ('tasitlar_otomobil-ford-taunus', 'Otomobil › Ford › Taunus'),
  ('tasitlar_otomobil-ford-thunderbird', 'Otomobil › Ford › Thunderbird'),
  ('tasitlar_otomobil-hyundai', 'Otomobil › Hyundai'),
  ('tasitlar_otomobil-hyundai-accent', 'Otomobil › Hyundai › Accent'),
  ('tasitlar_otomobil-hyundai-accent-blue', 'Otomobil › Hyundai › Accent Blue'),
  ('tasitlar_otomobil-hyundai-accent-era', 'Otomobil › Hyundai › Accent Era'),
  ('tasitlar_otomobil-hyundai-atos', 'Otomobil › Hyundai › Atos'),
  ('tasitlar_otomobil-hyundai-centennial', 'Otomobil › Hyundai › Centennial'),
  ('tasitlar_otomobil-hyundai-coupe', 'Otomobil › Hyundai › Coupe'),
  ('tasitlar_otomobil-hyundai-elantra', 'Otomobil › Hyundai › Elantra'),
  ('tasitlar_otomobil-hyundai-excel', 'Otomobil › Hyundai › Excel'),
  ('tasitlar_otomobil-hyundai-genesis', 'Otomobil › Hyundai › Genesis'),
  ('tasitlar_otomobil-hyundai-getz', 'Otomobil › Hyundai › Getz'),
  ('tasitlar_otomobil-hyundai-grandeur', 'Otomobil › Hyundai › Grandeur'),
  ('tasitlar_otomobil-hyundai-i10', 'Otomobil › Hyundai › i10'),
  ('tasitlar_otomobil-hyundai-i20', 'Otomobil › Hyundai › i20'),
  ('tasitlar_otomobil-hyundai-i20-active', 'Otomobil › Hyundai › i20 Active'),
  ('tasitlar_otomobil-hyundai-i20-n', 'Otomobil › Hyundai › i20 N'),
  ('tasitlar_otomobil-hyundai-i30', 'Otomobil › Hyundai › i30'),
  ('tasitlar_otomobil-hyundai-i40', 'Otomobil › Hyundai › i40'),
  ('tasitlar_otomobil-hyundai-ioniq', 'Otomobil › Hyundai › Ioniq'),
  ('tasitlar_otomobil-hyundai-ioniq-6', 'Otomobil › Hyundai › Ioniq 6'),
  ('tasitlar_otomobil-hyundai-ix20', 'Otomobil › Hyundai › iX20'),
  ('tasitlar_otomobil-hyundai-matrix', 'Otomobil › Hyundai › Matrix'),
  ('tasitlar_otomobil-hyundai-s-coupe', 'Otomobil › Hyundai › S-Coupe'),
  ('tasitlar_otomobil-hyundai-sonata', 'Otomobil › Hyundai › Sonata'),
  ('tasitlar_otomobil-hyundai-trajet', 'Otomobil › Hyundai › Trajet'),
  ('tasitlar_otomobil-opel', 'Otomobil › Opel'),
  ('tasitlar_otomobil-opel-adam', 'Otomobil › Opel › Adam'),
  ('tasitlar_otomobil-opel-agila', 'Otomobil › Opel › Agila'),
  ('tasitlar_otomobil-opel-ascona', 'Otomobil › Opel › Ascona'),
  ('tasitlar_otomobil-opel-astra', 'Otomobil › Opel › Astra'),
  ('tasitlar_otomobil-opel-astra-e', 'Otomobil › Opel › Astra-e'),
  ('tasitlar_otomobil-opel-calibra', 'Otomobil › Opel › Calibra'),
  ('tasitlar_otomobil-opel-cascada', 'Otomobil › Opel › Cascada'),
  ('tasitlar_otomobil-opel-corsa', 'Otomobil › Opel › Corsa'),
  ('tasitlar_otomobil-opel-corsa-e', 'Otomobil › Opel › Corsa-e'),
  ('tasitlar_otomobil-opel-gt-roadster', 'Otomobil › Opel › GT (Roadster)'),
  ('tasitlar_otomobil-opel-insignia', 'Otomobil › Opel › Insignia'),
  ('tasitlar_otomobil-opel-kadett', 'Otomobil › Opel › Kadett'),
  ('tasitlar_otomobil-opel-manta', 'Otomobil › Opel › Manta'),
  ('tasitlar_otomobil-opel-meriva', 'Otomobil › Opel › Meriva'),
  ('tasitlar_otomobil-opel-omega', 'Otomobil › Opel › Omega'),
  ('tasitlar_otomobil-opel-rekord', 'Otomobil › Opel › Rekord'),
  ('tasitlar_otomobil-opel-signum', 'Otomobil › Opel › Signum'),
  ('tasitlar_otomobil-opel-tigra', 'Otomobil › Opel › Tigra'),
  ('tasitlar_otomobil-opel-vectra', 'Otomobil › Opel › Vectra'),
  ('tasitlar_otomobil-opel-zafira', 'Otomobil › Opel › Zafira'),
  ('tasitlar_otomobil-peugeot', 'Otomobil › Peugeot'),
  ('tasitlar_otomobil-peugeot-106', 'Otomobil › Peugeot › 106'),
  ('tasitlar_otomobil-peugeot-107', 'Otomobil › Peugeot › 107'),
  ('tasitlar_otomobil-peugeot-205', 'Otomobil › Peugeot › 205'),
  ('tasitlar_otomobil-peugeot-206', 'Otomobil › Peugeot › 206'),
  ('tasitlar_otomobil-peugeot-206-plus', 'Otomobil › Peugeot › 206 +'),
  ('tasitlar_otomobil-peugeot-207', 'Otomobil › Peugeot › 207'),
  ('tasitlar_otomobil-peugeot-208', 'Otomobil › Peugeot › 208'),
  ('tasitlar_otomobil-peugeot-e-208', 'Otomobil › Peugeot › e-208'),
  ('tasitlar_otomobil-peugeot-301', 'Otomobil › Peugeot › 301'),
  ('tasitlar_otomobil-peugeot-305', 'Otomobil › Peugeot › 305'),
  ('tasitlar_otomobil-peugeot-306', 'Otomobil › Peugeot › 306'),
  ('tasitlar_otomobil-peugeot-307', 'Otomobil › Peugeot › 307'),
  ('tasitlar_otomobil-peugeot-308', 'Otomobil › Peugeot › 308'),
  ('tasitlar_otomobil-peugeot-e-308', 'Otomobil › Peugeot › e-308'),
  ('tasitlar_otomobil-peugeot-405', 'Otomobil › Peugeot › 405'),
  ('tasitlar_otomobil-peugeot-406', 'Otomobil › Peugeot › 406'),
  ('tasitlar_otomobil-peugeot-407', 'Otomobil › Peugeot › 407'),
  ('tasitlar_otomobil-peugeot-508', 'Otomobil › Peugeot › 508'),
  ('tasitlar_otomobil-peugeot-605', 'Otomobil › Peugeot › 605'),
  ('tasitlar_otomobil-peugeot-607', 'Otomobil › Peugeot › 607'),
  ('tasitlar_otomobil-peugeot-807', 'Otomobil › Peugeot › 807'),
  ('tasitlar_otomobil-peugeot-pars', 'Otomobil › Peugeot › Pars'),
  ('tasitlar_otomobil-peugeot-rcz', 'Otomobil › Peugeot › RCZ'),
  ('tasitlar_otomobil-peugeot-1007', 'Otomobil › Peugeot › 1007'),
  ('tasitlar_otomobil-renault', 'Otomobil › Renault'),
  ('tasitlar_otomobil-renault-clio', 'Otomobil › Renault › Clio'),
  ('tasitlar_otomobil-renault-espace', 'Otomobil › Renault › Espace'),
  ('tasitlar_otomobil-renault-fluence', 'Otomobil › Renault › Fluence'),
  ('tasitlar_otomobil-renault-fluence-ze', 'Otomobil › Renault › Fluence Z.E.'),
  ('tasitlar_otomobil-renault-grand-scenic', 'Otomobil › Renault › Grand Scenic'),
  ('tasitlar_otomobil-renault-grand-modus', 'Otomobil › Renault › Grand Modüs'),
  ('tasitlar_otomobil-renault-laguna', 'Otomobil › Renault › Laguna'),
  ('tasitlar_otomobil-renault-latitude', 'Otomobil › Renault › Latitude'),
  ('tasitlar_otomobil-renault-megane', 'Otomobil › Renault › Megane'),
  ('tasitlar_otomobil-renault-megane-e-tech', 'Otomobil › Renault › Megane E-Tech'),
  ('tasitlar_otomobil-renault-modus', 'Otomobil › Renault › Modus'),
  ('tasitlar_otomobil-renault-safrane', 'Otomobil › Renault › Safrane'),
  ('tasitlar_otomobil-renault-scenic', 'Otomobil › Renault › Scenic'),
  ('tasitlar_otomobil-renault-symbol', 'Otomobil › Renault › Symbol'),
  ('tasitlar_otomobil-renault-taliant', 'Otomobil › Renault › Taliant'),
  ('tasitlar_otomobil-renault-talisman', 'Otomobil › Renault › Talisman'),
  ('tasitlar_otomobil-renault-twingo', 'Otomobil › Renault › Twingo'),
  ('tasitlar_otomobil-renault-twizy', 'Otomobil › Renault › Twizy'),
  ('tasitlar_otomobil-renault-vel-satis', 'Otomobil › Renault › Vel Satis'),
  ('tasitlar_otomobil-renault-zoe', 'Otomobil › Renault › ZOE'),
  ('tasitlar_otomobil-renault-r5-e-tech', 'Otomobil › Renault › R5 E-Tech'),
  ('tasitlar_otomobil-renault-r-5', 'Otomobil › Renault › R 5'),
  ('tasitlar_otomobil-renault-r-9', 'Otomobil › Renault › R 9'),
  ('tasitlar_otomobil-renault-r-11', 'Otomobil › Renault › R 11'),
  ('tasitlar_otomobil-renault-r-12', 'Otomobil › Renault › R 12'),
  ('tasitlar_otomobil-renault-r-19', 'Otomobil › Renault › R 19'),
  ('tasitlar_otomobil-renault-r-21', 'Otomobil › Renault › R 21'),
  ('tasitlar_otomobil-renault-r-25', 'Otomobil › Renault › R 25'),
  ('tasitlar_otomobil-skoda', 'Otomobil › Skoda'),
  ('tasitlar_otomobil-skoda-citigo', 'Otomobil › Skoda › Citigo'),
  ('tasitlar_otomobil-skoda-fabia', 'Otomobil › Skoda › Fabia'),
  ('tasitlar_otomobil-skoda-favorit', 'Otomobil › Skoda › Favorit'),
  ('tasitlar_otomobil-skoda-felicia', 'Otomobil › Skoda › Felicia'),
  ('tasitlar_otomobil-skoda-forman', 'Otomobil › Skoda › Forman'),
  ('tasitlar_otomobil-skoda-octavia', 'Otomobil › Skoda › Octavia'),
  ('tasitlar_otomobil-skoda-rapid', 'Otomobil › Skoda › Rapid'),
  ('tasitlar_otomobil-skoda-roomster', 'Otomobil › Skoda › Roomster'),
  ('tasitlar_otomobil-skoda-scala', 'Otomobil › Skoda › Scala'),
  ('tasitlar_otomobil-skoda-superb', 'Otomobil › Skoda › Superb'),
  ('tasitlar_otomobil-togg', 'Otomobil › TOGG'),
  ('tasitlar_otomobil-togg-t10f', 'Otomobil › TOGG › T10F'),
  ('tasitlar_otomobil-togg-v1', 'Otomobil › TOGG › V1'),
  ('tasitlar_otomobil-togg-v2', 'Otomobil › TOGG › V2'),
  ('tasitlar_otomobil-toyota', 'Otomobil › Toyota'),
  ('tasitlar_otomobil-toyota-auris', 'Otomobil › Toyota › Auris'),
  ('tasitlar_otomobil-toyota-avensis', 'Otomobil › Toyota › Avensis'),
  ('tasitlar_otomobil-toyota-avalon', 'Otomobil › Toyota › Avalon'),
  ('tasitlar_otomobil-toyota-camry', 'Otomobil › Toyota › Camry'),
  ('tasitlar_otomobil-toyota-carina', 'Otomobil › Toyota › Carina'),
  ('tasitlar_otomobil-toyota-celica', 'Otomobil › Toyota › Celica'),
  ('tasitlar_otomobil-toyota-corolla', 'Otomobil › Toyota › Corolla'),
  ('tasitlar_otomobil-toyota-corona', 'Otomobil › Toyota › Corona'),
  ('tasitlar_otomobil-toyota-cressida', 'Otomobil › Toyota › Cressida'),
  ('tasitlar_otomobil-toyota-gt86', 'Otomobil › Toyota › GT86'),
  ('tasitlar_otomobil-toyota-mr2', 'Otomobil › Toyota › MR2'),
  ('tasitlar_otomobil-toyota-prius', 'Otomobil › Toyota › Prius'),
  ('tasitlar_otomobil-toyota-starlet', 'Otomobil › Toyota › Starlet'),
  ('tasitlar_otomobil-toyota-supra', 'Otomobil › Toyota › Supra'),
  ('tasitlar_otomobil-toyota-tercel', 'Otomobil › Toyota › Tercel'),
  ('tasitlar_otomobil-toyota-urban-cruiser', 'Otomobil › Toyota › Urban Cruiser'),
  ('tasitlar_otomobil-toyota-verso', 'Otomobil › Toyota › Verso'),
  ('tasitlar_otomobil-toyota-yaris', 'Otomobil › Toyota › Yaris'),
  ('tasitlar_otomobil-tofas', 'Otomobil › Tofaş'),
  ('tasitlar_otomobil-tofas-dogan', 'Otomobil › Tofaş › Doğan'),
  ('tasitlar_otomobil-tofas-kartal', 'Otomobil › Tofaş › Kartal'),
  ('tasitlar_otomobil-tofas-murat', 'Otomobil › Tofaş › Murat'),
  ('tasitlar_otomobil-tofas-sahin', 'Otomobil › Tofaş › Şahin'),
  ('tasitlar_otomobil-tofas-serce', 'Otomobil › Tofaş › Serçe'),
  ('tasitlar_otomobil-volkswagen', 'Otomobil › Volkswagen'),
  ('tasitlar_otomobil-volkswagen-arteon', 'Otomobil › Volkswagen › Arteon'),
  ('tasitlar_otomobil-volkswagen-beetle', 'Otomobil › Volkswagen › Beetle'),
  ('tasitlar_otomobil-volkswagen-bora', 'Otomobil › Volkswagen › Bora'),
  ('tasitlar_otomobil-volkswagen-eos', 'Otomobil › Volkswagen › EOS'),
  ('tasitlar_otomobil-volkswagen-fox', 'Otomobil › Volkswagen › FOX'),
  ('tasitlar_otomobil-volkswagen-golf', 'Otomobil › Volkswagen › Golf'),
  ('tasitlar_otomobil-volkswagen-id-3', 'Otomobil › Volkswagen › ID.3'),
  ('tasitlar_otomobil-volkswagen-id-7', 'Otomobil › Volkswagen › ID.7'),
  ('tasitlar_otomobil-volkswagen-jetta', 'Otomobil › Volkswagen › Jetta'),
  ('tasitlar_otomobil-volkswagen-lupo', 'Otomobil › Volkswagen › Lupo'),
  ('tasitlar_otomobil-volkswagen-passat', 'Otomobil › Volkswagen › Passat'),
  ('tasitlar_otomobil-volkswagen-passat-alltrack', 'Otomobil › Volkswagen › Passat Alltrack'),
  ('tasitlar_otomobil-volkswagen-passat-variant', 'Otomobil › Volkswagen › Passat Variant'),
  ('tasitlar_otomobil-volkswagen-phaeton', 'Otomobil › Volkswagen › Phaeton'),
  ('tasitlar_otomobil-volkswagen-polo', 'Otomobil › Volkswagen › Polo'),
  ('tasitlar_otomobil-volkswagen-scirocco', 'Otomobil › Volkswagen › Scirocco'),
  ('tasitlar_otomobil-volkswagen-sharan', 'Otomobil › Volkswagen › Sharan'),
  ('tasitlar_otomobil-volkswagen-touran', 'Otomobil › Volkswagen › Touran'),
  ('tasitlar_otomobil-volkswagen-up-club', 'Otomobil › Volkswagen › Up Club'),
  ('tasitlar_otomobil-volkswagen-vw-cc', 'Otomobil › Volkswagen › VW CC'),
  ('tasitlar_otomobil-volkswagen-vento', 'Otomobil › Volkswagen › Vento'),
  ('tasitlar_motosiklet', 'Motosiklet'),
  ('tasitlar_bisiklet', 'Bisiklet'),
  ('tasitlar_ticari-araclar', 'Ticari araç'),
  ('tasitlar_deniz-tasitlari', 'Deniz aracı (tekne, yat)'),
  ('gayrimenkul_konut', 'Konut'),
  ('gayrimenkul_konut-satilik-daire', 'Konut › Satılık › Daire'),
  ('gayrimenkul_konut-satilik-rezidans', 'Konut › Satılık › Rezidans'),
  ('gayrimenkul_konut-satilik-mustakil-ev', 'Konut › Satılık › Müstakil Ev'),
  ('gayrimenkul_konut-satilik-villa', 'Konut › Satılık › Villa'),
  ('gayrimenkul_konut-satilik-ciftlik-evi', 'Konut › Satılık › Çiftlik Evi'),
  ('gayrimenkul_konut-satilik-kosk-konak', 'Konut › Satılık › Köşk & Konak'),
  ('gayrimenkul_konut-satilik-yali', 'Konut › Satılık › Yalı'),
  ('gayrimenkul_konut-satilik-yazlik', 'Konut › Satılık › Yazlık'),
  ('gayrimenkul_konut-kiralik-daire', 'Konut › Kiralık › Daire'),
  ('gayrimenkul_konut-kiralik-rezidans', 'Konut › Kiralık › Rezidans'),
  ('gayrimenkul_konut-kiralik-mustakil-ev', 'Konut › Kiralık › Müstakil Ev'),
  ('gayrimenkul_konut-kiralik-villa', 'Konut › Kiralık › Villa'),
  ('gayrimenkul_konut-kiralik-ciftlik-evi', 'Konut › Kiralık › Çiftlik Evi'),
  ('gayrimenkul_konut-kiralik-kosk-konak', 'Konut › Kiralık › Köşk & Konak'),
  ('gayrimenkul_konut-kiralik-yali', 'Konut › Kiralık › Yalı'),
  ('gayrimenkul_konut-kiralik-yazlik', 'Konut › Kiralık › Yazlık'),
  ('gayrimenkul_isyeri-ofis-satilik', 'İş yeri › Satılık'),
  ('gayrimenkul_isyeri-ofis-kiralik', 'İş yeri › Kiralık'),
  ('gayrimenkul_arsa-satilik', 'Arsa › Satılık'),
  ('gayrimenkul_arsa-kiralik', 'Arsa › Kiralık'),
  ('gayrimenkul_toprak-satilik', 'Toprak & tarla › Satılık'),
  ('gayrimenkul_toprak-kiralik', 'Toprak & tarla › Kiralık'),
  ('gayrimenkul_depo-garaj-satilik', 'Depo & garaj › Satılık'),
  ('gayrimenkul_depo-garaj-kiralik', 'Depo & garaj › Kiralık'),
  ('gayrimenkul_ev', 'Müstakil ev'),
  ('gayrimenkul_arsa', 'Arsa'),
  ('gayrimenkul_daire', 'Daire'),
  ('gayrimenkul_villa', 'Villa'),
  ('gayrimenkul_isyeri-ofis', 'İş yeri'),
  ('gayrimenkul_toprak', 'Toprak & tarla'),
  ('gayrimenkul_depo-garaj', 'Depo & garaj'),
  ('elektronik_telefon', 'Cep telefonu'),
  ('elektronik_bilgisayar-tablet', 'Bilgisayar & tablet'),
  ('elektronik_televizyon', 'TV & görüntü'),
  ('elektronik_beyaz-esya', 'Beyaz eşya'),
  ('elektronik_ses-hoparlor', 'Ses & görüntü'),
  ('moda-kisisel_giyim', 'Giyim'),
  ('moda-kisisel_ayakkabi', 'Ayakkabı'),
  ('moda-kisisel_canta-aksesuar', 'Çanta & Aksesuar'),
  ('moda-kisisel_saat-taki', 'Saat & Takı'),
  ('ev-yasam_mobilya', 'Mobilya'),
  ('ev-yasam_ev-dekorasyonu', 'Ev dekorasyon'),
  ('ev-yasam_mutfak-esyalari', 'Mutfak'),
  ('ev-yasam_bahce-balkon', 'Bahçe & balkon'),
  ('hobi-eglence_oyun-konsolu-oyunlar', 'Oyun & konsol'),
  ('hobi-eglence_spor-malzemeleri', 'Spor'),
  ('hobi-eglence_muzik-aletleri', 'Müzik'),
  ('hobi-eglence_koleksiyon-urunleri', 'Koleksiyon'),
  ('hayvanlar_evcil-hayvanlar', 'Evcil hayvan'),
  ('hayvanlar_hayvan-aksesuarlari', 'Aksesuar'),
  ('hayvanlar_mama-bakim-urunleri', 'Mama & bakım'),
  ('is-sanayi_tarim-makineleri', 'Tarım makinesi'),
  ('is-sanayi_insaat-ekipmanlari', 'İnşaat'),
  ('is-sanayi_el-aletleri', 'El aleti'),
  ('is-sanayi_ofis-malzemeleri', 'Ofis')
on conflict (slug) do nothing;

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

-- Site tercihleri (anasayfa teması; ayrıntı: sql/migration_site_settings.sql)
create table if not exists site_settings (
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
  listing_duration_days smallint not null default 30
    check (listing_duration_days >= 7 and listing_duration_days <= 365),
  broadcast_notification_body text not null default '',
  broadcast_notification_updated_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into site_settings (id, homepage_theme, listing_duration_days)
values (1, 'v2', 30)
on conflict (id) do nothing;
alter table site_settings enable row level security;
create policy "site_settings read all" on site_settings for select using (true);

-- Metin sayfaları (sözleşme, KVKK, politikalar); ayrıntı: sql/migration_site_legal_pages.sql
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
