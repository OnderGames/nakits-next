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
3. Auth ayarlari (Authentication → URL Configuration):
   - **Site URL**: uygulamanin canonical adresi (tercihen `https://www.nakits.com` veya `https://nakits.com` — tek birini sec ve tum yerlerle uyumlu tut).
   - **Redirect URLs** (her satira bir pattern):
     - `https://www.nakits.com/**`
     - `https://nakits.com/**`
     - Gelistirme icin: `http://localhost:3000/**`
   - Site URL hala `http://localhost:3000` ise e-posta onay linkleri localhost'a gider; mutlaka production URL'ye cek.
4. E-posta sablonlari (Türkçe metin ornekleri):
   - Proje kökündeki `SUPABASE_EMAIL_TR.txt` dosyasina bak
   - Authentication → Email Templates ekranina yapistir

## 3) Environment Variables

Vercel (veya secili platform) uzerinde su degiskenleri tanimla:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` — canli site kok URL'si, ornek: `https://www.nakits.com` (kayit/onay linklerinin dogru domaine gitmesi icin zorunlu)

Not: `service_role` key istemciye kesinlikle verilmez.

Moderasyon paneli (`/admin/moderasyon`) icin ek ortam degiskenleri:

- `ADMIN_EMAILS` — virgulle ayrilmis yonetici giris e-postalari (kucuk harf karsilastirilir).
- `SUPABASE_SERVICE_ROLE_KEY` — yalnizca sunucu tarafinda (API route); Supabase Project Settings → API → service_role. Bu anahtar **asla** `NEXT_PUBLIC_` ile baslamaz ve frontend koduna eklenmez.

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
