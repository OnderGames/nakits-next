-- BMW 2 Serisi altı modeller (lib/categories.ts OTOMOBIL_MARKA_MODELS.bmw ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-bmw-2-serisi-216d-active-tourer', 'Otomobil › BMW › 2 Serisi › 216d Active Tourer'),
  ('tasitlar_otomobil-bmw-2-serisi-216d-gran-coupe', 'Otomobil › BMW › 2 Serisi › 216d Gran Coupe'),
  ('tasitlar_otomobil-bmw-2-serisi-216d-gran-tourer', 'Otomobil › BMW › 2 Serisi › 216d Gran Tourer'),
  ('tasitlar_otomobil-bmw-2-serisi-218i', 'Otomobil › BMW › 2 Serisi › 218i'),
  ('tasitlar_otomobil-bmw-2-serisi-218i-active-tourer', 'Otomobil › BMW › 2 Serisi › 218i Active Tourer'),
  ('tasitlar_otomobil-bmw-2-serisi-218i-gran-coupe', 'Otomobil › BMW › 2 Serisi › 218i Gran Coupe'),
  ('tasitlar_otomobil-bmw-2-serisi-220d', 'Otomobil › BMW › 2 Serisi › 220d'),
  ('tasitlar_otomobil-bmw-2-serisi-220-gran-coupe', 'Otomobil › BMW › 2 Serisi › 220 Gran Coupe'),
  ('tasitlar_otomobil-bmw-2-serisi-220i-active-tourer', 'Otomobil › BMW › 2 Serisi › 220i Active Tourer'),
  ('tasitlar_otomobil-bmw-2-serisi-230e-xdrive-active-tourer', 'Otomobil › BMW › 2 Serisi › 230e xDrive Active Tourer')
on conflict (slug) do nothing;
