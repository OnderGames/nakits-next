"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { listingDetailHref } from "@/lib/listing-code";
import { formatRelativeTimeTr } from "@/lib/listings-data";
import type { Listing } from "@/lib/types";
import {
  HOMEPAGE_THEME_LABEL,
  HOMEPAGE_THEMES,
  isHomepageTheme,
  type HomepageTheme
} from "@/lib/site-settings";
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

type AdminListingRow = {
  id: string;
  listingCode?: string;
  title: string;
  description: string | null;
  city: string;
  district?: string | null;
  price: number;
  created_at: string;
  expires_at?: string | null;
  status: string;
  categoryKey: string;
  imageUrl: string | null;
  imageUrls?: string[];
  sellerName: string;
  sellerEmail: string;
};

const LISTING_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=80";

function adminRowToListing(row: AdminListingRow): Listing {
  const urls = row.imageUrls?.filter(Boolean) ?? [];
  const cover =
    (row.imageUrl && row.imageUrl.trim()) ||
    urls[0] ||
    LISTING_IMAGE_FALLBACK;
  return {
    id: row.id,
    listingCode: row.listingCode?.trim() || undefined,
    title: row.title,
    categoryKey: row.categoryKey,
    city: row.city,
    district: row.district ?? null,
    price: row.price,
    image: cover,
    imageUrls: urls.length > 0 ? urls : undefined,
    seller: row.sellerName,
    createdAt: formatRelativeTimeTr(row.created_at),
    status: row.status as Listing["status"],
    expiresAt: row.expires_at ?? undefined,
    description: row.description ?? undefined
  };
}

export default function AdminModerationPage() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [filter, setFilter] = useState<ListingFilter>("all");
  const [rows, setRows] = useState<AdminListingRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [homepageTheme, setHomepageTheme] = useState<HomepageTheme>("v2");
  const [homepageThemeLoaded, setHomepageThemeLoaded] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMessage, setThemeMessage] = useState("");
  const [themeError, setThemeError] = useState("");

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

  useEffect(() => {
    if (!isAdmin || !checkedAdmin) return;
    let cancelled = false;
    void (async () => {
      setThemeError("");
      const h = await authHeaders();
      if (!h || cancelled) return;
      const res = await fetch("/api/admin/site-settings", { headers: h });
      const json = (await res.json()) as {
        homepage_theme?: HomepageTheme;
        error?: string;
      };
      if (cancelled) return;
      if (!res.ok) {
        setThemeError(json.error ?? "Anasayfa ayarı okunamadı.");
        setHomepageThemeLoaded(true);
        return;
      }
      if (isHomepageTheme(json.homepage_theme)) {
        setHomepageTheme(json.homepage_theme);
      }
      setHomepageThemeLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, checkedAdmin, authHeaders]);

  async function saveHomepageTheme() {
    setThemeMessage("");
    setThemeError("");
    const h = await authHeaders();
    if (!h) return;
    setThemeSaving(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ homepage_theme: homepageTheme })
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setThemeError(json.error ?? "Kaydedilemedi.");
        return;
      }
      setThemeMessage("Anasayfa görünümü güncellendi. Ana sayfayı yenileyin.");
    } finally {
      setThemeSaving(false);
    }
  }

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

      <section className="panel" style={{ marginBottom: 20 }}>
        <h2 className="section-title" style={{ marginTop: 0, fontSize: 18 }}>
          Anasayfa görünümü
        </h2>
        <p className="meta" style={{ marginBottom: 12 }}>
          Ziyaretçilerin gördüğü üst bölüm (kahraman alanı). Değişiklikten sonra
          anasayfayı yenileyin.
        </p>
        {themeError && (
          <p
            className="notice"
            style={{
              marginBottom: 12,
              background: "#fef3c7",
              borderColor: "#fcd34d",
              color: "#78350f"
            }}
          >
            {themeError}{" "}
            <code style={{ fontSize: 12 }}>sql/migration_site_settings.sql</code>{" "}
            ve gerekirse{" "}
            <code style={{ fontSize: 12 }}>
              sql/migration_site_settings_expand_themes.sql
            </code>{" "}
            dosyalarını Supabase SQL Editor&apos;da çalıştırdınız mı?
          </p>
        )}
        <label htmlFor="admin-homepage-theme" style={{ display: "block", marginBottom: 8 }}>
          Tema
        </label>
        <select
          id="admin-homepage-theme"
          value={homepageTheme}
          disabled={!homepageThemeLoaded || themeSaving}
          onChange={(e) =>
            setHomepageTheme(e.target.value as HomepageTheme)
          }
          style={{ maxWidth: 420, marginBottom: 12 }}
        >
          {HOMEPAGE_THEMES.map((id) => (
            <option key={id} value={id}>
              {HOMEPAGE_THEME_LABEL[id]}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!homepageThemeLoaded || themeSaving}
            onClick={() => void saveHomepageTheme()}
          >
            {themeSaving ? "Kaydediliyor…" : "Temayı kaydet"}
          </button>
          <Link className="meta" href="/" target="_blank" rel="noreferrer">
            Anasayfayı yeni sekmede aç →
          </Link>
        </div>
        {themeMessage && (
          <p className="notice" style={{ marginTop: 12, marginBottom: 0 }}>
            {themeMessage}
          </p>
        )}
      </section>

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
        <section className="cards cards--browse admin-moderation-browse">
          {rows.map((row) => (
            <div key={row.id} className="admin-moderation-item">
              <ListingCard
                listing={adminRowToListing(row)}
                hideFavorite
              />
              <div className="admin-moderation-item__footer">
                {row.sellerEmail ? (
                  <p className="meta" style={{ margin: "0 0 10px" }}>
                    Satıcı e-posta:{" "}
                    <strong>{row.sellerEmail}</strong>
                  </p>
                ) : null}
                {row.description ? (
                  <p
                    className="meta"
                    style={{
                      margin: "0 0 12px",
                      lineHeight: 1.45,
                      maxHeight: "4.35em",
                      overflow: "hidden"
                    }}
                  >
                    {row.description.length > 240
                      ? `${row.description.slice(0, 240)}…`
                      : row.description}
                  </p>
                ) : null}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    alignItems: "center"
                  }}
                >
                  {row.status === "active" && (
                    <Link
                      className="btn btn-outline"
                      href={listingDetailHref({
                        id: row.id,
                        listingCode: row.listingCode
                      })}
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
          ))}
        </section>
      )}

      <p className="meta" style={{ marginTop: 20 }}>
        <Link href="/">Ana sayfa</Link>
      </p>
    </main>
  );
}
