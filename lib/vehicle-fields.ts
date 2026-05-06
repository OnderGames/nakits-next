/** Kilometre gösterimi (örn. 120.000) */

export function formatKmForDisplay(n: number): string {
  return n.toLocaleString("tr-TR");
}

const YEAR_MIN = 1950;
const YEAR_MAX = 2050;

/** Boş veya 1950–2050 arası tam yıl */
export function parseModelYearInput(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < YEAR_MIN || n > YEAR_MAX) return null;
  return n;
}
