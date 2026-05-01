import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { hasSupabaseConfig } from "@/lib/supabase";
import { listings } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <h1>Türkiye&apos;nin hızlı ilan platformu</h1>
        <p>
          Elektronikten vasıtaya, ihtiyacın olan ürünü bul veya saniyeler içinde
          ilan ver.
        </p>
      </section>

      {!hasSupabaseConfig && (
        <p className="notice">
          Supabase ayarları eksik. Şimdilik örnek veri gösteriliyor. `.env.local`
          oluşturup Supabase bilgilerini girince gerçek veriye geçebilirsin.
        </p>
      )}

      <h2 className="section-title">Öne Çıkan İlanlar</h2>
      <section className="cards">
        {listings.slice(0, 3).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </section>

      <p className="footer">
        <Link href="/listings">Tüm ilanları gör</Link>
      </p>
    </main>
  );
}
