import Link from "next/link";

/** Eski yeşil spotlight anasayfa üst alanı */
export default function HomeHeroClassic() {
  return (
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
  );
}
