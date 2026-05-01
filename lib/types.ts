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
};
