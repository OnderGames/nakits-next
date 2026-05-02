import Image from "next/image";
import { notFound } from "next/navigation";
import { formatCategoryDisplay, formatPrice } from "@/lib/categories";
import { fetchListingById } from "@/lib/listings-data";
import { listings as mockListings } from "@/lib/mock-data";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;

  const listing =
    hasSupabaseConfig && supabase
      ? await fetchListingById(supabase, id)
      : mockListings.find((x) => x.id === id) ?? null;

  if (!listing) {
    notFound();
  }

  return (
    <main className="container">
      <h1 className="section-title">İlan detayı</h1>
      <section className="grid-2">
        <div className="panel">
          <Image
            src={listing.image}
            alt={listing.title}
            width={900}
            height={500}
            style={{ width: "100%", height: "auto" }}
          />
          <h2>{listing.title}</h2>
          <p className="price">{formatPrice(listing.price)}</p>
          <p>{listing.city}</p>
          <p className="meta">{formatCategoryDisplay(listing.categoryKey)}</p>
          <p className="meta">İlan tarihi: {listing.createdAt}</p>
          <p className="meta">Satıcı: {listing.seller}</p>
          {listing.description && (
            <p style={{ marginTop: 12, lineHeight: 1.5 }}>{listing.description}</p>
          )}
          <div style={{ marginTop: 16 }}>
            <strong>Telefon</strong>
            {listing.showPhoneOnListing !== false &&
            listing.sellerPhone &&
            listing.sellerPhone.trim().length > 0 ? (
              <p style={{ margin: "8px 0 0" }}>
                <a href={`tel:${listing.sellerPhone.replace(/\s/g, "")}`}>
                  {listing.sellerPhone.trim()}
                </a>
              </p>
            ) : (
              <p className="meta" style={{ margin: "8px 0 0", lineHeight: 1.5 }}>
                Satıcı bu ilanda telefon paylaşmadı veya profilde numara yok.
                İletişim için aşağıdan mesaj göndermeyi kullanın.
              </p>
            )}
          </div>
        </div>
        <aside className="panel">
          <h3>Satıcı ile iletişime geç</h3>
          <p className="meta">
            {listing.showPhoneOnListing !== false &&
            listing.sellerPhone &&
            listing.sellerPhone.trim().length > 0
              ? "Telefonu ilanda görebilirsin; mesajlaşma yakında aktif olacak."
              : "Telefon gizliyse veya yoksa mesaj ile iletişim kurulacak (yakında)."}
          </p>
          <textarea rows={6} placeholder="Mesajınızı yazın" />
          <button className="btn btn-primary" style={{ marginTop: 10 }}>
            Mesaj Gönder
          </button>
        </aside>
      </section>
      <p className="footer">Nakits MVP — İlan detayı</p>
    </main>
  );
}
