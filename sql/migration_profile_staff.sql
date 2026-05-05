-- Moderasyon alanları: profile_staff (anon RLS ile okunamaz; yalnız service_role/API)
-- Supabase SQL Editor'da sırayla çalıştırın.

create table if not exists public.profile_staff (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  app_role text not null default 'member'
    constraint profile_staff_role_check check (app_role in ('member', 'moderator', 'admin')),
  is_blocked boolean not null default false,
  moderation_flagged boolean not null default false,
  admin_verified_email boolean not null default false,
  admin_verified_phone boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_profile_staff_app_role on public.profile_staff (app_role);

alter table public.profile_staff enable row level security;

drop trigger if exists trg_profile_staff_updated_at on public.profile_staff;
create trigger trg_profile_staff_updated_at
before update on public.profile_staff
for each row
execute function public.set_updated_at();

-- Mevcut üyeler
insert into public.profile_staff (profile_id)
select p.id from public.profiles p
where not exists (select 1 from public.profile_staff s where s.profile_id = p.id)
on conflict (profile_id) do nothing;

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
