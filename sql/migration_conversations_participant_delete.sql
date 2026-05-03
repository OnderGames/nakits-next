-- Katılımcıların görüşmeyi tamamen silmesi (messages cascade ile gider).

drop policy if exists "conversations participant delete" on public.conversations;
create policy "conversations participant delete"
on public.conversations for delete
using (auth.uid() in (buyer_id, seller_id));
