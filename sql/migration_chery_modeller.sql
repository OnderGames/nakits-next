-- Chery altı modeller (lib/categories.ts OTOMOBIL_MARKA_MODELS.chery ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-chery-alia', 'Otomobil › Chery › Alia'),
  ('tasitlar_otomobil-chery-chance', 'Otomobil › Chery › Chance'),
  ('tasitlar_otomobil-chery-kimo', 'Otomobil › Chery › Kimo'),
  ('tasitlar_otomobil-chery-niche', 'Otomobil › Chery › Niche')
on conflict (slug) do nothing;
