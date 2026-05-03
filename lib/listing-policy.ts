/** Eşzamanlı olarak «onay bekliyor» veya «yayında» olabilen ilan sayısı üst sınırı */
export const MAX_LISTINGS_PER_USER = 3;

/** Yayındaki / bekleyen ilanların ömrü (gün); süre dolunca cron ile silinir */
export const LISTING_DURATION_DAYS = 30;

/** Yeni ilan veya onay sonrası bitiş zamanı (ISO, UTC) */
export function listingExpiresAtIsoFromNow(): string {
  return new Date(
    Date.now() + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
}

/** Satıldı ilanı süresi dolmadıysa tekrar yayına alınabilir */
export function listingCanRepublishFromSold(
  expiresAtIso: string | undefined
): boolean {
  if (!expiresAtIso) return false;
  return new Date(expiresAtIso).getTime() > Date.now();
}

/** Kart / özet için kısa süre metni */
export function formatListingExpiryShort(iso: string | undefined): string | null {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  const ms = end - Date.now();
  if (Number.isNaN(ms)) return null;
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Süresi doldu";
  if (days === 1) return "1 gün kaldı";
  return `${days} gün kaldı`;
}

/** Satıcı / ilan sahibi: tam bitiş zamanı + kalan gün (profil, ilanlarım) */
export function formatListingExpiryDetailTr(iso: string | undefined): string | null {
  if (!iso) return null;
  const end = new Date(iso);
  const t = end.getTime();
  if (Number.isNaN(t)) return null;
  const datePart = end.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const short = formatListingExpiryShort(iso);
  return short
    ? `Yayından kalkma: ${datePart} · ${short}`
    : `Yayından kalkma: ${datePart}`;
}
