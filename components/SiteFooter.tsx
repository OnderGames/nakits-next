import pkg from "@/package.json";

/** Canlıda görünen sürüm / commit — deploy oldu mu Ctrl+F5 ile buradan doğrula */
export default function SiteFooter() {
  const shaFull = process.env.VERCEL_GIT_COMMIT_SHA;
  const shaShort = shaFull?.slice(0, 7);
  const env =
    process.env.VERCEL_ENV === "production"
      ? "production"
      : process.env.VERCEL_ENV === "preview"
        ? "önizleme"
        : null;

  return (
    <footer className="site-footer">
      <div
        className="container"
        style={{
          padding: "18px 0 28px",
          borderTop: "1px solid var(--border)"
        }}
      >
        <p
          className="meta"
          style={{
            margin: 0,
            fontSize: 12,
            textAlign: "center",
            lineHeight: 1.5
          }}
        >
          <strong style={{ color: "var(--text)" }}>Nakits</strong>
          {" · "}
          <span title="package.json sürümü">v{pkg.version}</span>
          {shaShort ? (
            <>
              {" · "}
              <span title={shaFull}>
                yayın <code style={{ fontSize: 11 }}>{shaShort}</code>
              </span>
              {env ? ` (${env})` : ""}
            </>
          ) : (
            <>
              {" · "}
              <span style={{ opacity: 0.9 }}>
                yerel çalışma veya commit bilgisi yok
              </span>
            </>
          )}
        </p>
        <p
          className="meta"
          style={{
            margin: "10px 0 0",
            fontSize: 11,
            textAlign: "center",
            maxWidth: 520,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.45
          }}
        >
          Üst menüde <strong>Mesajlarım</strong> görünmüyorsa veya sürüm hep aynıysa:
          kod GitHub&apos;a <strong>push</strong> edilmemiş veya Vercel&apos;de yeni
          deployment bitmemiş olabilir — önce <strong>Ctrl+F5</strong>, sonra Vercel
          → Deployments kontrol et.
        </p>
      </div>
    </footer>
  );
}
