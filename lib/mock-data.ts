import type { Listing } from "./types";
import { formatPrice } from "./categories";

export { formatPrice };

export const listings: Listing[] = [
  {
    id: "l1",
    title: "iPhone 13 128 GB",
    categoryKey: "elektronik.telefon",
    city: "İstanbul",
    price: 27999,
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    seller: "Ahmet Y.",
    createdAt: "2 saat önce"
  },
  {
    id: "l2",
    title: "Ikea Çalışma Masası",
    categoryKey: "ev-yasam.mobilya",
    city: "Ankara",
    price: 3400,
    image:
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80",
    seller: "Merve K.",
    createdAt: "5 saat önce"
  },
  {
    id: "l3",
    title: "Temiz Honda Civic 2018",
    categoryKey: "tasitlar.otomobil",
    city: "İzmir",
    price: 845000,
    image:
      "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=80",
    seller: "Onur A.",
    createdAt: "1 gün önce"
  },
  {
    id: "l4",
    title: "Erkek Deri Ceket",
    categoryKey: "moda-kisisel.giyim",
    city: "Bursa",
    price: 1850,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    seller: "Seda T.",
    createdAt: "3 gün önce"
  }
];
