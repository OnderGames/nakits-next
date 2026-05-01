import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { hasSupabaseConfig } from "@/lib/supabase";
import { listings } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <h1>Turkiye&#39;nin hizli ilan platformu</h1>
        <p>
          Elektronikten vasitaya, ihtiyacin olan urunu bul veya saniyeler icinde
          ilan ver.
        </p>
      </section>

      {!hasSupabaseConfig && (
        <p className="notice">
          Supabase ayarlari eksik. Simdilik mock data gosteriliyor. `.env.local`
          olusturup Supabase bilgilerini girince gercek veriye gecebilirsin.
        </p>
      )}

      <h2 className="section-title">One Cikan Ilanlar</h2>
      <section className="cards">
        {listings.slice(0, 3).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </section>

      <p className="footer">
        <Link href="/listings">Tum ilanlari gor</Link>
      </p>
    </main>
  );
}
