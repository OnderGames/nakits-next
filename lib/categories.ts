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

export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    slug: "tasitlar",
    emoji: "🚗",
    name: "Taşıtlar",
    subs: [
      { slug: "otomobil", name: "Otomobil" },
      { slug: "motosiklet", name: "Motosiklet" },
      { slug: "bisiklet", name: "Bisiklet" },
      {
        slug: "ticari-araclar",
        name: "Ticari araçlar (kamyon, minibüs, otobüs)"
      },
      {
        slug: "deniz-tasitlari",
        name: "Deniz taşıtları (tekne, yat)"
      }
    ]
  },
  {
    slug: "gayrimenkul",
    emoji: "🏠",
    name: "Gayrimenkul",
    subs: [
      { slug: "ev", name: "Ev" },
      { slug: "arsa", name: "Arsa" },
      { slug: "daire", name: "Daire" },
      { slug: "villa", name: "Villa" },
      { slug: "isyeri-ofis", name: "İş yeri / Ofis" },
      { slug: "depo-garaj", name: "Depo / Garaj" }
    ]
  },
  {
    slug: "elektronik",
    emoji: "📱",
    name: "Elektronik",
    subs: [
      { slug: "telefon", name: "Telefon" },
      { slug: "bilgisayar-tablet", name: "Bilgisayar / Tablet" },
      { slug: "televizyon", name: "Televizyon" },
      { slug: "beyaz-esya", name: "Beyaz eşya" },
      { slug: "ses-hoparlor", name: "Ses sistemleri / Hoparlör" }
    ]
  },
  {
    slug: "moda-kisisel",
    emoji: "👕",
    name: "Moda & Kişisel",
    subs: [
      { slug: "giyim", name: "Giyim" },
      { slug: "ayakkabi", name: "Ayakkabı" },
      { slug: "canta-aksesuar", name: "Çanta & Aksesuar" },
      { slug: "saat-taki", name: "Saat & Takı" }
    ]
  },
  {
    slug: "ev-yasam",
    emoji: "🧸",
    name: "Ev & Yaşam",
    subs: [
      { slug: "mobilya", name: "Mobilya" },
      { slug: "ev-dekorasyonu", name: "Ev dekorasyonu" },
      { slug: "mutfak-esyalari", name: "Mutfak eşyaları" },
      {
        slug: "bahce-balkon",
        name: "Bahçe & Balkon ürünleri"
      }
    ]
  },
  {
    slug: "hobi-eglence",
    emoji: "🎮",
    name: "Hobi & Eğlence",
    subs: [
      {
        slug: "oyun-konsolu-oyunlar",
        name: "Oyun konsolu & oyunlar"
      },
      { slug: "spor-malzemeleri", name: "Spor malzemeleri" },
      { slug: "muzik-aletleri", name: "Müzik aletleri" },
      { slug: "koleksiyon-urunleri", name: "Koleksiyon ürünleri" }
    ]
  },
  {
    slug: "hayvanlar",
    emoji: "🐾",
    name: "Hayvanlar",
    subs: [
      { slug: "evcil-hayvanlar", name: "Evcil hayvanlar" },
      { slug: "hayvan-aksesuarlari", name: "Hayvan aksesuarları" },
      { slug: "mama-bakim-urunleri", name: "Mama & bakım ürünleri" }
    ]
  },
  {
    slug: "is-sanayi",
    emoji: "🛠️",
    name: "İş & Sanayi",
    subs: [
      { slug: "tarim-makineleri", name: "Tarım makineleri" },
      { slug: "insaat-ekipmanlari", name: "İnşaat ekipmanları" },
      { slug: "el-aletleri", name: "El aletleri" },
      { slug: "ofis-malzemeleri", name: "Ofis malzemeleri" }
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

export function parseCategoryKey(key: string): ParsedCategorySlug | null {
  const dot = key.indexOf(".");
  if (dot < 1) return null;
  const groupSlug = key.slice(0, dot);
  const subSlug = key.slice(dot + 1);
  const group = CATEGORY_GROUPS.find((g) => g.slug === groupSlug);
  if (!group) return null;
  const sub = group.subs.find((s) => s.slug === subSlug);
  if (!sub) return null;
  return { group, sub };
}

/** Kart / detayda gösterilecek satır örn: "📱 Elektronik › Telefon" */
export function formatCategoryDisplay(key: string): string {
  const parsed = parseCategoryKey(key);
  if (!parsed) return key;
  return `${parsed.group.emoji} ${parsed.group.name} › ${parsed.sub.name}`;
}

/** Kartta kısa: "İstanbul › Taşıtlar › Otomobil" stili şehir + kategori özeti */
export function formatListingCategoryLineCity(city: string, categoryKey: string): string {
  const parsed = parseCategoryKey(categoryKey);
  if (!parsed) return `${city} · ${categoryKey}`;
  return `${city} · ${parsed.group.name} › ${parsed.sub.name}`;
}

export function sqlCategorySlugFromKey(categoryKey: string): string {
  const dot = categoryKey.indexOf(".");
  if (dot < 1) return categoryKey;
  return `${categoryKey.slice(0, dot)}_${categoryKey.slice(dot + 1)}`;
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
