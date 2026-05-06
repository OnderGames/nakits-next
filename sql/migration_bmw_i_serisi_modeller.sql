-- BMW i Serisi altı modeller (lib/categories.ts OTOMOBIL_MARKA_MODELS.bmw ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-bmw-i-serisi-i3', 'Otomobil › BMW › i Serisi › i3'),
  ('tasitlar_otomobil-bmw-i-serisi-i4', 'Otomobil › BMW › i Serisi › i4'),
  ('tasitlar_otomobil-bmw-i-serisi-i5', 'Otomobil › BMW › i Serisi › i5'),
  ('tasitlar_otomobil-bmw-i-serisi-i7', 'Otomobil › BMW › i Serisi › i7'),
  ('tasitlar_otomobil-bmw-i-serisi-i8', 'Otomobil › BMW › i Serisi › i8')
on conflict (slug) do nothing;
