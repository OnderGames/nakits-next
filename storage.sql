-- Supabase Storage setup for listing images

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

drop policy if exists "listing images public read" on storage.objects;
create policy "listing images public read"
on storage.objects for select
using (bucket_id = 'listing-images');

drop policy if exists "listing images authenticated upload" on storage.objects;
create policy "listing images authenticated upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "listing images owner update" on storage.objects;
create policy "listing images owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'listing-images'
  and owner = auth.uid()
)
with check (
  bucket_id = 'listing-images'
  and owner = auth.uid()
);

drop policy if exists "listing images owner delete" on storage.objects;
create policy "listing images owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and owner = auth.uid()
);
