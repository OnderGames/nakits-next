"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatCategoryDisplay, formatPrice } from "@/lib/categories";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

type ListingFilter = "all" | "pending" | "active" | "sold" | "rejected";

const FILTER_LABEL: Record<ListingFilter, string> = {
  all: "Tümü",
  pending: "Onay bekleyen",
  active: "Yayında",
  sold: "Satıldı",
  rejected: "Reddedilen"
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Onay bekliyor",
  active: "Yayında",
  sold: "Satıldı",
  rejected: "Yayınlanmadı"
};

type AdminListingRow = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  price: number;
  created_at: string;
  status: string;
  categoryKey: string;
  imageUrl: string | null;
  sellerName: string;
  sellerEmail: string;
};

export default function AdminModerationPage() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [filter, setFilter] = useState<ListingFilter>("all");
  const [rows, setRows] = useState<AdminListingRow[]>([]);
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

  const loadListings = useCallback(
    async (status: ListingFilter) => {
      setLoadError("");
      const h = await authHeaders();
      if (!h) {
        setRows([]);
        return;
      }
      const res = await fetch(
        `/api/admin/listings?status=${encodeURIComponent(status)}`,
        { headers: h }
      );
      const json = (await res.json()) as {
        listings?: AdminListingRow[];
        error?: string;
      };
      if (!res.ok) {
        setLoadError(json.error ?? "Liste alınamadı.");
        setRows([]);
        return;
      }
      setRows(json.listings ?? []);
    },
    [authHeaders]
  );

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
        })
        .catch(() => {
          setIsAdmin(false);
          setCheckedAdmin(true);
        });
    });
  }, []);

  useEffect(() => {
    if (!isAdmin || !checkedAdmin) return;
    void loadListings(filter);
  }, [filter, isAdmin, checkedAdmin, loadListings]);

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

  async function deleteListing(id: string, title: string) {
    if (
      !window.confirm(
        `«${title.slice(0, 80)}${title.length > 80 ? "…" : ""}» ilanını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
      )
    ) {
      return;
    }
    setBusyId(id);
    setLoadError("");
    const h = await authHeaders();
    if (!h) {
      setBusyId(null);
      return;
    }
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "DELETE",
      headers: h
    });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setLoadError(json.error ?? "Silinemedi.");
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
          <Link
            className="btn btn-primary"
            style={{ display: "inline-block", marginTop: 14 }}
            href="/login?next=/admin/moderasyon"
          >
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
        Tüm ilanları filtreleyebilir, onay bekleyenleri yayına alabilir veya
        reddedebilir, istediğiniz ilanı kalıcı olarak silebilirsiniz.
      </p>

      {loadError && (
        <p
          className="notice"
          style={{
            marginBottom: 14,
            background: "#fee2e2",
            borderColor: "#fecaca",
            color: "#7f1d1d"
          }}
        >
          {loadError}
        </p>
      )}

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center"
        }}
      >
        {(Object.keys(FILTER_LABEL) as ListingFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            className={filter === key ? "btn btn-primary" : "btn btn-outline"}
            disabled={busyId !== null}
            onClick={() => setFilter(key)}
          >
            {FILTER_LABEL[key]}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => void loadListings(filter)}
          disabled={busyId !== null}
        >
          Listeyi yenile
        </button>
      </div>

      <p className="meta" style={{ marginBottom: 12 }}>
        {rows.length} ilan
        {filter !== "all" ? ` (${FILTER_LABEL[filter]})` : ""}
      </p>

      {rows.length === 0 ? (
        <section className="panel">
          <p>Bu filtrede ilan yok.</p>
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
                  <p style={{ margin: "0 0 6px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          row.status === "active"
                            ? "#dcfce7"
                            : row.status === "pending"
                              ? "#fef9c3"
                              : row.status === "rejected"
                                ? "#fee2e2"
                                : "#e5e7eb",
                        color: "#111"
                      }}
                    >
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </p>
                  <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>
                    {row.title}
                  </h2>
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
                      gap: 10,
                      alignItems: "center"
                    }}
                  >
                    {row.status === "active" && (
                      <Link
                        className="btn btn-outline"
                        href={`/listings/${row.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Sitede aç
                      </Link>
                    )}
                    {row.status === "pending" && (
                      <>
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
                      </>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={busyId !== null}
                      onClick={() => void deleteListing(row.id, row.title)}
                      style={{
                        borderColor: "#991b1b",
                        color: "#991b1b",
                        fontWeight: 600
                      }}
                    >
                      {busyId === row.id ? "…" : "İlanı sil"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="meta" style={{ marginTop: 20 }}>
        <Link href="/">Ana sayfa</Link>
      </p>
    </main>
  );
}
