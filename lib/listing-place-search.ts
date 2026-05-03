/** Türkçe İ/i vb. uyum için karşılaştırma dizgisi */
export function normalizeTrComparable(s: string): string {
  return s.trim().toLocaleLowerCase("tr-TR");
}

/**
 * Arama kutusundaki q (ayrı il/ilçe filtresi olmadan) şehir / ilçe ile eşler.
 * Örn. "kadıköy villa", "İstanbul ataşehir".
 */
export function listingPlaceMatchesFreeTextQuery(
  itemCity: string,
  itemDistrict: string | null | undefined,
  queryRaw: string
): boolean {
  const q = normalizeTrComparable(queryRaw);
  if (!q) return false;
  const city = normalizeTrComparable(itemCity);
  const district =
    itemDistrict != null ? normalizeTrComparable(String(itemDistrict)) : "";

  if (city.length >= 2 && q.includes(city)) return true;
  if (district.length >= 2 && q.includes(district)) return true;

  const tokens = q.split(/[\s,.;/]+/).filter((t) => t.length >= 2);
  for (const t of tokens) {
    if (city.length >= 2) {
      if (t === city) return true;
      /* "ank"→Ankara — en az 3 harf ki "el", "da" vb. yüzünden gereksiz eşleşme olmasın */
      if (t.length >= 3 && city.startsWith(t)) return true;
      if (t.length >= 4 && city.includes(t)) return true;
    }
    if (district.length >= 2) {
      if (t === district) return true;
      if (t.length >= 3 && district.startsWith(t)) return true;
      if (t.length >= 4 && district.includes(t)) return true;
    }
  }
  return false;
}
