-- İlanlarda telefon iletişimi kapalı (yalnızca mesaj); show_phone_on_listing hep false.
-- Supabase SQL Editor'da bir kez çalıştırın (opsiyonel veri tutarlılığı).

update public.listings
set show_phone_on_listing = false
where coalesce(show_phone_on_listing, true) = true;
