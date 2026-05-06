-- BMW 1 Serisi altı modeller (lib/categories.ts OTOMOBIL_MARKA_MODELS.bmw ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-bmw-1-serisi-116d', 'Otomobil › BMW › 1 Serisi › 116d'),
  ('tasitlar_otomobil-bmw-1-serisi-116d-ed', 'Otomobil › BMW › 1 Serisi › 116d ED'),
  ('tasitlar_otomobil-bmw-1-serisi-116i', 'Otomobil › BMW › 1 Serisi › 116i'),
  ('tasitlar_otomobil-bmw-1-serisi-118d', 'Otomobil › BMW › 1 Serisi › 118d'),
  ('tasitlar_otomobil-bmw-1-serisi-118i', 'Otomobil › BMW › 1 Serisi › 118i'),
  ('tasitlar_otomobil-bmw-1-serisi-120', 'Otomobil › BMW › 1 Serisi › 120'),
  ('tasitlar_otomobil-bmw-1-serisi-120d', 'Otomobil › BMW › 1 Serisi › 120d'),
  ('tasitlar_otomobil-bmw-1-serisi-120i', 'Otomobil › BMW › 1 Serisi › 120i'),
  ('tasitlar_otomobil-bmw-1-serisi-128ia', 'Otomobil › BMW › 1 Serisi › 128ia'),
  ('tasitlar_otomobil-bmw-1-serisi-128ti', 'Otomobil › BMW › 1 Serisi › 128ti')
on conflict (slug) do nothing;
