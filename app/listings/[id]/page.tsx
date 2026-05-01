import Image from "next/image";
import { notFound } from "next/navigation";
import { formatPrice, listings } from "@/lib/mock-data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const listing = listings.find((x) => x.id === id);

  if (!listing) {
    notFound();
  }

  return (
    <main className="container">
      <h1 className="section-title">Ilan Detayi</h1>
      <section className="grid-2">
        <div className="panel">
          <Image src={listing.image} alt={listing.title} width={900} height={500} />
          <h2>{listing.title}</h2>
          <p className="price">{formatPrice(listing.price)}</p>
          <p>
            {listing.city} - {listing.category}
          </p>
          <p className="meta">Ilan tarihi: {listing.createdAt}</p>
          <p className="meta">Satici: {listing.seller}</p>
        </div>
        <aside className="panel">
          <h3>Satici ile iletisime gec</h3>
          <p className="meta">Mesajlasma MVP&#39;de demo durumunda.</p>
          <textarea rows={6} placeholder="Mesajinizi yazin" />
          <button className="btn btn-primary" style={{ marginTop: 10 }}>
            Mesaj Gonder
          </button>
        </aside>
      </section>
      <p className="footer">Nakits MVP - Ilan Detay</p>
    </main>
  );
}
