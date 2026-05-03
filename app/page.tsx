import Link from "next/link";
import HomeCategorySidebar from "@/components/HomeCategorySidebar";
import ListingCardPublic from "@/components/ListingCardPublic";
import { buildListingCountsByCategoryKey } from "@/lib/category-counts";
import { fetchPublicListings } from "@/lib/listings-data";
import { getHomepageTheme } from "@/lib/site-settings";
import { listings as mockListings } from "@/lib/mock-data";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

const VITRIN_COUNT = 18;

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
    fetched !== null
      ? fetched.slice(0, VITRIN_COUNT)
      : mockListings.slice(0, VITRIN_COUNT);

  const listingSource = fetched !== null ? fetched : mockListings;
  const categoryCounts = buildListingCountsByCategoryKey(listingSource);

  const mainClass = `container home--${theme}`;

  return (
    <main className={mainClass}>
      <div className="home-satariz-layout">
        <HomeCategorySidebar counts={categoryCounts} />

        <div className="home-satariz-main">
          {!hasSupabaseConfig && (
            <p className="notice home-satariz-notice">
              Supabase ayarları eksik. Şimdilik örnek veri gösteriliyor.{" "}
              <code>.env.local</code>
              oluşturup Supabase bilgilerini girince gerçek veriye geçebilirsin.
            </p>
          )}

          <div className="home-vitrin-head">
            <h2 className="home-vitrin-head__title">Vitrin İlanları</h2>
            <Link href="/listings" className="home-vitrin-head__all">
              Tüm vitrin ilanlarını gör
            </Link>
          </div>

          {fetched !== null && shown.length === 0 && (
            <section
              className="panel account-empty-panel"
              style={{ marginBottom: 14 }}
            >
              <p className="account-empty-panel__text">
                Henüz yayındaki ilan yok. İlk ilanı sen verebilirsin.
              </p>
              <Link href="/add-listing" className="btn btn-primary account-empty-panel__cta">
                İlan ver
              </Link>
            </section>
          )}

          <section className="cards cards--vitrin">
            {shown.map((listing) => (
              <ListingCardPublic key={listing.id} listing={listing} vitrin />
            ))}
          </section>

          <p className="meta home-satariz-foot">
            <Link href="/listings">Tüm ilanları listele</Link>
            {" · "}
            şehir ve ilçe filtresi ilanlar sayfasında.
          </p>
        </div>
      </div>
    </main>
  );
}
