-- BMW M Serisi altı modeller (lib/categories.ts OTOMOBIL_MARKA_MODELS.bmw ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-bmw-m-serisi-m1', 'Otomobil › BMW › M Serisi › M1'),
  ('tasitlar_otomobil-bmw-m-serisi-m2', 'Otomobil › BMW › M Serisi › M2'),
  ('tasitlar_otomobil-bmw-m-serisi-m235i-xdrive', 'Otomobil › BMW › M Serisi › M235i xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m240i-xdrive', 'Otomobil › BMW › M Serisi › M240i xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m2-competition', 'Otomobil › BMW › M Serisi › M2 Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-m3', 'Otomobil › BMW › M Serisi › M3'),
  ('tasitlar_otomobil-bmw-m-serisi-m3-cabrio', 'Otomobil › BMW › M Serisi › M3 Cabrio'),
  ('tasitlar_otomobil-bmw-m-serisi-m3-competition', 'Otomobil › BMW › M Serisi › M3 Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-m3-coupe', 'Otomobil › BMW › M Serisi › M3 Coupe'),
  ('tasitlar_otomobil-bmw-m-serisi-m3-touring', 'Otomobil › BMW › M Serisi › M3 Touring'),
  ('tasitlar_otomobil-bmw-m-serisi-m4', 'Otomobil › BMW › M Serisi › M4'),
  ('tasitlar_otomobil-bmw-m-serisi-m440i-xdrive', 'Otomobil › BMW › M Serisi › M440i xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m4-competition', 'Otomobil › BMW › M Serisi › M4 Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-m5', 'Otomobil › BMW › M Serisi › M5'),
  ('tasitlar_otomobil-bmw-m-serisi-m5-competition', 'Otomobil › BMW › M Serisi › M5 Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-m5-touring', 'Otomobil › BMW › M Serisi › M5 Touring'),
  ('tasitlar_otomobil-bmw-m-serisi-m5-xdrive', 'Otomobil › BMW › M Serisi › M5 xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m6', 'Otomobil › BMW › M Serisi › M6'),
  ('tasitlar_otomobil-bmw-m-serisi-m6-cabrio', 'Otomobil › BMW › M Serisi › M6 Cabrio'),
  ('tasitlar_otomobil-bmw-m-serisi-m6-gran-coupe', 'Otomobil › BMW › M Serisi › M6 Gran Coupe'),
  ('tasitlar_otomobil-bmw-m-serisi-m760e-xdrive', 'Otomobil › BMW › M Serisi › M760e xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m850i-xdrive', 'Otomobil › BMW › M Serisi › M850i xDrive'),
  ('tasitlar_otomobil-bmw-m-serisi-m8-coupe-xdrive-competition', 'Otomobil › BMW › M Serisi › M8 Coupe xDrive Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-m8-gran-coupe-xdrive-competition', 'Otomobil › BMW › M Serisi › M8 Gran Coupe xDrive Competition'),
  ('tasitlar_otomobil-bmw-m-serisi-z3-m-cabrio', 'Otomobil › BMW › M Serisi › Z3 M Cabrio')
on conflict (slug) do nothing;
