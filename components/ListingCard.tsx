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

type Props = {
  listing: Listing;
};

export default function ListingCard({ listing }: Props) {
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
    </article>
  );
}
