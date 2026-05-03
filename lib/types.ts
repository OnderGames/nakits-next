export type Listing = {
  id: string;
  title: string;
  /** Bileşik kategori anahtarı, örn. "elektronik.telefon" */
  categoryKey: string;
  city: string;
  /** İlçe (veritabanı / formlar; eski ilanlarda boş olabilir) */
  district?: string | null;
  price: number;
  /** Kapak görseli (liste kartları) */
  image: string;
  /** Tüm ilan görselleri, sıralı (kapak = [0]); tek fotoğrafta yalnızca bir öğe */
  imageUrls?: string[];
  seller: string;
  createdAt: string;
  /** İlanlarım vb.: moderasyon / yayın durumu */
  status?: "pending" | "active" | "sold" | "rejected";
  /** Detay sayfası metni */
  description?: string;
  /** false ise ilanda telefon gösterilmez; mesaj önerilir */
  showPhoneOnListing?: boolean;
  /** Satıcı profilindeki telefon (ilan ayarına bağlı gösterim) */
  sellerPhone?: string | null;
  /** Mesajlaşma (varsayılan anon istemci ile; RLS satıcıyı korur) */
  sellerId?: string;
  /** Profil URL’si: /kullanici/{sellerPublicCode} */
  sellerPublicCode?: string;
  /** Bitiş zamanı (ISO); süre dolunca sistem ilanı kaldırır */
  expiresAt?: string;
};
