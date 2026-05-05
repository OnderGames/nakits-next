export type SubcategoryDef = {
  slug: string;
  name: string;
  /** Konut: Satılık/Kiralık + yapı tipi; diğer emlak dalları: yalnız Satılık/Kiralık; Otomobil: marka seçimi */
  drilldown?: "konut" | "emlak-listing-kind" | "otomobil-marka";
};

/** Otomobil altı marka (slug URL/güvenli; name ekranda birebir) */
export const OTOMOBIL_MARKALARI = [
  { slug: "chery", name: "Chery" },
  { slug: "citroen", name: "Citroën" },
  { slug: "fiat", name: "Fiat" },
  { slug: "ford", name: "Ford" },
  { slug: "hyundai", name: "Hyundai" },
  { slug: "opel", name: "Opel" },
  { slug: "peugeot", name: "Peugeot" },
  { slug: "renault", name: "Renault" },
  { slug: "skoda", name: "Skoda" },
  { slug: "togg", name: "TOGG" },
  { slug: "toyota", name: "Toyota" },
  { slug: "tofas", name: "Tofaş" },
  { slug: "volkswagen", name: "Volkswagen" }
] as const;

/** İlan formu: marka seçilmeden `tasitlar.otomobil` ara anahtarı */
export const TASITLAR_OTOMOBIL_INTERMEDIATE_KEY = "tasitlar.otomobil";

export function tryParseOtomobilMarkaLeafSubSlug(subSlug: string): {
  brandSlug: string;
  brandName: string;
} | null {
  const prefix = "otomobil-";
  if (!subSlug.startsWith(prefix)) return null;
  const brandSlug = subSlug.slice(prefix.length);
  const m = OTOMOBIL_MARKALARI.find((x) => x.slug === brandSlug);
  if (!m) return null;
  return { brandSlug: m.slug, brandName: m.name };
}

export function isIntermediateTasitlarOtomobilListingKey(key: string): boolean {
  return key.trim() === TASITLAR_OTOMOBIL_INTERMEDIATE_KEY;
}

export type CategoryGroupDef = {
  slug: string;
  emoji: string;
  name: string;
  subs: SubcategoryDef[];
};

/** Konut ilanı: işlem tipi (Emlak › Konut › …) */
export const KONUT_LISTING_KINDS = [
  { slug: "satilik", name: "Satılık" },
  { slug: "kiralik", name: "Kiralık" }
] as const;

/** Konut yapı / tip (sahibinden benzeri liste) */
export const KONUT_PROPERTY_TYPES = [
  { slug: "daire", name: "Daire" },
  { slug: "rezidans", name: "Rezidans" },
  { slug: "mustakil-ev", name: "Müstakil Ev" },
  { slug: "villa", name: "Villa" },
  { slug: "ciftlik-evi", name: "Çiftlik Evi" },
  { slug: "kosk-konak", name: "Köşk & Konak" },
  { slug: "yali", name: "Yalı" },
  { slug: "yazlik", name: "Yazlık" }
] as const;

const KONUT_DRILL_SUB_PREFIX = "konut-";

/** Eski düz Emlak anahtarları (gayrimenkul.daire vb.) — DB’de kayıtlı ilanlar için */
const GAYRIMENKUL_LEGACY_LEAF_SUBS: SubcategoryDef[] = [
  { slug: "daire", name: "Daire" },
  { slug: "villa", name: "Villa" },
  { slug: "ev", name: "Müstakil ev" }
];

/** `konut-satilik-daire` / `konut-satilik-mustakil-ev` segmenti; txn sabit iki değer, prop'ta tire olabilir */
export function tryParseKonutLeafSubSlug(subSlug: string): {
  txn: (typeof KONUT_LISTING_KINDS)[number]["slug"];
  prop: (typeof KONUT_PROPERTY_TYPES)[number]["slug"];
} | null {
  if (!subSlug.startsWith(KONUT_DRILL_SUB_PREFIX)) return null;
  const rest = subSlug.slice(KONUT_DRILL_SUB_PREFIX.length);
  for (const k of KONUT_LISTING_KINDS) {
    const p = `${k.slug}-`;
    if (!rest.startsWith(p)) continue;
    const prop = rest.slice(p.length);
    if (
      KONUT_PROPERTY_TYPES.some((x) => x.slug === prop as (typeof KONUT_PROPERTY_TYPES)[number]["slug"])
    ) {
      return {
        txn: k.slug,
        prop: prop as (typeof KONUT_PROPERTY_TYPES)[number]["slug"]
      };
    }
  }
  return null;
}

