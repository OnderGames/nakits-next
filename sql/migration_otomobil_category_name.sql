-- Mevcut canlı DB: Vasıta altı kategori görünen adını "Otomobil" yapar (slug aynı kalır).
update categories set name = 'Otomobil' where slug = 'tasitlar_otomobil';
