import Image from "next/image";
import Link from "next/link";
import {
  formatListingCategoryLineCity,
  formatPrice
} from "@/lib/categories";
import type { Listing } from "@/lib/types";

const STATUS_LABEL: Record<NonNullable<Listing["status"]>, string> = {
  pending: "Onay bekliyor",
  active: "Yayında",
  sold: "Satıldı",
  rejected: "Yayınlanmadı"
};

/**
 * Yalnızca sunucu bileşenlerinden kullanın (ör. ana sayfa).
 * Etkileşim / sil düğmesi yok — derleme ve prerender güvenli.
 */
export default function ListingCardPublic({ listing }: { listing: Listing }) {
  return (
    <article className="card">
      <Link href={`/listings/${listing.id}`}>
        <Image src={listing.image} alt={listing.title} width={500} height={280} />
        <div className="card-body">
          <h3>{listing.title}</h3>
          <p className="price">{formatPrice(listing.price)}</p>
          <p className="meta">
            {formatListingCategoryLineCity(
              listing.city,
              listing.categoryKey,
              listing.district
            )}
          </p>
          {listing.status && (
            <p className="meta">
              {STATUS_LABEL[listing.status] ?? listing.status}
            </p>
          )}
          <p className="meta">{listing.createdAt}</p>
        </div>
      </Link>
      {listing.sellerPublicCode && (
        <p className="meta" style={{ padding: "0 12px 12px", margin: 0 }}>
          Satıcı:{" "}
          <Link
            href={`/kullanici/${listing.sellerPublicCode}`}
            style={{ color: "var(--primary)", textDecoration: "underline" }}
          >
            {listing.seller}
          </Link>
        </p>
      )}
    </article>
  );
}
