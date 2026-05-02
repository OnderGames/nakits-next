-- Mevcut projede bir kez calistir (SQL Editor).
-- Ilanda telefon gorunurlugu: true = numara goster, false = sadece mesaj

alter table listings
  add column if not exists show_phone_on_listing boolean not null default true;
