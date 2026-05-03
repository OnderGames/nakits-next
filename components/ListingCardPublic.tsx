import Image from "next/image";
import Link from "next/link";
import FavoriteHeartButton from "@/components/FavoriteHeartButton";
import {
  formatListingCategoryLineCity,
  formatPrice
} from "@/lib/categories";
import { listingDetailHref } from "@/lib/listing-code";
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
 * Yalnızca sunucu bileşenlerinden kullanın (ör. ana sayfa).
 * Etkileşim / sil düğmesi yok — derleme ve prerender güvenli.
 */
export default function ListingCardPublic({ listing, vitrin }: Props) {
  const href = listingDetailHref(listing);

  if (vitrin) {
    return (
      <article className="card card--vitrin">
        <div className="card--vitrin__shell">
          <Link href={href} className="card--vitrin__link">
            <div className="card--vitrin__media">
              <Image
                src={listing.image}
                alt={listing.title}
                width={500}
                height={280}
              />
              {(listing.imageUrls?.length ?? 0) > 1 && (
                <span className="card--vitrin__badge">
                  {listing.imageUrls!.length} fotoğraf
                </span>
              )}
            </div>
            <div className="card-body">
              <h3 className="card--vitrin__title">{listing.title}</h3>
              <p className="price price--vitrin">{formatPrice(listing.price)}</p>
            </div>
          </Link>
          <FavoriteHeartButton
            listingId={listing.id}
            sellerId={listing.sellerId}
            variant="vitrin"
          />
        </div>
      </article>
    );
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