export function konutLeafCategorySubSlug(
  txn: (typeof KONUT_LISTING_KINDS)[number]["slug"],
  prop: (typeof KONUT_PROPERTY_TYPES)[number]["slug"]
): string {
  return `${KONUT_DRILL_SUB_PREFIX}${txn}-${prop}`;
}

export function labelKonutLeafCategory(txn: string, prop: string): string {
  const k = KONUT_LISTING_KINDS.find((x) => x.slug === txn);
  const p = KONUT_PROPERTY_TYPES.find((x) => x.slug === prop);
  const txl = k?.name ?? txn;
  const pl = p?.name ?? prop;
  return `Konut › ${txl} › ${pl}`;
}

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
      { slug: "otomobil", name: "Otomobil", drilldown: "otomobil-marka" },
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
      { slug: "konut", name: "Konut", drilldown: "konut" },
      { slug: "isyeri-ofis", name: "İş yeri", drilldown: "emlak-listing-kind" },
      { slug: "arsa", name: "Arsa", drilldown: "emlak-listing-kind" },
      {
        slug: "toprak",
        name: "Toprak & tarla",
        drilldown: "emlak-listing-kind"
      },
      {
        slug: "depo-garaj",
        name: "Depo & garaj",
        drilldown: "emlak-listing-kind"
      }
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

/**
 * `isyeri-ofis-satilik`, `depo-garaj-kiralik` vb. (Konut dallarıyla çakışmaz).
 */
export function tryParseGayrimenkulSatKirLeafSubSlug(subSlug: string): {
  baseSlug: string;
  baseLabel: string;
  txn: (typeof KONUT_LISTING_KINDS)[number]["slug"];
} | null {
  if (tryParseKonutLeafSubSlug(subSlug)) return null;
  if (subSlug.startsWith(KONUT_DRILL_SUB_PREFIX)) return null;

  const gm = CATEGORY_GROUPS.find((g) => g.slug === "gayrimenkul");
  const mids =
    gm?.subs.filter((s) => s.drilldown === "emlak-listing-kind") ?? [];
  const bases = mids.map((m) => m.slug).sort((a, b) => b.length - a.length);

  for (const k of KONUT_LISTING_KINDS) {
    const suf = `-${k.slug}`;
    if (!subSlug.endsWith(suf)) continue;
    const base = subSlug.slice(0, -suf.length);
    if (!bases.includes(base)) continue;
    const def = mids.find((m) => m.slug === base);
    if (!def) continue;
    return { baseSlug: base, baseLabel: def.name, txn: k.slug };
  }
  return null;
}

export function labelGayrimenkulSatKirLeaf(baseLabel: string, txn: string): string {
  const k = KONUT_LISTING_KINDS.find((x) => x.slug === txn);
  return `${baseLabel} › ${k?.name ?? txn}`;
}

/** Yeni ilan: ara adım (Konut ara hattı için veritabanı slug’ına gitmemeli) */
export const GAYRIMENKUL_KONUT_INTERMEDIATE_KEY = "gayrimenkul.konut";

/** `gayrimenkul.konut` veya düz `gayrimenkul.isyeri-ofis` gibi ara anahtar — yeni kayıtta yasak */
export function isIntermediateGayrimenkulListingKey(key: string): boolean {
  if (key === GAYRIMENKUL_KONUT_INTERMEDIATE_KEY) return true;
  const gm = CATEGORY_GROUPS.find((g) => g.slug === "gayrimenkul");
  if (!gm?.subs.length || !key.startsWith(`${gm.slug}.`)) return false;
  const subSlug = key.slice(gm.slug.length + 1);
  if (
    tryParseKonutLeafSubSlug(subSlug) ||
    tryParseGayrimenkulSatKirLeafSubSlug(subSlug)
  ) {
    return false;
  }
  const mid = gm.subs.find((s) => s.slug === subSlug && s.drilldown);
  return Boolean(mid);
}

export type ParsedCategorySlug = {
  group: CategoryGroupDef;
  sub: SubcategoryDef;
};

/** Uygulama içi bileşik anahtar: "elektronik.telefon" */
export function compositeCategoryKey(groupSlug: string, subSlug: string): string {
  return `${groupSlug}.${subSlug}`;
}

