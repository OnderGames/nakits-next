-- Okunma kaydı + toplam okunmamış sayısı (bir kez çalıştırın)

create table if not exists conversation_reads (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create index if not exists idx_conversation_reads_profile on conversation_reads(profile_id);

alter table conversation_reads enable row level security;

drop policy if exists "conversation_reads select own" on conversation_reads;
create policy "conversation_reads select own"
on conversation_reads for select
using (auth.uid() = profile_id);

drop policy if exists "conversation_reads insert own" on conversation_reads;
create policy "conversation_reads insert own"
on conversation_reads for insert
with check (auth.uid() = profile_id);

drop policy if exists "conversation_reads update own" on conversation_reads;
create policy "conversation_reads update own"
on conversation_reads for update
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

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
