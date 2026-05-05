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
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

import AdminListingReportsSection from "./AdminListingReportsSection";
import AdminUserManagementSection from "./AdminUserManagementSection";

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
  /** Moderasyon paneli (ADMIN_EMAILS veya moderator/admin rolü) */
  const [moderationStaff, setModerationStaff] = useState(false);
  /** Tam yönetici: kullanıcı silme + rol yükseltme */
  const [fullAdminPower, setFullAdminPower] = useState(false);
  const [checkedStaff, setCheckedStaff] = useState(false);
  const [filter, setFilter] = useState<ListingFilter>("all");
  const [rows, setRows] = useState<AdminListingRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortOption>("created_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [modTab, setModTab] = useState<"listings" | "reports">("listings");
  const [reportOpenCount, setReportOpenCount] = useState<number | null>(null);

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
      setCheckedStaff(true);
      setModerationStaff(false);
      setFullAdminPower(false);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setReady(true);
      setCheckedStaff(true);
      setModerationStaff(false);
      setFullAdminPower(false);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setReady(true);
      const token = data.session?.access_token;
      if (!token) {
        setCheckedStaff(true);
        setModerationStaff(false);
        setFullAdminPower(false);
        return;
      }
      void fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((r) => r.json())
        .then((j: { moderation?: boolean; admin?: boolean; power?: boolean }) => {
          setModerationStaff(Boolean(j.moderation ?? j.admin));
          setFullAdminPower(Boolean(j.power));
          setCheckedStaff(true);
        })
        .catch(() => {
          setModerationStaff(false);
          setFullAdminPower(false);
          setCheckedStaff(true);
        });
    });
  }, []);

  const refreshReportOpenBadge = useCallback(async () => {
    const h = await authHeaders();
    if (!h) return;
    const res = await fetch("/api/admin/listing-reports?status=open", {
      headers: h
    });
    const j = (await res.json()) as { openCount?: number };
    if (typeof j.openCount === "number") {
      setReportOpenCount(j.openCount);
    }
  }, [authHeaders]);

  const handleReportsUpdated = useCallback(() => {
    void refreshReportOpenBadge();
  }, [refreshReportOpenBadge]);

  useEffect(() => {
    if (!moderationStaff || !checkedStaff) return;
    void refreshReportOpenBadge();
  }, [moderationStaff, checkedStaff, refreshReportOpenBadge]);

  useEffect(() => {
    if (!moderationStaff || !checkedStaff || modTab !== "listings") return;
    void loadListings(filter);
  }, [filter, moderationStaff, checkedStaff, modTab, loadListings]);

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

  if (!ready || !checkedStaff) {
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

  if (!moderationStaff) {
    return (
      <div className="account-page">
        <h1 className="section-title">Moderasyon</h1>
        <section className="panel">
          <p>Bu sayfaya yalnızca moderasyon yetkisi olanlar erişebilir.</p>
          <p className="meta" style={{ marginTop: 10 }}>
            Giriş yapmış olmalı ve{" "}
            <code style={{ fontSize: 13 }}>ADMIN_EMAILS</code> ile tanımlı olmalı{" "}
            <strong>veya</strong> veritabanında{" "}
            <code style={{ fontSize: 13 }}>profile_staff</code> içinde moderator / admin rolü tanımlı
            olmalısınız (<code style={{ fontSize: 13 }}>sql/migration_profile_staff.sql</code> ilk
            kurulum için).
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
      <h1 className="section-title">Moderasyon</h1>

      <div className="admin-mod-main-tabs" role="tablist" aria-label="Moderasyon bölümleri">
        <button
          type="button"
          role="tab"
          aria-selected={modTab === "listings"}
          className={modTab === "listings" ? "btn btn-primary" : "btn btn-outline"}
          disabled={busyId !== null}
          onClick={() => setModTab("listings")}
        >
          İlanlar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modTab === "reports"}
          className={modTab === "reports" ? "btn btn-primary" : "btn btn-outline"}
          disabled={busyId !== null}
          onClick={() => {
            setModTab("reports");
            void refreshReportOpenBadge();
          }}
        >
          Şikayetler
          {reportOpenCount !== null && reportOpenCount > 0 ? (
            <span className="admin-mod-main-tabs__badge">{reportOpenCount}</span>
          ) : null}
        </button>
      </div>

      {modTab === "listings" ? (
        <>
          <p className="meta" style={{ marginBottom: 16 }}>
            Durum filtresi ve sıralama ile listeyi daraltın; açıklama metinleri burada
            gösterilmez (daha az yer kaplar).
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
        </>
      ) : (
        <AdminListingReportsSection
          enabled={moderationStaff && checkedStaff}
          getAuthHeaders={authHeaders}
          onReportsUpdated={handleReportsUpdated}
        />
      )}

      <AdminUserManagementSection
        enabled={moderationStaff && checkedStaff}
        adminPower={fullAdminPower}
        getAuthHeaders={authHeaders}
      />

      <p className="meta" style={{ marginTop: 20 }}>
        <Link href="/">Ana sayfa</Link>
      </p>
    </div>
  );
}
