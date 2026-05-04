-- Emlak › İş yeri / Arsa / Toprak / Depo › Satılık|Kiralık (bir kez, canlı DB)
insert into categories (slug, name)
values
  ('gayrimenkul_isyeri-ofis-satilik', 'İş yeri › Satılık'),
  ('gayrimenkul_isyeri-ofis-kiralik', 'İş yeri › Kiralık'),
  ('gayrimenkul_arsa-satilik', 'Arsa › Satılık'),
  ('gayrimenkul_arsa-kiralik', 'Arsa › Kiralık'),
  ('gayrimenkul_toprak-satilik', 'Toprak & tarla › Satılık'),
  ('gayrimenkul_toprak-kiralik', 'Toprak & tarla › Kiralık'),
  ('gayrimenkul_depo-garaj-satilik', 'Depo & garaj › Satılık'),
  ('gayrimenkul_depo-garaj-kiralik', 'Depo & garaj › Kiralık')
on conflict (slug) do nothing;
