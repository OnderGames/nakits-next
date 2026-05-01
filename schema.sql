-- Nakits MVP PostgreSQL/Supabase schema

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text,
  city text,
  avatar_url text,
  created_at timestamptz not null default now()
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
  status text not null default 'pending' check (status in ('pending', 'active', 'sold', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id, seller_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_listings_status_created_at on listings(status, created_at desc);
create index if not exists idx_listings_category on listings(category_id);
create index if not exists idx_listings_city on listings(city);
create index if not exists idx_messages_conversation on messages(conversation_id, created_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
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

-- Alt kategori satirlari (slug: grup_alt, name: liste etiketi)
insert into categories (slug, name)
values
  ('tasitlar_otomobil', 'Otomobil'),
  ('tasitlar_motosiklet', 'Motosiklet'),
  ('tasitlar_bisiklet', 'Bisiklet'),
  ('tasitlar_ticari-araclar', 'Ticari araçlar (kamyon, minibüs, otobüs)'),
  ('tasitlar_deniz-tasitlari', 'Deniz taşıtları (tekne, yat)'),
  ('gayrimenkul_ev', 'Ev'),
  ('gayrimenkul_arsa', 'Arsa'),
  ('gayrimenkul_daire', 'Daire'),
  ('gayrimenkul_villa', 'Villa'),
  ('gayrimenkul_isyeri-ofis', 'İş yeri / Ofis'),
  ('gayrimenkul_depo-garaj', 'Depo / Garaj'),
  ('elektronik_telefon', 'Telefon'),
  ('elektronik_bilgisayar-tablet', 'Bilgisayar / Tablet'),
  ('elektronik_televizyon', 'Televizyon'),
  ('elektronik_beyaz-esya', 'Beyaz eşya'),
  ('elektronik_ses-hoparlor', 'Ses sistemleri / Hoparlör'),
  ('moda-kisisel_giyim', 'Giyim'),
  ('moda-kisisel_ayakkabi', 'Ayakkabı'),
  ('moda-kisisel_canta-aksesuar', 'Çanta & Aksesuar'),
  ('moda-kisisel_saat-taki', 'Saat & Takı'),
  ('ev-yasam_mobilya', 'Mobilya'),
  ('ev-yasam_ev-dekorasyonu', 'Ev dekorasyonu'),
  ('ev-yasam_mutfak-esyalari', 'Mutfak eşyaları'),
  ('ev-yasam_bahce-balkon', 'Bahçe & Balkon ürünleri'),
  ('hobi-eglence_oyun-konsolu-oyunlar', 'Oyun konsolu & oyunlar'),
  ('hobi-eglence_spor-malzemeleri', 'Spor malzemeleri'),
  ('hobi-eglence_muzik-aletleri', 'Müzik aletleri'),
  ('hobi-eglence_koleksiyon-urunleri', 'Koleksiyon ürünleri'),
  ('hayvanlar_evcil-hayvanlar', 'Evcil hayvanlar'),
  ('hayvanlar_hayvan-aksesuarlari', 'Hayvan aksesuarları'),
  ('hayvanlar_mama-bakim-urunleri', 'Mama & bakım ürünleri'),
  ('is-sanayi_tarim-makineleri', 'Tarım makineleri'),
  ('is-sanayi_insaat-ekipmanlari', 'İnşaat ekipmanları'),
  ('is-sanayi_el-aletleri', 'El aletleri'),
  ('is-sanayi_ofis-malzemeleri', 'Ofis malzemeleri')
on conflict (slug) do nothing;
