-- İlanlarda ilçe alanı (eski projelerde sütun yoksa ilan listesi sorgusu hata verebilir)
alter table public.listings
  add column if not exists district text;

comment on column public.listings.district is 'İlçe adı (şehir seçimine uygun; isteğe bağlı)';