/** Kenar çubukları / liste filtresi: her satır seçilebilir yaprak kategori */
export function leafRowsForCategoryGroup(group: CategoryGroupDef): ReadonlyArray<{
  reactKey: string;
  compositeKey: string;
  label: string;
}> {
  const rows: Array<{ reactKey: string; compositeKey: string; label: string }> = [];
  for (const sub of group.subs) {
    if (sub.drilldown === "konut") {
      for (const txn of KONUT_LISTING_KINDS) {
        for (const prop of KONUT_PROPERTY_TYPES) {
          const subSlug = konutLeafCategorySubSlug(txn.slug, prop.slug);
          const compositeKey = compositeCategoryKey(group.slug, subSlug);
          rows.push({
            reactKey: compositeKey,
            compositeKey,
            label: `${sub.name} › ${txn.name} › ${prop.name}`
          });
        }
      }
      continue;
    }
    if (sub.drilldown === "emlak-listing-kind") {
      for (const txn of KONUT_LISTING_KINDS) {
        const subSlug = `${sub.slug}-${txn.slug}`;
        const compositeKey = compositeCategoryKey(group.slug, subSlug);
        rows.push({
          reactKey: compositeKey,
          compositeKey,
          label: `${sub.name} › ${txn.name}`
        });
      }
      continue;
    }
    if (sub.drilldown === "otomobil-marka") {
      for (const m of OTOMOBIL_MARKALARI) {
        const subSlug = `otomobil-${m.slug}`;
        const compositeKey = compositeCategoryKey(group.slug, subSlug);
        rows.push({
          reactKey: compositeKey,
          compositeKey,
          label: `${sub.name} › ${m.name}`
        });
      }
      continue;
    }
    const compositeKey = compositeCategoryKey(group.slug, sub.slug);
    rows.push({
      reactKey: sub.slug,
      compositeKey,
      label: sub.name
    });
  }
  return rows;
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

    if (group.slug === "tasitlar") {
      const om = tryParseOtomobilMarkaLeafSubSlug(subSlug);
      if (om) {
        return {
          group,
          sub: {
            slug: subSlug,
            name: `Otomobil › ${om.brandName}`
          }
        };
      }
    }

    if (group.slug === "gayrimenkul") {
      const konutLeaf = tryParseKonutLeafSubSlug(subSlug);
      if (konutLeaf) {
        return {
          group,
          sub: {
            slug: subSlug,
            name: labelKonutLeafCategory(konutLeaf.txn, konutLeaf.prop)
          }
        };
      }
      const satKirLeaf = tryParseGayrimenkulSatKirLeafSubSlug(subSlug);
      if (satKirLeaf) {
        return {
          group,
          sub: {
            slug: subSlug,
            name: labelGayrimenkulSatKirLeaf(satKirLeaf.baseLabel, satKirLeaf.txn)
          }
        };
      }
      if (subSlug === "konut") {
        return { group, sub: { slug: "konut", name: "Konut" } };
      }
      const legacy = GAYRIMENKUL_LEGACY_LEAF_SUBS.find((s) => s.slug === subSlug);
      if (legacy) return { group, sub: legacy };
    }

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

/** Kart / detayda gösterilecek satır örn: "📱 Elektronik › Telefon"; konut yaprağı tam zinciri sub.name ile verir */
export function formatCategoryDisplay(key: string): string {
  const parsed = parseCategoryKey(key);
  if (!parsed) return key;
  const { group, sub } = parsed;
  return `${group.emoji} ${group.name} › ${sub.name}`;
}

/** Sadece konum: "İl · ilçe" (ilçe yoksa il). */
export function formatListingPlaceLine(
  city: string,
  district?: string | null
): string {
  const c = city.trim() || "Konum belirtilmedi";
  const d = district?.trim();
  return d ? `${c} · ${d}` : c;
}

/** Kartta kısa: şehir (ve isteğe bağlı ilçe) + kategori özeti */
export function formatListingCategoryLineCity(
  city: string,
  categoryKey: string,
  district?: string | null
): string {
  const place = formatListingPlaceLine(city, district);
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

    if (group.slug === "tasitlar") {
      if (tryParseOtomobilMarkaLeafSubSlug(subSlug)) {
        return compositeCategoryKey(group.slug, subSlug);
      }
    }

    if (group.slug === "gayrimenkul") {
      if (tryParseKonutLeafSubSlug(subSlug)) {
        return compositeCategoryKey(group.slug, subSlug);
      }
      if (tryParseGayrimenkulSatKirLeafSubSlug(subSlug)) {
        return compositeCategoryKey(group.slug, subSlug);
      }
      if (subSlug === "konut") {
        return compositeCategoryKey(group.slug, "konut");
      }
      const legacy = GAYRIMENKUL_LEGACY_LEAF_SUBS.find((s) => s.slug === subSlug);
      if (legacy) return compositeCategoryKey(group.slug, legacy.slug);
    }

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
