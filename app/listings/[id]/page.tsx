import Link from "next/link";
import { notFound } from "next/navigation";
import ListingReportPanel from "@/components/ListingReportPanel";
import ListingDetailFavoriteBar from "@/components/ListingDetailFavoriteBar";
import ListingOwnerFavoriteStat from "@/components/ListingOwnerFavoriteStat";
import ListingDetailSpecTable from "@/components/ListingDetailSpecTable";
import ListingGalleryCarousel from "@/components/ListingGalleryCarousel";
import ListingPromoBadges from "@/components/ListingPromoBadges";
import ListingMessagePanel from "@/components/ListingMessagePanel";
import { formatCategoryDisplay, formatPrice } from "@/lib/categories";
import { formatSellerNameForDisplay } from "@/lib/seller-display";
import { isListingCodeQuery } from "@/lib/listing-code";
import { fetchListingByCode, fetchListingById } from "@/lib/listings-data";
import { listings as mockListings } from "@/lib/mock-data";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;

  const listing =
    hasSupabaseConfig && supabase
      ? isListingCodeQuery(id)
        ? await fetchListingByCode(supabase, id)
        : await fetchListingById(supabase, id)
      : mockListings.find(
          (x) => x.id === id || x.listingCode === id.trim()
        ) ?? null;

  if (!listing) {
    notFound();
  }

  const gallery =
    listing.imageUrls && listing.imageUrls.length > 0
      ? listing.imageUrls
      : [listing.image];

  return (
    <main className="container">
      <h1 className="section-title">İlan detayı</h1>
      <section className="grid-2">
        <div className="panel">
          <ListingGalleryCarousel images={gallery} title={listing.title} />
          <ListingPromoBadges listing={listing} variant="browse" />
          <div className="listing-detail-title-row">
            <h2>{listing.title}</h2>
            <ListingDetailFavoriteBar
              listingId={listing.id}
              sellerId={listing.sellerId}
            />
          </div>
          <p className="price">{formatPrice(listing.price)}</p>
          <ListingDetailSpecTable
            city={listing.city}
            district={listing.district}
            listingCode={listing.listingCode}
            categoryKey={listing.categoryKey}
            title={listing.title}
            modelYear={listing.modelYear}
            vehicleKm={listing.vehicleKm}
          />
          <p className="meta">{formatCategoryDisplay(listing.categoryKey)}</p>
          <ListingOwnerFavoriteStat
            sellerId={listing.sellerId}
            favoriteCount={listing.favoriteCount}
          />
          <p className="meta">İlan tarihi: {listing.createdAt}</p>
          <div className="listing-seller listing-seller--detail">
            <span className="listing-seller__label">Satıcı</span>
            {listing.sellerPublicCode ? (
              <Link
                href={`/kullanici/${listing.sellerPublicCode}`}
                className="listing-seller__name"
              >
                {formatSellerNameForDisplay(listing.seller)}
              </Link>
            ) : (
              <span className="listing-seller__name listing-seller__name--plain">
                {formatSellerNameForDisplay(listing.seller)}
              </span>
            )}
          </div>
          {listing.description && (
            <p style={{ marginTop: 12, lineHeight: 1.5 }}>{listing.description}</p>
          )}
          {hasSupabaseConfig && listing.sellerId ? (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <ListingReportPanel listingId={listing.id} sellerId={listing.sellerId} />
            </div>
          ) : null}
        </div>
        <aside className="panel listing-contact-aside">
          <ListingMessagePanel
            listingId={listing.id}
            sellerId={listing.sellerId}
            sellerPublicCode={listing.sellerPublicCode}
            sellerLabel={formatSellerNameForDisplay(listing.seller)}
          />
        </aside>
      </section>
    </main>
  );
}
