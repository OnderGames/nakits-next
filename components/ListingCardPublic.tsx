import Image from "next/image";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import {
  formatListingCategoryLineCity,
  formatPrice
} from "@/lib/categories";
import { listingDetailHref } from "@/lib/listing-code";
import { formatSellerNameForDisplay } from "@/lib/seller-display";
import type { Listing } from "@/lib/types";

const STATUS_LABEL: Record<NonNullable<Listing["status"]>, string> = {
  pending: "Onay bekliyor",
  active: "Yayında",
  sold: "Satıldı",
  rejected: "Yayınlanmadı"
};

type Props = {
  listing: Listing;
  /** Ana sayfa vitrin düzeni: sade başlık + turuncu fiyat, dekoratif kalp */
  vitrin?: boolean;
};

/**
 * Varsayılan ayrıntılı liste kartı sunucuda kalır; vitrin görünümü ListingCard ile paylaşılır.
 */
export default function ListingCardPublic({ listing, vitrin }: Props) {
  const href = listingDetailHref(listing);

  if (vitrin) {
    return <ListingCard listing={listing} presentation="vitrin" />;
  }

  return (
    <article className="card">
      <Link href={href}>
        <div style={{ position: "relative" }}>
          <Image src={listing.image} alt={listing.title} width={500} height={280} />
          {(listing.imageUrls?.length ?? 0) > 1 && (
            <span
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                padding: "4px 8px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: "rgba(0,0,0,0.65)",
                color: "#fff"
              }}
            >
              {listing.imageUrls!.length} fotoğraf
            </span>
          )}
        </div>
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
          {listing.listingCode && (
            <p className="meta">İlan no: {listing.listingCode}</p>
          )}
          <p className="meta">{listing.createdAt}</p>
        </div>
      </Link>
      {listing.sellerPublicCode && (
        <div className="listing-seller">
          <span className="listing-seller__label">Satıcı</span>
          <Link
            href={`/kullanici/${listing.sellerPublicCode}`}
            className="listing-seller__name"
          >
            {formatSellerNameForDisplay(listing.seller)}
          </Link>
        </div>
      )}
    </article>
  );
}
