-- Mesaj kutusu sıralaması + güvenli konuşma oluşturma (bir kez çalıştırın)

alter table conversations
  add column if not exists last_message_at timestamptz;

create index if not exists idx_conversations_last_message_at
  on conversations (last_message_at desc nulls last);

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

update conversations c
set last_message_at = (
  select max(m.created_at)
  from messages m
  where m.conversation_id = c.id
)
where exists (
  select 1 from messages m where m.conversation_id = c.id
);

drop policy if exists "conversations buyer insert" on conversations;
create policy "conversations buyer insert"
on conversations for insert
with check (
  auth.uid() = buyer_id
  and buyer_id <> seller_id
  and exists (
    select 1
    from listings l
    where l.id = listing_id
      and l.seller_id = seller_id
  )
);
