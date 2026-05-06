-- BMW 8 Serisi altı modeller (lib/categories.ts OTOMOBIL_MARKA_MODELS.bmw ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-bmw-8-serisi-840ci', 'Otomobil › BMW › 8 Serisi › 840Ci'),
  ('tasitlar_otomobil-bmw-8-serisi-840d-xdrive-gran-coupe', 'Otomobil › BMW › 8 Serisi › 840d xDrive Gran Coupe'),
  ('tasitlar_otomobil-bmw-8-serisi-840i-xdrive', 'Otomobil › BMW › 8 Serisi › 840i xDrive'),
  ('tasitlar_otomobil-bmw-8-serisi-840i-xdrive-gran-coupe', 'Otomobil › BMW › 8 Serisi › 840i xDrive Gran Coupe'),
  ('tasitlar_otomobil-bmw-8-serisi-850ci', 'Otomobil › BMW › 8 Serisi › 850Ci'),
  ('tasitlar_otomobil-bmw-8-serisi-850csi', 'Otomobil › BMW › 8 Serisi › 850CSi')
on conflict (slug) do nothing;
