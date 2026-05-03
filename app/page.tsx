import Link from "next/link";
import HomeHeroClassic from "@/components/HomeHeroClassic";
import HomeHeroV2 from "@/components/HomeHeroV2";
import ListingCardPublic from "@/components/ListingCardPublic";
import { fetchPublicListings } from "@/lib/listings-data";
import { getHomepageTheme } from "@/lib/site-settings";
import { listings as mockListings } from "@/lib/mock-data";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default async function HomePage() {
  const fetched =
    hasSupabaseConfig && supabase
      ? await fetchPublicListings(supabase)
      : null;

  const theme =
    hasSupabaseConfig && supabase
      ? await getHomepageTheme(supabase)
      : "v2";

  const shown =
    fetched !== null ? fetched.slice(0, 3) : mockListings.slice(0, 3);

  const mainClass =
    theme === "v2" ? "container home--v2" : "container home--classic";

  return (
    <main className={mainClass}>
      {theme === "classic" ? <HomeHeroClassic /> : <HomeHeroV2 />}

      {!hasSupabaseConfig && (
        <p className="notice">
          Supabase ayarları eksik. Şimdilik örnek veri gösteriliyor. `.env.local`
          oluşturup Supabase bilgilerini girince gerçek veriye geçebilirsin.
        </p>
      )}

      <h2
        className={
          theme === "v2"
            ? "section-title home-listings-title"
            : "section-title"
        }
      >
        {theme === "v2" ? "Öne çıkan ilanlar" : "Öne Çıkan İlanlar"}
      </h2>
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
        <Link href="/listings">Tüm ilanları gör</Link> — şehir ve ilçe filtresi
        burada.
      </p>
    </main>
  );
}
