-- Opsiyonel: Bazı projelerde storage.foldername yerine split_part kullanımı yükleme izniyle uyumludur.
-- Yükleme hatası "new row violates row-level security policy" veya storage 403 ise bir kez deneyin.

drop policy if exists "listing images authenticated upload" on storage.objects;

create policy "listing images authenticated upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and split_part(name, '/', 1) = auth.uid()::text
);
