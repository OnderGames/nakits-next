-- Enable Row Level Security and create production policies

alter table profiles enable row level security;
alter table categories enable row level security;
alter table listings enable row level security;
alter table listing_images enable row level security;
alter table favorites enable row level security;
alter table conversations enable row level security;
alter table conversation_reads enable row level security;
alter table messages enable row level security;

-- Profiles
drop policy if exists "profiles public read" on profiles;
create policy "profiles public read"
on profiles for select
using (true);

drop policy if exists "profiles owner update" on profiles;
create policy "profiles owner update"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Categories
drop policy if exists "categories public read" on categories;
create policy "categories public read"
on categories for select
using (true);

-- Listings
drop policy if exists "listings public read active" on listings;
create policy "listings public read active"
on listings for select
using (status = 'active' or auth.uid() = seller_id);

drop policy if exists "listings seller insert" on listings;
create policy "listings seller insert"
on listings for insert
with check (auth.uid() = seller_id);

drop policy if exists "listings seller update" on listings;
create policy "listings seller update"
on listings for update
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

drop policy if exists "listings seller delete" on listings;
create policy "listings seller delete"
on listings for delete
using (auth.uid() = seller_id);

-- Listing Images
drop policy if exists "listing_images public read" on listing_images;
create policy "listing_images public read"
on listing_images for select
using (
  exists (
    select 1
    from listings l
    where l.id = listing_images.listing_id
      and (l.status = 'active' or l.seller_id = auth.uid())
  )
);

drop policy if exists "listing_images seller write" on listing_images;
create policy "listing_images seller write"
on listing_images for all
using (
  exists (
    select 1
    from listings l
    where l.id = listing_images.listing_id
      and l.seller_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from listings l
    where l.id = listing_images.listing_id
      and l.seller_id = auth.uid()
  )
);

-- Favorites
drop policy if exists "favorites owner full access" on favorites;
create policy "favorites owner full access"
on favorites for all
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

-- Conversations
drop policy if exists "conversations participant read" on conversations;
create policy "conversations participant read"
on conversations for select
using (auth.uid() in (buyer_id, seller_id));

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

drop policy if exists "conversations participant delete" on conversations;
create policy "conversations participant delete"
on conversations for delete
using (auth.uid() in (buyer_id, seller_id));

-- Messages
drop policy if exists "messages participant read" on messages;
create policy "messages participant read"
on messages for select
using (
  exists (
    select 1
    from conversations c
    where c.id = messages.conversation_id
      and auth.uid() in (c.buyer_id, c.seller_id)
  )
);

drop policy if exists "messages participant insert" on messages;
create policy "messages participant insert"
on messages for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from conversations c
    where c.id = messages.conversation_id
      and auth.uid() in (c.buyer_id, c.seller_id)
  )
);

-- Conversation read state (okunmamis sayaci)
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

alter table message_reads enable row level security;
alter table message_hidden_by_user enable row level security;

drop policy if exists "message_reads select participants" on message_reads;
create policy "message_reads select participants"
on message_reads for select
using (
  exists (
    select 1
    from messages m
    join conversations c on c.id = m.conversation_id
    where m.id = message_reads.message_id
      and auth.uid() in (c.buyer_id, c.seller_id)
  )
);

drop policy if exists "message_reads insert as recipient" on message_reads;
create policy "message_reads insert as recipient"
on message_reads for insert
with check (
  auth.uid() = reader_id
  and exists (
    select 1
    from messages m
    join conversations c on c.id = m.conversation_id
    where m.id = message_reads.message_id
      and m.sender_id <> auth.uid()
      and auth.uid() in (c.buyer_id, c.seller_id)
  )
);

drop policy if exists "message_hidden select own" on message_hidden_by_user;
create policy "message_hidden select own"
on message_hidden_by_user for select
using (auth.uid() = profile_id);

drop policy if exists "message_hidden insert incoming only" on message_hidden_by_user;
create policy "message_hidden insert incoming only"
on message_hidden_by_user for insert
with check (
  auth.uid() = profile_id
  and exists (
    select 1
    from messages m
    join conversations c on c.id = m.conversation_id
    where m.id = message_hidden_by_user.message_id
      and m.sender_id <> auth.uid()
      and auth.uid() in (c.buyer_id, c.seller_id)
  )
);
