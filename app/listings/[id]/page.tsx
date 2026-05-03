import Link from "next/link";
import { notFound } from "next/navigation";
import ListingDetailFavoriteBar from "@/components/ListingDetailFavoriteBar";
import ListingGalleryCarousel from "@/components/ListingGalleryCarousel";
import ListingMessagePanel from "@/components/ListingMessagePanel";
import { formatCategoryDisplay, formatPrice } from "@/lib/categories";
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
          <div className="listing-detail-title-row">
            <h2>{listing.title}</h2>
            <ListingDetailFavoriteBar
              listingId={listing.id}
              sellerId={listing.sellerId}
            />
          </div>
          <p className="price">{formatPrice(listing.price)}</p>
          <p>
            {listing.district?.trim()
              ? `${listing.city} · ${listing.district.trim()}`
              : listing.city}
          </p>
          <p className="meta">{formatCategoryDisplay(listing.categoryKey)}</p>
          {listing.listingCode && (
            <p className="meta">
              İlan no: <strong>{listing.listingCode}</strong>
            </p>
          )}
          <p className="meta">İlan tarihi: {listing.createdAt}</p>
          <p className="meta">
            Satıcı:{" "}
            {listing.sellerPublicCode ? (
              <Link
                href={`/kullanici/${listing.sellerPublicCode}`}
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                {listing.seller}
              </Link>
            ) : (
              listing.seller
            )}
          </p>
          {listing.description && (
            <p style={{ marginTop: 12, lineHeight: 1.5 }}>{listing.description}</p>
          )}
        </div>
        <aside className="panel">
          <h3>Satıcı ile iletişime geç</h3>
          <p className="meta" style={{ marginBottom: 12 }}>
            İletişim yalnızca mesaj ile; aşağıdan satıcıya yazabilirsin.
          </p>
          <ListingMessagePanel
            listingId={listing.id}
            sellerId={listing.sellerId}
            sellerPublicCode={listing.sellerPublicCode}
            sellerLabel={listing.seller}
          />
        </aside>
      </section>
    </main>
  );
}
