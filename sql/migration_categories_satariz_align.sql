-- Satariz-benzeri kategori etiketleri + yeni emlak altları (Konut, Toprak).
-- Supabase SQL Editor'da bir kez çalıştırın. Mevcut ilan slug'ları korunur.

insert into categories (slug, name)
values
  ('gayrimenkul_konut', 'Konut'),
  ('gayrimenkul_toprak', 'Toprak & tarla')
on conflict (slug) do nothing;

update categories set name = 'Otomobil' where slug = 'tasitlar_otomobil';
update categories set name = 'Ticari araç' where slug = 'tasitlar_ticari-araclar';
update categories set name = 'Deniz aracı (tekne, yat)' where slug = 'tasitlar_deniz-tasitlari';
update categories set name = 'Müstakil ev' where slug = 'gayrimenkul_ev';
update categories set name = 'İş yeri' where slug = 'gayrimenkul_isyeri-ofis';
update categories set name = 'Depo & garaj' where slug = 'gayrimenkul_depo-garaj';
update categories set name = 'Cep telefonu' where slug = 'elektronik_telefon';
update categories set name = 'Bilgisayar & tablet' where slug = 'elektronik_bilgisayar-tablet';
update categories set name = 'TV & görüntü' where slug = 'elektronik_televizyon';
update categories set name = 'Ses & görüntü' where slug = 'elektronik_ses-hoparlor';
update categories set name = 'Ev dekorasyon' where slug = 'ev-yasam_ev-dekorasyonu';
update categories set name = 'Mutfak' where slug = 'ev-yasam_mutfak-esyalari';
update categories set name = 'Bahçe & balkon' where slug = 'ev-yasam_bahce-balkon';
update categories set name = 'Oyun & konsol' where slug = 'hobi-eglence_oyun-konsolu-oyunlar';
update categories set name = 'Spor' where slug = 'hobi-eglence_spor-malzemeleri';
update categories set name = 'Müzik' where slug = 'hobi-eglence_muzik-aletleri';
update categories set name = 'Koleksiyon' where slug = 'hobi-eglence_koleksiyon-urunleri';
update categories set name = 'Evcil hayvan' where slug = 'hayvanlar_evcil-hayvanlar';
update categories set name = 'Aksesuar' where slug = 'hayvanlar_hayvan-aksesuarlari';
update categories set name = 'Mama & bakım' where slug = 'hayvanlar_mama-bakim-urunleri';
update categories set name = 'Tarım makinesi' where slug = 'is-sanayi_tarim-makineleri';
update categories set name = 'İnşaat' where slug = 'is-sanayi_insaat-ekipmanlari';
update categories set name = 'El aleti' where slug = 'is-sanayi_el-aletleri';
update categories set name = 'Ofis' where slug = 'is-sanayi_ofis-malzemeleri';
