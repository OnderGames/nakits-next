-- Anasayfa teması seçeneklerini genişletir (aurora, sunrise, minimal, slate).
-- Daha önce migration_site_settings.sql çalıştırdıysanız bunu Supabase SQL Editor’da bir kez çalıştırın.

alter table public.site_settings
  drop constraint if exists site_settings_homepage_theme_check;

alter table public.site_settings
  add constraint site_settings_homepage_theme_check
  check (
    homepage_theme in (
      'classic',
      'v2',
      'aurora',
      'sunrise',
      'minimal',
      'slate'
    )
  );
