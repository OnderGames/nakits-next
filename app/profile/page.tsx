import ListingCard from "@/components/ListingCard";
import { listings } from "@/lib/mock-data";

export default function ProfilePage() {
  return (
    <main className="container">
      <h1 className="section-title">Profilim</h1>
      <section className="panel">
        <h3>Onur Demir</h3>
        <p className="meta">İstanbul — 2026&apos;dan beri üye</p>
      </section>

      <h2 className="section-title">Yayındaki ilanlarım</h2>
      <section className="cards">
        {listings.slice(0, 2).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </section>
      <p className="footer">Nakits MVP — Profil</p>
    </main>
  );
}
