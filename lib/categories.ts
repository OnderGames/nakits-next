export type SubcategoryDef = {
  slug: string;
  name: string;
};

export type CategoryGroupDef = {
  slug: string;
  emoji: string;
  name: string;
  subs: SubcategoryDef[];
};

/**
 * Satariz / büyük ilan siteleriyle uyumlu sıra ve isimlendirme.
 * Bileşik anahtar (grup.alt) değişince DB’de categories.slug satırı gerekir.
 */
export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    slug: "tasitlar",
    emoji: "🚗",
    name: "Vasıta",
    subs: [
      { slug: "otomobil", name: "Araç" },
      { slug: "motosiklet", name: "Motosiklet" },
      { slug: "ticari-araclar", name: "Ticari araç" },
      { slug: "bisiklet", name: "Bisiklet" },
      { slug: "deniz-tasitlari", name: "Deniz aracı (tekne, yat)" }
    ]
  },
  {
    slug: "gayrimenkul",
    emoji: "🏠",
    name: "Emlak",
    subs: [
      { slug: "konut", name: "Konut" },
      { slug: "daire", name: "Daire" },
      { slug: "villa", name: "Villa" },
      { slug: "ev", name: "Müstakil ev" },
      { slug: "isyeri-ofis", name: "İş yeri" },
      { slug: "arsa", name: "Arsa" },
      { slug: "toprak", name: "Toprak & tarla" },
      { slug: "depo-garaj", name: "Depo & garaj" }
    ]
  },
  {
    slug: "elektronik",
    emoji: "📱",
    name: "Elektronik",
    subs: [
      { slug: "telefon", name: "Cep telefonu" },
      { slug: "bilgisayar-tablet", name: "Bilgisayar & tablet" },
      { slug: "televizyon", name: "TV & görüntü" },
      { slug: "beyaz-esya", name: "Beyaz eşya" },
      { slug: "ses-hoparlor", name: "Ses & görüntü" }
    ]
  },
  {
    slug: "ev-yasam",
    emoji: "🧸",
    name: "Ev eşyası & yaşam",
    subs: [
      { slug: "mobilya", name: "Mobilya" },
      { slug: "ev-dekorasyonu", name: "Ev dekorasyon" },
      { slug: "mutfak-esyalari", name: "Mutfak" },
      { slug: "bahce-balkon", name: "Bahçe & balkon" }
    ]
  },
  {
    slug: "moda-kisisel",
    emoji: "👕",
    name: "Giyim & kişisel",
    subs: [
      { slug: "giyim", name: "Giyim" },
      { slug: "ayakkabi", name: "Ayakkabı" },
      { slug: "canta-aksesuar", name: "Çanta & aksesuar" },
      { slug: "saat-taki", name: "Saat & takı" }
    ]
  },
  {
    slug: "hobi-eglence",
    emoji: "🎮",
    name: "Hobi & eğlence",
    subs: [
      { slug: "oyun-konsolu-oyunlar", name: "Oyun & konsol" },
      { slug: "spor-malzemeleri", name: "Spor" },
      { slug: "muzik-aletleri", name: "Müzik" },
      { slug: "koleksiyon-urunleri", name: "Koleksiyon" }
    ]
  },
  {
    slug: "hayvanlar",
    emoji: "🐾",
    name: "Hayvanlar",
    subs: [
      { slug: "evcil-hayvanlar", name: "Evcil hayvan" },
      { slug: "hayvan-aksesuarlari", name: "Aksesuar" },
      { slug: "mama-bakim-urunleri", name: "Mama & bakım" }
    ]
  },
  {
    slug: "is-sanayi",
    emoji: "🛠️",
    name: "İş makineleri & sanayi",
    subs: [
      { slug: "tarim-makineleri", name: "Tarım makinesi" },
      { slug: "insaat-ekipmanlari", name: "İnşaat" },
      { slug: "el-aletleri", name: "El aleti" },
      { slug: "ofis-malzemeleri", name: "Ofis" }
    ]
  }
];

export type ParsedCategorySlug = {
  group: CategoryGroupDef;
  sub: SubcategoryDef;
};

