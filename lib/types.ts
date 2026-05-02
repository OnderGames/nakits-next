export type Listing = {
  id: string;
  title: string;
  /** Bileşik kategori anahtarı, örn. "elektronik.telefon" */
  categoryKey: string;
  city: string;
  price: number;
  image: string;
  seller: string;
  createdAt: string;
  /** İlanlarım vb.: moderasyon / yayın durumu */
  status?: "pending" | "active" | "sold" | "rejected";
  /** Detay sayfası metni */
  description?: string;
};
