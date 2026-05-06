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
import { scanListingModerationRisk } from "@/lib/moderation-risk";
import { listingDetailHref } from "@/lib/listing-code";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

import AdminListingReportsSection from "./AdminListingReportsSection";
import AdminSiteListingDurationSection from "./AdminSiteListingDurationSection";
import AdminUserManagementSection from "./AdminUserManagementSection";

type ListingFilter = "all" | "pending" | "active" | "sold" | "rejected";

type RiskListingFilter = "all" | "risk";

/** Sol menü bölümleri */
type AdminPanelSection = "settings" | "listings" | "reports" | "users";

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
  promoPremium?: boolean;
  promoShowcase?: boolean;
  promoHighlight?: boolean;
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
  /** Yönetim paneli erişimi (ADMIN_EMAILS veya moderator/admin rolü) */
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
  const [riskFilter, setRiskFilter] = useState<RiskListingFilter>("all");
  const [panelSection, setPanelSection] =
    useState<AdminPanelSection>("listings");
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

  const riskByRowId = useMemo(() => {
    const m = new Map<
      string,
      ReturnType<typeof scanListingModerationRisk>
    >();
    for (const r of rows) {
      m.set(
        r.id,
        scanListingModerationRisk({
          title: r.title,
          description: r.description,
          categoryKey: r.categoryKey
        })
      );
    }
    return m;
  }, [rows]);

  const riskyRowCount = useMemo(() => {
    let n = 0;
    for (const r of rows) {
      if (riskByRowId.get(r.id)?.risky) n += 1;
    }
    return n;
  }, [rows, riskByRowId]);

  const displayRows = useMemo(() => {
    let list = filterRows(rows, searchQuery);
    if (riskFilter === "risk") {
      list = list.filter((r) => riskByRowId.get(r.id)?.risky);
    }
    return sortRows(list, sortKey);
  }, [rows, searchQuery, sortKey, riskFilter, riskByRowId]);

  const listingsEmptyMessage = useMemo(() => {
    if (rows.length === 0 || displayRows.length > 0) return null;
    const hasSearch = Boolean(searchQuery.trim());
    if (riskFilter === "risk" && hasSearch) {
      return "Arama ve yasaklı ürün uyarısı filtresiyle eşleşen kayıt yok.";
    }
    if (riskFilter === "risk") {
      return "Bu yüklemede otomatik uyarı tetikleyen ilan yok.";
    }
    if (hasSearch) return "Arama ile eşleşen kayıt yok.";
    return "Kayıt yok.";
  }, [rows.length, displayRows.length, searchQuery, riskFilter]);

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
    if (!moderationStaff || !checkedStaff || panelSection !== "listings") {
      return;
    }
    void loadListings(filter);
  }, [filter, moderationStaff, checkedStaff, panelSection, loadListings]);

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

  async function patchListingPromo(
    id: string,
    patch: {
      promo_premium?: boolean;
      promo_showcase?: boolean;
      promo_highlight?: boolean;
    }
  ) {
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
      body: JSON.stringify(patch)
    });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setLoadError(json.error ?? "Güncellenemedi.");
      void loadListings(filter);
      return;
    }
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          ...(patch.promo_premium !== undefined && {
            promoPremium: patch.promo_premium
          }),
          ...(patch.promo_showcase !== undefined && {
            promoShowcase: patch.promo_showcase
          }),
          ...(patch.promo_highlight !== undefined && {
            promoHighlight: patch.promo_highlight
          })
        };
      })
    );
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
        <h1 className="section-title">Yönetim paneli</h1>
        <p className="notice">Supabase yapılandırması yok.</p>
      </div>
    );
  }

  if (!moderationStaff) {
    return (
      <div className="account-page">
        <h1 className="section-title">Yönetim paneli</h1>
        <section className="panel">
          <p>Bu sayfaya yalnızca yönetim paneli erişimi olanlar girebilir.</p>
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
      <h1 className="section-title">Yönetim paneli</h1>
      <p className="meta" style={{ marginTop: -6, marginBottom: 18 }}>
        Sol menüden bölüm seçin: site ayarları, ilanlar, şikayetler ve kullanıcı yönetimi.
      </p>

      <div className="admin-panel-layout">
        <nav
          className="admin-panel-nav"
          aria-label="Yönetim paneli bölümleri"
        >
          <p className="admin-panel-nav__title">Bölümler</p>
          <ul className="admin-panel-nav__list">
            <li className="admin-panel-nav__item">
              <button
                type="button"
                className={
                  panelSection === "settings"
                    ? "admin-panel-nav__btn admin-panel-nav__btn--stack admin-panel-nav__btn--active"
                    : "admin-panel-nav__btn admin-panel-nav__btn--stack"
                }
                aria-current={panelSection === "settings" ? "page" : undefined}
                disabled={busyId !== null}
                onClick={() => setPanelSection("settings")}
              >
                <span>
                  Site ayarları
                  <span className="admin-panel-nav__hint">
                    İlan yayın süresi
                  </span>
                </span>
              </button>
            </li>
            <li className="admin-panel-nav__item">
              <button
                type="button"
                className={
                  panelSection === "listings"
                    ? "admin-panel-nav__btn admin-panel-nav__btn--active"
                    : "admin-panel-nav__btn"
                }
                aria-current={panelSection === "listings" ? "page" : undefined}
                disabled={busyId !== null}
                onClick={() => setPanelSection("listings")}
              >
                İlanlar
              </button>
            </li>
            <li className="admin-panel-nav__item">
              <button
                type="button"
                className={
                  panelSection === "reports"
                    ? "admin-panel-nav__btn admin-panel-nav__btn--active"
                    : "admin-panel-nav__btn"
                }
                aria-current={panelSection === "reports" ? "page" : undefined}
                disabled={busyId !== null}
                onClick={() => {
                  setPanelSection("reports");
                  void refreshReportOpenBadge();
                }}
              >
                <span>Şikayetler</span>
                {reportOpenCount !== null && reportOpenCount > 0 ? (
                  <span className="admin-panel-nav__badge" aria-label={`Açık şikayet: ${reportOpenCount}`}>
                    {reportOpenCount}
                  </span>
                ) : null}
              </button>
            </li>
            <li className="admin-panel-nav__item">
              <button
                type="button"
                className={
                  panelSection === "users"
                    ? "admin-panel-nav__btn admin-panel-nav__btn--active"
                    : "admin-panel-nav__btn"
                }
                aria-current={panelSection === "users" ? "page" : undefined}
                disabled={busyId !== null}
                onClick={() => setPanelSection("users")}
              >
                Kullanıcı yönetimi
              </button>
            </li>
          </ul>
        </nav>

        <div className="admin-panel-content">
          {panelSection === "settings" ? (
            <AdminSiteListingDurationSection
              enabled={moderationStaff && checkedStaff}
              getAuthHeaders={authHeaders}
            />
          ) : null}

          {panelSection === "listings" ? (
        <>
          <p className="meta" style={{ marginBottom: 16 }}>
            Durum, sıralama ve arama ile daraltın. Her ilanda{" "}
            <strong>Vitrin</strong>, <strong>Premium</strong> ve <strong>Öne çıkan</strong>{" "}
            kutuları ana sayfa / ilan listesi önceliği ve sitede rozet için kullanılır
            (öncelik: vitrin &gt; premium &gt; öne çıkan, sonra yeniden önce). &quot;Yasaklı
            ürün uyarısı&quot; filtresi başlık + açıklamada yasaklı ürün/hizmete işaret eden
            kalıpları otomatik arar (hukuki karar değildir, önceliklendirme içindir). Açıklama
            metinleri satırda gösterilmez.
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
          <div className="admin-moderation-toolbar__field">
            <label htmlFor="admin-mod-risk">Otomatik uyarı</label>
            <select
              id="admin-mod-risk"
              value={riskFilter}
              disabled={busyId !== null}
              onChange={(e) =>
                setRiskFilter(e.target.value as RiskListingFilter)
              }
            >
              <option value="all">Tüm ilanlar</option>
              <option value="risk">
                Yasaklı ürün uyarısı ({riskyRowCount} bu listede)
              </option>
            </select>
          </div>
        </div>

        <p className="meta" style={{ margin: "10px 14px", fontSize: 13 }}>
          {displayRows.length} kayıt
          {filter !== "all" ? ` · ${FILTER_LABEL[filter]}` : ""}
          {riskFilter === "risk" ? ` · yalnızca uyarı eşleşenler` : ""}
          {searchQuery.trim() ? ` · arama filtresi aktif` : ""}
          {riskFilter === "all" && riskyRowCount > 0
            ? ` · ${riskyRowCount} uyarı eşleşmesi`
            : ""}
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
              {listingsEmptyMessage ?? "Kayıt yok."}
            </p>
          </div>
        ) : (
          <ul className="admin-moderation-compact">
            {displayRows.map((row) => {
              const risk = riskByRowId.get(row.id);
              return (
              <li
                key={row.id}
                className={
                  risk?.risky
                    ? "admin-moderation-compact__row admin-moderation-compact__row--risky"
                    : "admin-moderation-compact__row"
                }
              >
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
                  <p className="admin-moderation-compact__title">
                    <span className="admin-moderation-compact__title-text">
                      {row.title}
                    </span>
                    {risk?.risky ? (
                      <span
                        className="admin-moderation-compact__risk-badge"
                        title={risk.reasons.join(" · ")}
                      >
                        Uyarı
                      </span>
                    ) : null}
                  </p>
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
                  <div
                    className="admin-mod-promo-row"
                    aria-label="Promosyon — vitrin, premium, öne çıkarma"
                  >
                    <label className="admin-mod-promo-row__item">
                      <input
                        type="checkbox"
                        checked={Boolean(row.promoShowcase)}
                        disabled={busyId !== null}
                        onChange={(e) =>
                          void patchListingPromo(row.id, {
                            promo_showcase: e.target.checked
                          })
                        }
                      />
                      Vitrin
                    </label>
                    <label className="admin-mod-promo-row__item">
                      <input
                        type="checkbox"
                        checked={Boolean(row.promoPremium)}
                        disabled={busyId !== null}
                        onChange={(e) =>
                          void patchListingPromo(row.id, {
                            promo_premium: e.target.checked
                          })
                        }
                      />
                      Premium
                    </label>
                    <label className="admin-mod-promo-row__item">
                      <input
                        type="checkbox"
                        checked={Boolean(row.promoHighlight)}
                        disabled={busyId !== null}
                        onChange={(e) =>
                          void patchListingPromo(row.id, {
                            promo_highlight: e.target.checked
                          })
                        }
                      />
                      Öne çıkan
                    </label>
                  </div>
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
              );
            })}
          </ul>
        )}
          </section>
        </>
          ) : null}

          {panelSection === "reports" ? (
            <AdminListingReportsSection
              enabled={moderationStaff && checkedStaff}
              getAuthHeaders={authHeaders}
              onReportsUpdated={handleReportsUpdated}
            />
          ) : null}

          {panelSection === "users" ? (
            <AdminUserManagementSection
              enabled={moderationStaff && checkedStaff}
              adminPower={fullAdminPower}
              getAuthHeaders={authHeaders}
            />
          ) : null}
        </div>
      </div>

      <p className="meta" style={{ marginTop: 20 }}>
        <Link href="/">Ana sayfa</Link>
      </p>
    </div>
  );
}
