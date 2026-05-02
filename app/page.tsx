import Link from "next/link";
import ListingCardPublic from "@/components/ListingCardPublic";
import { fetchPublicListings } from "@/lib/listings-data";
import { listings as mockListings } from "@/lib/mock-data";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default async function HomePage() {
  const fetched =
    hasSupabaseConfig && supabase
      ? await fetchPublicListings(supabase)
      : null;

  const shown =
    fetched !== null ? fetched.slice(0, 3) : mockListings.slice(0, 3);

  return (
    <main className="container">
      <section className="hero hero--spotlight">
        <div className="hero-spotlight">
          <h1>Satmak kolay, almak daha da kolay</h1>
          <p className="hero-spotlight__tagline">
            <span className="hero-spotlight__quote-open" aria-hidden>
              “
            </span>
            <Link className="hero-spotlight__brandlink" href="/">
              <strong>Nakits.com</strong>
            </Link>{" "}
            ile ihtiyaçlarını anında karşıla!
            <span className="hero-spotlight__quote-close" aria-hidden>
              ”
            </span>
          </p>
        </div>
      </section>

      {!hasSupabaseConfig && (
        <p className="notice">
          Supabase ayarları eksik. Şimdilik örnek veri gösteriliyor. `.env.local`
          oluşturup Supabase bilgilerini girince gerçek veriye geçebilirsin.
        </p>
      )}

      <h2 className="section-title">Öne Çıkan İlanlar</h2>
      {fetched !== null && shown.length === 0 && (
        <p className="meta">
          Henüz yayındaki ilan yok. İlk ilanı sen verebilirsin.
        </p>
      )}
      <section className="cards">
        {shown.map((listing) => (
          <ListingCardPublic key={listing.id} listing={listing} />
        ))}
      </section>

      <p className="meta" style={{ marginTop: 24 }}>
        <Link href="/listings">Tüm ilanları gör</Link>
        {" "}
        — şehir ve ilçe filtresi burada.
      </p>
    </main>
  );
}
