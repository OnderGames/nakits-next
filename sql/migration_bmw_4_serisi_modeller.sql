-- BMW 4 Serisi altı modeller (lib/categories.ts OTOMOBIL_MARKA_MODELS.bmw ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-bmw-4-serisi-418d', 'Otomobil › BMW › 4 Serisi › 418d'),
  ('tasitlar_otomobil-bmw-4-serisi-418d-gran-coupe', 'Otomobil › BMW › 4 Serisi › 418d Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-418i', 'Otomobil › BMW › 4 Serisi › 418i'),
  ('tasitlar_otomobil-bmw-4-serisi-418i-gran-coupe', 'Otomobil › BMW › 4 Serisi › 418i Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-420d', 'Otomobil › BMW › 4 Serisi › 420d'),
  ('tasitlar_otomobil-bmw-4-serisi-420d-gran-coupe', 'Otomobil › BMW › 4 Serisi › 420d Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-420d-xdrive', 'Otomobil › BMW › 4 Serisi › 420d xDrive'),
  ('tasitlar_otomobil-bmw-4-serisi-420d-xdrive-gran-coupe', 'Otomobil › BMW › 4 Serisi › 420d xDrive Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-420i', 'Otomobil › BMW › 4 Serisi › 420i'),
  ('tasitlar_otomobil-bmw-4-serisi-420i-gran-coupe', 'Otomobil › BMW › 4 Serisi › 420i Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-428i', 'Otomobil › BMW › 4 Serisi › 428i'),
  ('tasitlar_otomobil-bmw-4-serisi-428i-gran-coupe', 'Otomobil › BMW › 4 Serisi › 428i Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-428i-xdrive', 'Otomobil › BMW › 4 Serisi › 428i xDrive'),
  ('tasitlar_otomobil-bmw-4-serisi-428i-xdrive-gran-coupe', 'Otomobil › BMW › 4 Serisi › 428i xDrive Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-430i', 'Otomobil › BMW › 4 Serisi › 430i'),
  ('tasitlar_otomobil-bmw-4-serisi-430i-cabrio-edition-m-sport', 'Otomobil › BMW › 4 Serisi › 430i Cabrio Edition M Sport'),
  ('tasitlar_otomobil-bmw-4-serisi-430i-coupe-edition-m-sport', 'Otomobil › BMW › 4 Serisi › 430i Coupe Edition M Sport'),
  ('tasitlar_otomobil-bmw-4-serisi-430i-xdrive', 'Otomobil › BMW › 4 Serisi › 430i xDrive'),
  ('tasitlar_otomobil-bmw-4-serisi-430i-xdrive-gran-coupe', 'Otomobil › BMW › 4 Serisi › 430i xDrive Gran Coupe'),
  ('tasitlar_otomobil-bmw-4-serisi-435i', 'Otomobil › BMW › 4 Serisi › 435i'),
  ('tasitlar_otomobil-bmw-4-serisi-440i-xdrive', 'Otomobil › BMW › 4 Serisi › 440i xDrive')
on conflict (slug) do nothing;
