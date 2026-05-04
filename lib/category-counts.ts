import type { Listing } from "@/lib/types";

/**
 * Ana sayfada `fetchPublicListings` ile gelen tam liste üzerinden sayım yapılır
 * (ek sorgu yok). İleride ana sayfa yalnızca özet çekerse Supabase GROUP BY / RPC eklenebilir.
 */
/** Bileşik kategori anahtarı (örn. elektronik.telefon) → ilan sayısı */
export function buildListingCountsByCategoryKey(
  listings: Pick<Listing, "categoryKey">[]
): Record<string, number> {
  const m: Record<string, number> = {};
  for (const L of listings) {
    const k = L.categoryKey?.trim();
    if (!k) continue;
    m[k] = (m[k] ?? 0) + 1;
  }
  return m;
}

export function formatListingCountTr(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(n);
}

export function sumListingCountsWhere(
  counts: Record<string, number>,
  test: (categoryKey: string) => boolean
): number {
  let t = 0;
  for (const [key, n] of Object.entries(counts)) {
    if (test(key)) t += n;
  }
  return t;
}
