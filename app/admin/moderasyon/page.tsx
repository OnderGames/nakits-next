"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatCategoryDisplay } from "@/lib/categories";
import { formatPrice } from "@/lib/format-price";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

type PendingRow = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  price: number;
  created_at: string;
  categoryKey: string;
  imageUrl: string | null;
  sellerName: string;
  sellerEmail: string;
};

export default function AdminModerationPage() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const authHeaders = useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const loadPending = useCallback(async () => {
    setLoadError("");
    const h = await authHeaders();
    if (!h) {
      setRows([]);
      return;
    }
    const res = await fetch("/api/admin/pending-listings", { headers: h });
    const json = (await res.json()) as {
      listings?: PendingRow[];
      error?: string;
    };
    if (!res.ok) {
      setLoadError(json.error ?? "Liste alınamadı.");
      setRows([]);
      return;
    }
    setRows(json.listings ?? []);
  }, [authHeaders]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setReady(true);
      setCheckedAdmin(true);
      setIsAdmin(false);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setReady(true);
      setCheckedAdmin(true);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setReady(true);
      const token = data.session?.access_token;
      if (!token) {
        setCheckedAdmin(true);
        setIsAdmin(false);
        return;
      }
      void fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((r) => r.json())
        .then((j: { admin?: boolean }) => {
          setIsAdmin(Boolean(j.admin));
          setCheckedAdmin(true);
          if (j.admin) void loadPending();
        })
        .catch(() => {
          setIsAdmin(false);
          setCheckedAdmin(true);
        });
    });
  }, [loadPending]);

  async function setStatus(id: string, status: "active" | "rejected") {
    setBusyId(id);
    setLoadError("");
    const h = await authHeaders();
    if (!h) {
      setBusyId(null);
      return;
    }
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setLoadError(json.error ?? "Güncellenemedi.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  if (!ready || !checkedAdmin) {
    return (
      <main className="container" style={{ padding: "24px 0" }}>
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <main className="container" style={{ padding: "24px 0" }}>
        <h1 className="section-title">Moderasyon</h1>
        <p className="notice">Supabase yapılandırması yok.</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="container" style={{ padding: "24px 0" }}>
        <h1 className="section-title">Moderasyon</h1>
        <section className="panel">
          <p>Bu sayfaya yalnızca site yöneticileri erişebilir.</p>
          <p className="meta" style={{ marginTop: 10 }}>
            Ortamda{" "}
            <code style={{ fontSize: 13 }}>ADMIN_EMAILS</code> içinde e-posta
            adresin tanımlı olmalı ve giriş yapmış olmalısın.
          </p>
          <Link className="btn btn-primary" style={{ display: "inline-block", marginTop: 14 }} href="/login?next=/admin/moderasyon">
            Giriş yap
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "24px 0 48px" }}>
      <h1 className="section-title">İlan moderasyonu</h1>
      <p className="meta" style={{ marginBottom: 16 }}>
        Onaylanan ilanlar herkese açılır; reddedilenler yayınlanmaz.
      </p>

      {loadError && (
        <p className="notice" style={{ marginBottom: 14, background: "#fee2e2", borderColor: "#fecaca", color: "#7f1d1d" }}>
          {loadError}
        </p>
      )}

      <p style={{ marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => void loadPending()}
          disabled={busyId !== null}
        >
          Listeyi yenile
        </button>
      </p>

      {rows.length === 0 ? (
        <section className="panel">
          <p>Onay bekleyen ilan yok.</p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {rows.map((row) => (
            <article key={row.id} className="panel admin-listing-card">
              <div
                className="admin-moderation-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(120px, 160px) 1fr",
                  gap: 16,
                  alignItems: "start"
                }}
              >
                <div>
                  {row.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- dynamic Supabase URL
                    <img
                      src={row.imageUrl}
                      alt=""
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        aspectRatio: "4/3",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    <div
                      className="meta"
                      style={{
                        padding: 24,
                        textAlign: "center",
                        borderRadius: 10,
                        border: "1px dashed var(--border)"
                      }}
                    >
                      Görsel yok
                    </div>
                  )}
                </div>
                <div>
                  <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>{row.title}</h2>
                  <p className="price" style={{ margin: "4px 0" }}>
                    {formatPrice(row.price)}
                  </p>
                  <p className="meta">
                    {row.city} · {formatCategoryDisplay(row.categoryKey)}
                  </p>
                  <p className="meta">
                    Satıcı: {row.sellerName}
                    {row.sellerEmail ? ` · ${row.sellerEmail}` : ""}
                  </p>
                  <p className="meta">
                    Tarih:{" "}
                    {new Date(row.created_at).toLocaleString("tr-TR")}
                  </p>
                  {row.description && (
                    <p style={{ marginTop: 10, lineHeight: 1.5 }}>
                      {row.description.length > 400
                        ? `${row.description.slice(0, 400)}…`
                        : row.description}
                    </p>
                  )}
                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busyId !== null}
                      onClick={() => void setStatus(row.id, "active")}
                    >
                      {busyId === row.id ? "…" : "Yayına al"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={busyId !== null}
                      onClick={() => void setStatus(row.id, "rejected")}
                      style={{ borderColor: "#b91c1c", color: "#b91c1c" }}
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="footer">
        <Link href="/">Ana sayfa</Link>
      </p>
    </main>
  );
}
