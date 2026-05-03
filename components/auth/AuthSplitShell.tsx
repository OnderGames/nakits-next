import Link from "next/link";

type Props = {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthSplitShell({
  title,
  eyebrow,
  children,
  footer
}: Props) {
  return (
    <main className="auth-split">
      <aside className="auth-split__hero">
        <div className="auth-split__hero-blob" aria-hidden />
        <div className="auth-split__hero-content">
          <p className="auth-split__hero-words">
            <span className="auth-split__hero-line">ev</span>
            <span className="auth-split__hero-dot"> · </span>
            <span className="auth-split__hero-line">araba</span>
            <span className="auth-split__hero-dot"> · </span>
            <span className="auth-split__hero-line">her şey</span>
          </p>
          <p className="auth-split__hero-tagline">
            Türkiye&apos;nin ilan vitrinine hoş geldiniz.
          </p>
        </div>
        <Link href="/" className="auth-split__hero-brand" aria-label="Nakits.com ana sayfa">
          <span className="auth-split__hero-brand-inner">
            <span className="auth-split__hero-brand-word">Nakits</span>
            <span className="auth-split__hero-brand-com">.com</span>
          </span>
        </Link>
      </aside>

      <div className="auth-split__main">
        <div className="auth-split__card">
          {eyebrow ? (
            <p className="auth-split__eyebrow">{eyebrow}</p>
          ) : null}
          <h1 className="auth-split__title">{title}</h1>
          {children}
          {footer}
        </div>
      </div>
    </main>
  );
}
