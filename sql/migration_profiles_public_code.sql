-- Üye numarası: tarayıcıda /kullanici/123456 (6–9 hane). Bir kez çalıştırın.

alter table profiles add column if not exists public_code text;

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

do $$
declare r record;
begin
  for r in select id from profiles where public_code is null loop
    update profiles
    set public_code = public.generate_profile_public_code()
    where id = r.id;
  end loop;
end $$;

alter table profiles alter column public_code set not null;

alter table profiles drop constraint if exists profiles_public_code_digits;
alter table profiles add constraint profiles_public_code_digits
  check (public_code ~ '^[0-9]{6,9}$');

drop index if exists idx_profiles_public_code;
create unique index idx_profiles_public_code on profiles(public_code);

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
