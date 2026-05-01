# Nakits Production Deploy Rehberi

Bu dosya, projeyi gercek domain (`nakits.com`) uzerine yayinlamak icin adim adim rehberdir.

## 1) Kod Hazirlik

1. Proje klasorune gir:
   - `cd nakits-next`
2. Bagimliliklari kur:
   - `npm install`
3. Lokal test:
   - `npm run dev`

## 2) Supabase Production Kurulum

1. Supabase'de yeni production proje ac.
2. SQL Editor'da su dosyalari sirayla calistir:
   - `schema.sql`
   - `rls.sql`
   - `storage.sql`
3. Auth ayarlari:
   - Site URL: `https://nakits.com`
   - Additional redirect URLs:
     - `https://www.nakits.com`
     - `https://nakits.com/auth/callback` (ileride auth callback eklenecekse)

## 3) Environment Variables

Vercel (veya secili platform) uzerinde su degiskenleri tanimla:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Not: `service_role` key istemciye kesinlikle verilmez.

## 4) Vercel Deploy

1. Projeyi GitHub'a push et.
2. Vercel'de `New Project` ile repoyu bagla.
3. Framework olarak Next.js otomatik secilir.
4. Environment Variables gir.
5. Deploy et.

## 5) Domain Baglama

1. Vercel proje ayarlarindan `nakits.com` ve `www.nakits.com` domainlerini ekle.
2. Domain saglayicinda gerekli DNS kayitlarini gir:
   - `A` veya `ALIAS/ANAME` root domain icin
   - `CNAME` `www` icin
3. SSL sertifikasi aktif oldugunda `https` ile acilisi dogrula.

## 6) Go-Live Kontrol Listesi

- Ana sayfa aciliyor
- Ilan listesi ve detay aciliyor
- Uye kayit/giris calisiyor (auth eklendiginde)
- Ilan olusturma izinleri dogru
- RLS policy nedeniyle baska kullanicinin verisi yazilamiyor
- Storage yukleme ve goruntuleme sorunsuz
- Supabase loglarinda kritik hata yok

## 7) Ilk Hafta Operasyon

- Gunluk error log kontrolu
- Spam ilanlar icin moderasyon
- Basit yedekleme/planning
- Uptime monitoring ekleme (opsiyonel: UptimeRobot/BetterStack)
