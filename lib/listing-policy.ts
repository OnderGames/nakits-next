import {
  LISTING_DURATION_DEFAULT_DAYS,
  normalizeListingDurationDays
} from "@/lib/site-settings";

/** Eşzamanlı olarak «onay bekliyor» veya «yayında» olabilen ilan sayısı üst sınırı */
export const MAX_LISTINGS_PER_USER = 3;

/** Yeni ilan veya onay sonrası bitiş zamanı (ISO, UTC); gün sayısı site ayarından gelir */
export function listingExpiresAtIsoFromDays(days: number): string {
  const d = normalizeListingDurationDays(days);
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString();
}

/** Yedek: ayar okunamazsa sabit varsayılan gün */
export function listingExpiresAtIsoFromDefaultDays(): string {
  return listingExpiresAtIsoFromDays(LISTING_DURATION_DEFAULT_DAYS);
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
