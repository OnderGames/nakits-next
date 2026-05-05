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
  constraint listings_listing_code_digits check (listing_code ~ '^[0-9]{6,9}$'),
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
  ('tasitlar_otomobil-chery', 'Otomobil › Chery'),
  ('tasitlar_otomobil-citroen', 'Otomobil › Citroën'),
  ('tasitlar_otomobil-fiat', 'Otomobil › Fiat'),
  ('tasitlar_otomobil-ford', 'Otomobil › Ford'),
  ('tasitlar_otomobil-hyundai', 'Otomobil › Hyundai'),
  ('tasitlar_otomobil-opel', 'Otomobil › Opel'),
  ('tasitlar_otomobil-peugeot', 'Otomobil › Peugeot'),
  ('tasitlar_otomobil-renault', 'Otomobil › Renault'),
  ('tasitlar_otomobil-skoda', 'Otomobil › Skoda'),
  ('tasitlar_otomobil-togg', 'Otomobil › TOGG'),
  ('tasitlar_otomobil-toyota', 'Otomobil › Toyota'),
  ('tasitlar_otomobil-tofas', 'Otomobil › Tofaş'),
  ('tasitlar_otomobil-volkswagen', 'Otomobil › Volkswagen'),
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
  updated_at timestamptz not null default now()
);
insert into site_settings (id, homepage_theme) values (1, 'v2') on conflict (id) do nothing;
alter table site_settings enable row level security;
create policy "site_settings read all" on site_settings for select using (true);
