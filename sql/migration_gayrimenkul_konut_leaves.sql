-- Emlak › Konut › Satılık|Kiralık › konut tipi yaprağı (bir kez, canlı DB)
insert into categories (slug, name)
values
  ('gayrimenkul_konut-satilik-daire', 'Konut › Satılık › Daire'),
  ('gayrimenkul_konut-satilik-rezidans', 'Konut › Satılık › Rezidans'),
  ('gayrimenkul_konut-satilik-mustakil-ev', 'Konut › Satılık › Müstakil Ev'),
  ('gayrimenkul_konut-satilik-villa', 'Konut › Satılık › Villa'),
  ('gayrimenkul_konut-satilik-ciftlik-evi', 'Konut › Satılık › Çiftlik Evi'),
  ('gayrimenkul_konut-satilik-kosk-konak', 'Konut › Satılık › Köşk & Konak'),
  ('gayrimenkul_konut-satilik-yali', 'Konut › Satılık › Yalı'),
  ('gayrimenkul_konut-satilik-yazlik', 'Konut › Satılık › Yazlık'),
  ('gayrimenkul_konut-kiralik-daire', 'Konut › Kiralık › Daire'),
  ('gayrimenkul_konut-kiralik-rezidans', 'Konut › Kiralık › Rezidans'),
  ('gayrimenkul_konut-kiralik-mustakil-ev', 'Konut › Kiralık › Müstakil Ev'),
  ('gayrimenkul_konut-kiralik-villa', 'Konut › Kiralık › Villa'),
  ('gayrimenkul_konut-kiralik-ciftlik-evi', 'Konut › Kiralık › Çiftlik Evi'),
  ('gayrimenkul_konut-kiralik-kosk-konak', 'Konut › Kiralık › Köşk & Konak'),
  ('gayrimenkul_konut-kiralik-yali', 'Konut › Kiralık › Yalı'),
  ('gayrimenkul_konut-kiralik-yazlik', 'Konut › Kiralık › Yazlık')
on conflict (slug) do nothing;
