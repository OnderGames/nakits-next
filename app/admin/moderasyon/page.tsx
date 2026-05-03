"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { formatPrice } from "@/lib/categories";
import { listingDetailHref } from "@/lib/listing-code";
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

const STATUS_SHORT: Record<string, string> = {
  pending: "Onay bekliyor",
  active: "Yayında",
  sold: "Satıldı",
  rejected: "Reddedilen"
};

type SortOption =
  | "created_desc"
  | "created_asc"
  | "expires_asc"
  | "expires_desc";

const SORT_LABEL: Record<SortOption, string> = {
  created_desc: "Eklenme (önce yeniler)",
  created_asc: "Eklenme (önce eskiler)",
  expires_asc: "Bitiş (önce yakın tarih)",
  expires_desc: "Bitiş (önce uzak tarih)"
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
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=200&q=72";

function formatDateTimeCompact(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function rowThumb(row: AdminListingRow): string {
  const urls = row.imageUrls?.filter((u) => u && String(u).trim()) ?? [];
  const u =
    (row.imageUrl && row.imageUrl.trim()) || urls[0] || LISTING_IMAGE_FALLBACK;
  return u;
}

function sortRows(list: AdminListingRow[], sort: SortOption): AdminListingRow[] {
  const next = [...list];
  const created = (r: AdminListingRow) => new Date(r.created_at).getTime();
  const expireSoonFirst = (r: AdminListingRow) => {
    if (!r.expires_at) return Number.MAX_SAFE_INTEGER;
    const t = new Date(r.expires_at).getTime();
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
  };
  const expireFarFirst = (r: AdminListingRow) => {
    if (!r.expires_at) return 0;
    const t = new Date(r.expires_at).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  switch (sort) {
    case "created_desc":
      return next.sort((a, b) => created(b) - created(a));
    case "created_asc":
      return next.sort((a, b) => created(a) - created(b));
    case "expires_asc":
      return next.sort((a, b) => expireSoonFirst(a) - expireSoonFirst(b));
    case "expires_desc":
      return next.sort((a, b) => expireFarFirst(b) - expireFarFirst(a));
    default:
      return next;
  }
}

function filterRows(list: AdminListingRow[], query: string): AdminListingRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((r) => {
    const code = (r.listingCode ?? "").toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      code.includes(q) ||
      r.sellerEmail.toLowerCase().includes(q) ||
      r.sellerName.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q)
    );
  });
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
  const [sortKey, setSortKey] = useState<SortOption>("created_desc");
  const [searchQuery, setSearchQuery] = useState("");

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

  const displayRows = useMemo(
    () => sortRows(filterRows(rows, searchQuery), sortKey),
    [rows, searchQuery, sortKey]
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
      <div className="account-page">
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <div className="account-page">
        <h1 className="section-title">Moderasyon</h1>
        <p className="notice">Supabase yapılandırması yok.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="account-page">
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
      </div>
    );
  }

  return (
    <div className="account-page">
      <h1 className="section-title">İlan moderasyonu</h1>
      <p className="meta" style={{ marginBottom: 16 }}>
        Durum filtresi ve sıralama ile listeyi daraltın; açıklama metinleri
        burada gösterilmez (daha az yer kaplar).
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

      <section className="panel admin-moderation-list-panel">
        <div className="admin-moderation-toolbar">
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
        <div className="admin-moderation-toolbar admin-moderation-toolbar--secondary">
          <div className="admin-moderation-toolbar__field">
            <label htmlFor="admin-mod-sort">Sıralama</label>
            <select
              id="admin-mod-sort"
              value={sortKey}
              disabled={busyId !== null}
              onChange={(e) =>
                setSortKey(e.target.value as SortOption)
              }
            >
              {(Object.keys(SORT_LABEL) as SortOption[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABEL[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-moderation-toolbar__field">
            <label htmlFor="admin-mod-search">Ara</label>
            <input
              id="admin-mod-search"
              type="search"
              placeholder="Başlık, ilan no, e-posta, şehir…"
              autoComplete="off"
              disabled={busyId !== null}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <p className="meta" style={{ margin: "10px 14px", fontSize: 13 }}>
          {displayRows.length} kayıt
          {filter !== "all" ? ` · ${FILTER_LABEL[filter]}` : ""}
          {searchQuery.trim() ? ` · arama filtresi aktif` : ""}
          {displayRows.length !== rows.length ? ` (${rows.length} yüklendi)` : ""}
        </p>

        {rows.length === 0 ? (
          <div className="account-empty-panel" style={{ padding: "0 14px 16px" }}>
            <p className="account-empty-panel__text" style={{ margin: 0 }}>
              Bu filtrede ilan yok.
            </p>
          </div>
        ) : displayRows.length === 0 ? (
          <div className="account-empty-panel" style={{ padding: "0 14px 16px" }}>
            <p className="account-empty-panel__text" style={{ margin: 0 }}>
              Arama ile eşleşen kayıt yok.
            </p>
          </div>
        ) : (
          <ul className="admin-moderation-compact">
            {displayRows.map((row) => (
              <li key={row.id} className="admin-moderation-compact__row">
                <div className="admin-moderation-compact__thumb">
                  <Image
                    src={rowThumb(row)}
                    alt=""
                    width={52}
                    height={52}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    unoptimized
                  />
                </div>
                <div className="admin-moderation-compact__body">
                  <p className="admin-moderation-compact__title">{row.title}</p>
                  <p className="admin-moderation-compact__meta">
                    <span
                      className="admin-moderation-compact__status"
                      data-status={row.status}
                    >
                      {STATUS_SHORT[row.status] ?? row.status}
                    </span>
                    <span>{formatPrice(row.price)}</span>
                    <span>{row.city}</span>
                    {row.listingCode ? (
                      <span>İlan no: {row.listingCode}</span>
                    ) : null}
                    <span title="Eklenme">
                      {formatDateTimeCompact(row.created_at)}
                    </span>
                    {row.expires_at ? (
                      <span title="Yayından düşeceği zaman">
                        Bitiş: {formatDateTimeCompact(row.expires_at)}
                      </span>
                    ) : (
                      <span>Bitiş: —</span>
                    )}
                    {row.sellerEmail ? (
                      <span title="Satıcı">
                        {row.sellerEmail}
                      </span>
                    ) : (
                      <span>{row.sellerName}</span>
                    )}
                  </p>
                </div>
                <div className="admin-moderation-compact__actions">
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
                    {busyId === row.id ? "…" : "Sil"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="meta" style={{ marginTop: 20 }}>
        <Link href="/">Ana sayfa</Link>
      </p>
    </div>
  );
}
