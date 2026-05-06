-- Tüm üyelere bildirim çanında gösterilecek site duyurusu (site_settings).
-- Okundu bilgisi tarayıcıda tutulur; her duyuru sürümü için updated_at ile yeniden gösterilir.

alter table public.site_settings
  add column if not exists broadcast_notification_body text not null default '';

alter table public.site_settings
  add column if not exists broadcast_notification_updated_at timestamptz;

comment on column public.site_settings.broadcast_notification_body is
  'Boş değilse giriş yapan kullanıcıların bildirim listesinde üstte gösterilir.';

comment on column public.site_settings.broadcast_notification_updated_at is
  'Duyuru metni son yayın zamanı; boş metinde null.';
