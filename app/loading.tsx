export default function Loading() {
  return (
    <main className="container" style={{ paddingBlock: "3rem" }}>
      <p className="menu__loading" aria-busy="true" aria-live="polite">
        Yükleniyor…
      </p>
    </main>
  );
}
