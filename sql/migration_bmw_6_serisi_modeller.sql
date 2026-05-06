-- BMW 6 Serisi altı modeller (lib/categories.ts OTOMOBIL_MARKA_MODELS.bmw ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-bmw-6-serisi-620d-xdrive', 'Otomobil › BMW › 6 Serisi › 620d xDrive'),
  ('tasitlar_otomobil-bmw-6-serisi-630ci', 'Otomobil › BMW › 6 Serisi › 630Ci'),
  ('tasitlar_otomobil-bmw-6-serisi-630i', 'Otomobil › BMW › 6 Serisi › 630i'),
  ('tasitlar_otomobil-bmw-6-serisi-630i-gran-turismo', 'Otomobil › BMW › 6 Serisi › 630i Gran Turismo'),
  ('tasitlar_otomobil-bmw-6-serisi-635d', 'Otomobil › BMW › 6 Serisi › 635d'),
  ('tasitlar_otomobil-bmw-6-serisi-640d', 'Otomobil › BMW › 6 Serisi › 640d'),
  ('tasitlar_otomobil-bmw-6-serisi-640d-xdrive', 'Otomobil › BMW › 6 Serisi › 640d xDrive'),
  ('tasitlar_otomobil-bmw-6-serisi-640i', 'Otomobil › BMW › 6 Serisi › 640i'),
  ('tasitlar_otomobil-bmw-6-serisi-645ci', 'Otomobil › BMW › 6 Serisi › 645Ci'),
  ('tasitlar_otomobil-bmw-6-serisi-650ci', 'Otomobil › BMW › 6 Serisi › 650Ci'),
  ('tasitlar_otomobil-bmw-6-serisi-650i-xdrive', 'Otomobil › BMW › 6 Serisi › 650i xDrive')
on conflict (slug) do nothing;
