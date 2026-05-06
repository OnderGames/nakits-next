-- BMW Z Serisi altı modeller (lib/categories.ts OTOMOBIL_MARKA_MODELS.bmw ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-bmw-z-serisi', 'Otomobil › BMW › Z Serisi'),
  ('tasitlar_otomobil-bmw-z-serisi-z1', 'Otomobil › BMW › Z Serisi › Z1'),
  ('tasitlar_otomobil-bmw-z-serisi-z3', 'Otomobil › BMW › Z Serisi › Z3'),
  ('tasitlar_otomobil-bmw-z-serisi-z4', 'Otomobil › BMW › Z Serisi › Z4')
on conflict (slug) do nothing;
