import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Site alt bilgi">
      <div className="container site-footer__inner">
        <div className="site-footer__top">
          <nav
            className="site-footer__nav"
            aria-label="Önemli bağlantılar"
          >
            <Link href="/">Ana sayfa</Link>
            <span className="site-footer__sep" aria-hidden>
              ·
            </span>
            <Link href="/listings">Tüm ilanlar</Link>
            <span className="site-footer__sep" aria-hidden>
              ·
            </span>
            <Link href="/uyelik-sozlesmesi">Üyelik sözleşmesi</Link>
            <span className="site-footer__sep" aria-hidden>
              ·
            </span>
            <Link href="/gizlilik-politikasi">Gizlilik ve KVKK</Link>
          </nav>
          <p className="site-footer__copy">© {year} Nakits.com</p>
        </div>

        <nav
          className="site-footer__stores"
          aria-label="App Store ve Google Play için hukuki bağlantılar"
        >
          <p className="site-footer__stores-label">
            App Store / Play Store gereksinimleri:
          </p>
          <p className="site-footer__stores-links">
            <Link href="/gizlilik-politikasi">Privacy Policy</Link>
            <span className="site-footer__sep" aria-hidden>
              ·
            </span>
            <Link href="/uyelik-sozlesmesi">Terms of Service</Link>
          </p>
          <p className="site-footer__stores-note">
            Yukarıdaki Türkçe sayfalarla aynı metinler; mağaza formlarında bu
            URL’leri paylaşabilirsiniz.
          </p>
        </nav>
      </div>
    </footer>
  );
}
