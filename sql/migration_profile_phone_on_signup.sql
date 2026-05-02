-- Kayıtta gönderilen telefonun profiles.phone'a yazılması (Supabase SQL Editor'da çalıştırın)
-- Üye numarası ve güncel handle_new_user için ayrıca sql/migration_profiles_public_code.sql çalıştırın.

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

  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    phone_raw
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
