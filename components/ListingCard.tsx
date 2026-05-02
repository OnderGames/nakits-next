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

type OwnerToolbar = {
  editHref: string;
  onDelete: () => void;
  busy?: boolean;
};

type Props = {
  listing: Listing;
  ownerToolbar?: OwnerToolbar;
};

export default function ListingCard({ listing, ownerToolbar }: Props) {
  return (
    <article className="card">
      <Link href={`/listings/${listing.id}`}>
        <Image src={listing.image} alt={listing.title} width={500} height={280} />
        <div className="card-body">
          <h3>{listing.title}</h3>
          <p className="price">{formatPrice(listing.price)}</p>
          <p className="meta">
            {formatListingCategoryLineCity(listing.city, listing.categoryKey)}
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
            onClick={(e) => e.stopPropagation()}
          >
            {listing.seller}
          </Link>
        </p>
      )}
      {ownerToolbar && (
        <div
          style={{
            padding: "10px 12px 14px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          <Link
            href={ownerToolbar.editHref}
            className="btn btn-outline"
            style={{ fontSize: 14, padding: "8px 14px" }}
            onClick={(e) => e.stopPropagation()}
          >
            Düzenle
          </Link>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              fontSize: 14,
              padding: "8px 14px",
              color: "#b91c1c",
              borderColor: "#fecaca"
            }}
            disabled={ownerToolbar.busy}
            onClick={(e) => {
              e.preventDefault();
              ownerToolbar.onDelete();
            }}
          >
            {ownerToolbar.busy ? "Siliniyor…" : "Sil"}
          </button>
        </div>
      )}
    </article>
  );
}
