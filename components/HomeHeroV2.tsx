import Link from "next/link";

/** Koyu gradient anasayfa üst alanı */
export default function HomeHeroV2() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__inner">
        <div className="home-hero__copy">
          <p className="home-hero__eyebrow">Yerel ilan · Güvenli iletişim</p>
          <h1 id="home-hero-title">
            İkinci el ve sıfır ürünlerde
            <span className="home-hero__highlight"> hızlı bul, kolay sat</span>
          </h1>
          <p className="home-hero__lead">
            <strong>Nakits</strong> ile komşu ilinden ilanına göz at; fiyatı
            güncelle, alıcıyla anlaş ve vitrine çık.
          </p>
          <div className="home-hero__actions">
            <Link className="home-hero__btn home-hero__btn--primary" href="/listings">
              Tüm ilanlar
            </Link>
            <Link className="home-hero__btn home-hero__btn--ghost" href="/add-listing">
              İlan ver
            </Link>
          </div>
          <ul className="home-hero__chips" aria-label="Özet">
            <li>Şehir ve ilçe filtreleri</li>
            <li>Fotoğraflı ilanlar</li>
            <li>Mesajlaşma</li>
          </ul>
        </div>
        <div className="home-hero__visual" aria-hidden="true">
          <div className="home-hero__orb home-hero__orb--a" />
          <div className="home-hero__orb home-hero__orb--b" />
          <div className="home-hero__orb home-hero__orb--c" />
        </div>
      </div>
    </section>
  );
}