/** Uygulama içi bileşik anahtar: "elektronik.telefon" */
export function compositeCategoryKey(groupSlug: string, subSlug: string): string {
  return `${groupSlug}.${subSlug}`;
}

/** Grup slug'ında tire olabilir; ayırıcı olarak grup.slug + "." ile en uzun eşleşmeyi kullan. */
export function parseCategoryKey(key: string): ParsedCategorySlug | null {
  const ordered = [...CATEGORY_GROUPS].sort(
    (a, b) => b.slug.length - a.slug.length
  );
  for (const group of ordered) {
    const prefix = `${group.slug}.`;
    if (!key.startsWith(prefix)) continue;
    const subSlug = key.slice(prefix.length);
    const sub = group.subs.find((s) => s.slug === subSlug);
    if (sub) return { group, sub };
  }
  return null;
}

/**
 * Serbest kelime aramasında ilanın seçili kategori etiketiyle de eşler
 * (örn. başlıkta "villa" yoksa bile q "villa" → Villa alt kategorisi).
 */
export function categoryKeyMatchesListingSearch(
  categoryKey: string,
  qNormalized: string
): boolean {
  const q = qNormalized.trim().toLowerCase();
  if (!q) return false;
  const parsed = parseCategoryKey(categoryKey);
  if (!parsed) {
    return categoryKey.toLowerCase().includes(q);
  }
  const { group, sub } = parsed;
  if (group.name.toLowerCase().includes(q)) return true;
  if (sub.name.toLowerCase().includes(q)) return true;
  if (sub.slug.includes(q)) return true;
  const subAsWords = sub.slug.replace(/-/g, " ");
  if (subAsWords.includes(q)) return true;
  return false;
}

/** Kart / detayda gösterilecek satır örn: "📱 Elektronik › Telefon" */
export function formatCategoryDisplay(key: string): string {
  const parsed = parseCategoryKey(key);
  if (!parsed) return key;
  return `${parsed.group.emoji} ${parsed.group.name} › ${parsed.sub.name}`;
}

/** Kartta kısa: şehir (ve isteğe bağlı ilçe) + kategori özeti */
export function formatListingCategoryLineCity(
  city: string,
  categoryKey: string,
  district?: string | null
): string {
  const place =
    district && district.trim()
      ? `${city} · ${district.trim()}`
      : city;
  const parsed = parseCategoryKey(categoryKey);
  if (!parsed) return `${place} · ${categoryKey}`;
  return `${place} · ${parsed.group.name} › ${parsed.sub.name}`;
}

export function sqlCategorySlugFromKey(categoryKey: string): string {
  const parsed = parseCategoryKey(categoryKey);
  if (!parsed) return categoryKey.replace(/\./g, "_");
  return `${parsed.group.slug}_${parsed.sub.slug}`;
}

export function sqlCategorySlugToKey(sqlSlug: string): string | null {
  const ordered = [...CATEGORY_GROUPS].sort(
    (a, b) => b.slug.length - a.slug.length
  );
  for (const group of ordered) {
    const prefix = `${group.slug}_`;
    if (!sqlSlug.startsWith(prefix)) continue;
    const subSlug = sqlSlug.slice(prefix.length);
    const sub = group.subs.find((s) => s.slug === subSlug);
    if (sub) return compositeCategoryKey(group.slug, sub.slug);
  }
  return null;
}

/** Türkçe TL biçimi (tüm ilan ekranları) */
export function formatPrice(value: number) {
  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)} TL`;
}

/**
 * Form alanı: sayıyı binlik nokta (ve gerekirse ondalık virgül) ile gösterir.
 * Örn. 1500 → "1.500", 750000 → "750.000", 99,5 → "99,5"
 */
export function formatPriceInputDisplay(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Fiyat alanı metnini sayıya çevirir. Binlik ayırıcı nokta, ondalık virgül.
 * "1.500" / "750.000" / "1.500,50" / "1500" desteklenir.
 */
export function parsePriceInput(raw: string): number {
  const s = raw.trim().replace(/\s/g, "");
  if (!s) return Number.NaN;
  if (s.includes(",")) {
    return parseFloat(s.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d+\.\d{1,2}$/.test(s)) {
    return parseFloat(s);
  }
  return parseFloat(s.replace(/\./g, ""));
}
