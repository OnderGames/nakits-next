/** URL veya arama kutusu için ilan numarası (6–9 rakam) */
export const LISTING_CODE_PATTERN = /^[0-9]{6,9}$/;

export function isListingCodeQuery(s: string): boolean {
  return LISTING_CODE_PATTERN.test(s.trim());
}

/** 6–9 hane uzunluğunda rastgele rakam dizisi */
export function randomListingCode(): string {
  const len = 6 + Math.floor(Math.random() * 4);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += String(Math.floor(Math.random() * 10));
  }
  return out;
}

export function isUniqueViolation(err: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!err) return false;
  if (err.code === "23505") return true;
  const m = (err.message ?? "").toLowerCase();
  return (
    m.includes("duplicate key") ||
    m.includes("unique constraint") ||
    m.includes("already exists")
  );
}

/** Paylaşım için mümkünse ilan numarası ile URL */
export function listingDetailHref(listing: {
  id: string;
  listingCode?: string;
}): string {
  if (listing.listingCode && LISTING_CODE_PATTERN.test(listing.listingCode)) {
    return `/listings/${listing.listingCode}`;
  }
  return `/listings/${listing.id}`;
}
