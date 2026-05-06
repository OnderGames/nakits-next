import type { Listing } from "@/lib/types";

type Props = {
  listing: Listing;
  /** vitrin: ana sayfa görsel üstü; browse: liste kartı içinde */
  variant?: "vitrin" | "browse";
};

/** Premium / vitrin / öne çıkarma rozetleri (yönetim panelinden) */
export default function ListingPromoBadges({
  listing,
  variant = "browse"
}: Props) {
  const show =
    listing.promoShowcase ||
    listing.promoPremium ||
    listing.promoHighlight;
  if (!show) return null;

  return (
    <div
      className={
        variant === "vitrin"
          ? "listing-promo-badges listing-promo-badges--vitrin"
          : "listing-promo-badges listing-promo-badges--browse"
      }
      aria-label="İlan promosyonları"
    >
      {listing.promoShowcase ? (
        <span className="listing-promo listing-promo--showcase">Vitrin</span>
      ) : null}
      {listing.promoPremium ? (
        <span className="listing-promo listing-promo--premium">Premium</span>
      ) : null}
      {listing.promoHighlight ? (
        <span className="listing-promo listing-promo--highlight">
          Öne çıkan
        </span>
      ) : null}
    </div>
  );
}
