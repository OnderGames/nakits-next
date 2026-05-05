import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Site alt bilgi">
      <div className="container site-footer__inner">
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
    </footer>
  );
}
