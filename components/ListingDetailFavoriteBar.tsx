"use client";

import FavoriteHeartButton from "@/components/FavoriteHeartButton";

export default function ListingDetailFavoriteBar({
  listingId,
  sellerId
}: {
  listingId: string;
  sellerId?: string;
}) {
  return (
    <div className="listing-detail-fav">
      <FavoriteHeartButton
        listingId={listingId}
        sellerId={sellerId}
        variant="detail"
      />
    </div>
  );
}
