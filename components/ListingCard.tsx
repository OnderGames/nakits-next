import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/mock-data";
import type { Listing } from "@/lib/types";

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
            {listing.city} - {listing.category}
          </p>
          <p className="meta">{listing.createdAt}</p>
        </div>
      </Link>
    </article>
  );
}
