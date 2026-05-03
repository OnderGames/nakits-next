-- Mesaj: karşı taraf okudu bilgisi + kullanıcı gelen mesajı kendi görünümünden gizler
-- Supabase SQL Editor'da bir kez çalıştırın.

create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  reader_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, reader_id)
);

create index if not exists idx_message_reads_reader on public.message_reads(reader_id);

alter table public.message_reads enable row level security;

drop policy if exists "message_reads select participants" on public.message_reads;
create policy "message_reads select participants"
on public.message_reads for select
using (
  exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_reads.message_id
      and auth.uid() in (c.buyer_id, c.seller_id)
  )
);

drop policy if exists "message_reads insert as recipient" on public.message_reads;
create policy "message_reads insert as recipient"
on public.message_reads for insert
with check (
  auth.uid() = reader_id
  and exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_reads.message_id
      and m.sender_id <> auth.uid()
      and auth.uid() in (c.buyer_id, c.seller_id)
  )
);

create table if not exists public.message_hidden_by_user (
  message_id uuid not null references public.messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (message_id, profile_id)
);

create index if not exists idx_message_hidden_profile on public.message_hidden_by_user(profile_id);

alter table public.message_hidden_by_user enable row level security;

drop policy if exists "message_hidden select own" on public.message_hidden_by_user;
create policy "message_hidden select own"
on public.message_hidden_by_user for select
using (auth.uid() = profile_id);

drop policy if exists "message_hidden insert incoming only" on public.message_hidden_by_user;
create policy "message_hidden insert incoming only"
on public.message_hidden_by_user for insert
with check (
  auth.uid() = profile_id
  and exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_hidden_by_user.message_id
      and m.sender_id <> auth.uid()
      and auth.uid() in (c.buyer_id, c.seller_id)
  )
);
