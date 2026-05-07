"use client";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container" style={{ paddingBlock: "2.5rem" }}>
      <h1 className="section-title">Bir şeyler ters gitti</h1>
      <p className="meta" style={{ marginBottom: 20, maxWidth: 520 }}>
        Sayfa yüklenirken beklenmeyen bir hata oluştu. Ağ bağlantınızı
        kontrol edip tekrar deneyebilirsiniz.
      </p>
      {process.env.NODE_ENV === "development" && error.message ? (
        <pre
          className="meta"
          style={{
            marginBottom: 20,
            padding: 12,
            overflow: "auto",
            maxWidth: "100%",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13
          }}
        >
          {error.message}
        </pre>
      ) : null}
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Tekrar dene
      </button>
    </main>
  );
}
