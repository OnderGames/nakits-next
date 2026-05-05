/** İlan şikayeti — sabit neden kodları (API + UI) */
export const LISTING_REPORT_REASON_KEYS = [
  "spam",
  "fraud",
  "illegal",
  "inappropriate",
  "misleading",
  "other"
] as const;

export type ListingReportReasonKey =
  (typeof LISTING_REPORT_REASON_KEYS)[number];

export const LISTING_REPORT_REASON_LABELS: Record<
  ListingReportReasonKey,
  string
> = {
  spam: "Spam veya tekrarlayan içerik",
  fraud: "Dolandırıcılık / güvenlik şüphesi",
  illegal: "Yasaklı veya mevzuata aykırı ürün/hizmet",
  inappropriate: "Uygunsuz içerik veya dil",
  misleading: "Yanıltıcı bilgi veya fotoğraf",
  other: "Diğer"
};

export function isListingReportReasonKey(
  v: string
): v is ListingReportReasonKey {
  return (LISTING_REPORT_REASON_KEYS as readonly string[]).includes(v);
}
