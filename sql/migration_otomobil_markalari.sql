-- Otomobil altı marka yaprakları (lib/categories.ts OTOMOBIL_MARKALARI ile uyumlu).
insert into categories (slug, name)
values
  ('tasitlar_otomobil-chery', 'Otomobil › Chery'),
  ('tasitlar_otomobil-citroen', 'Otomobil › Citroën'),
  ('tasitlar_otomobil-fiat', 'Otomobil › Fiat'),
  ('tasitlar_otomobil-ford', 'Otomobil › Ford'),
  ('tasitlar_otomobil-hyundai', 'Otomobil › Hyundai'),
  ('tasitlar_otomobil-opel', 'Otomobil › Opel'),
  ('tasitlar_otomobil-peugeot', 'Otomobil › Peugeot'),
  ('tasitlar_otomobil-renault', 'Otomobil › Renault'),
  ('tasitlar_otomobil-skoda', 'Otomobil › Skoda'),
  ('tasitlar_otomobil-togg', 'Otomobil › TOGG'),
  ('tasitlar_otomobil-toyota', 'Otomobil › Toyota'),
  ('tasitlar_otomobil-tofas', 'Otomobil › Tofaş'),
  ('tasitlar_otomobil-volkswagen', 'Otomobil › Volkswagen')
on conflict (slug) do nothing;
