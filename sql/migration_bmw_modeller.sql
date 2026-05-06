-- BMW altı modeller (lib/categories.ts OTOMOBIL_MARKA_MODELS.bmw ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-bmw-1-serisi', 'Otomobil › BMW › 1 Serisi'),
  ('tasitlar_otomobil-bmw-2-serisi', 'Otomobil › BMW › 2 Serisi'),
  ('tasitlar_otomobil-bmw-3-serisi', 'Otomobil › BMW › 3 Serisi'),
  ('tasitlar_otomobil-bmw-4-serisi', 'Otomobil › BMW › 4 Serisi'),
  ('tasitlar_otomobil-bmw-5-serisi', 'Otomobil › BMW › 5 Serisi'),
  ('tasitlar_otomobil-bmw-6-serisi', 'Otomobil › BMW › 6 Serisi'),
  ('tasitlar_otomobil-bmw-7-serisi', 'Otomobil › BMW › 7 Serisi'),
  ('tasitlar_otomobil-bmw-8-serisi', 'Otomobil › BMW › 8 Serisi'),
  ('tasitlar_otomobil-bmw-i-serisi', 'Otomobil › BMW › i Serisi'),
  ('tasitlar_otomobil-bmw-m-serisi', 'Otomobil › BMW › M Serisi')
on conflict (slug) do nothing;
