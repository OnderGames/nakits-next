/**
 * Üye / admin sayfaları ortak çerçevesi.
 * Menü bağlantıları üst bardaki Hesabım açılır menüsünde; burada yalnız içerik.
 */
export default function AccountShell({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="account-shell">
      <div className="account-shell__container">
        <p className="account-shell__crumb">
          <span className="account-shell__crumb-dot" aria-hidden />
          Üye paneli
        </p>

        <div className="account-shell__main">{children}</div>
      </div>
    </main>
  );
}
