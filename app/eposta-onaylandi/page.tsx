import Link from "next/link";

export default function EpostaOnaylandiPage() {
  return (
    <main className="container" style={{ padding: "32px 0 48px" }}>
      <div className="panel" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 className="section-title" style={{ marginTop: 0 }}>
          E-posta adresiniz onaylanmıştır
        </h1>
        <p className="meta" style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 20 }}>
          Hesabınız hazır. İlan vermek için aşağıdaki düğmeye tıklayın veya menüden
          &quot;İlan ver&quot; seçeneğini kullanın.
        </p>
        <Link href="/add-listing" className="nav-cta" style={{ display: "inline-block" }}>
          Hemen ilan ver
        </Link>
      </div>
    </main>
  );
}
