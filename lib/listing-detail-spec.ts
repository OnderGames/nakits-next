import {
  tryParseOtomobilBrandIntermediateSubSlug,
  tryParseOtomobilBrandOnlyLeafSubSlug,
  tryParseOtomobilModelLeafSubSlug
} from "@/lib/categories";

/** Vasıta ana grubu: `tasitlar.*` bileşik anahtarı */
export function isTasitlarListingCategoryKey(categoryKey: string): boolean {
  return categoryKey.trim().startsWith("tasitlar.");
}

/** Başlıkta yaygın model yılı aralığı (4 hane, ~1980–2049) */
export function tryExtractYearFromListingTitle(title: string): string | null {
  const t = title.trim();
  const m = t.match(/\b(198\d|199\d|20\d\d)\b/);
  return m ? m[1] : null;
}

export type OtomobilSpecFromCategory = {
  brand: string;
  model: string | null;
};

/**
 * Yaprak kategori anahtarından otomobil marka (+ modelli ise model).
 * `tasitlar.otomobil` ara anahtarı veya otomobil dışı kategoriler için null.
 */
export function getOtomobilBrandModelFromCategoryKey(
  categoryKey: string
): OtomobilSpecFromCategory | null {
  const key = categoryKey.trim();
  if (!key.startsWith("tasitlar.")) return null;
  const sub = key.slice("tasitlar.".length);
  const leaf = tryParseOtomobilModelLeafSubSlug(sub);
  if (leaf) {
    return { brand: leaf.brandName, model: leaf.modelName };
  }
  const brandOnly = tryParseOtomobilBrandOnlyLeafSubSlug(sub);
  if (brandOnly) {
    return { brand: brandOnly.brandName, model: null };
  }
  const intermediate = tryParseOtomobilBrandIntermediateSubSlug(sub);
  if (intermediate) {
    return { brand: intermediate.brandName, model: null };
  }
  return null;
}
