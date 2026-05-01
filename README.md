# Nakits Next.js + Supabase Baslangic

Bu proje, Letgo/Satariz tarzi `nakits.com` MVP'sinin Next.js App Router surumudur.

## Kurulum

```bash
npm install
npm run dev
```

## Ortam Degiskenleri

1. `.env.local.example` dosyasini `.env.local` olarak kopyala.
2. Su degiskenleri gir:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Veritabani Kurulumu

Supabase SQL Editor'da dosyalari su sirayla calistir:

1. `schema.sql`
2. `rls.sql`
3. `storage.sql`

## Production Yayin

Canli ortama gecis icin:

- `DEPLOY.md` dosyasini takip et
- Domain, SSL, env ve policy adimlarini eksiksiz uygula

## Bu Surumde Olanlar

- Ana sayfa ve one cikan ilanlar
- Ilan listesi + filtre
- Ilan detay sayfasi
- Ilan verme formu (MVP davranisi)
- Profil sayfasi
- Supabase baglantisi icin temel istemci ayari (`lib/supabase.ts`)
- Production guvenlik dosyalari:
  - `rls.sql`
  - `storage.sql`
