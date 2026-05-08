"use client";

import { useCallback, useEffect, useState } from "react";

export type ListingStatusFilter =
  | "all"
  | "pending"
  | "active"
  | "sold"
  | "rejected";

type CountsPayload = {
  total: number;
  pending: number;
  active: number;
  sold: number;
  rejected: number;
};

type Props = {
  enabled: boolean;
  getAuthHeaders: () => Promise<HeadersInit | null>;
  onOpenListings: (filter: ListingStatusFilter) => void;
};

export default function AdminListingStatsCard({
  enabled,
  getAuthHeaders,
  onOpenListings
}: Props) {
  const [counts, setCounts] = useState<CountsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const h = await getAuthHeaders();
    if (!h) return;
    setLoading(true);
    const res = await fetch("/api/admin/listings/counts", { headers: h });
    const json = (await res.json()) as CountsPayload & { error?: string };
    setLoading(false);
    if (!res.ok) {
      setCounts(null);
      setError(json.error ?? "Sayılar alınamadı.");
      return;
    }
    setCounts({
      total: json.total ?? 0,
      pending: json.pending ?? 0,
      active: json.active ?? 0,
      sold: json.sold ?? 0,
      rejected: json.rejected ?? 0
    });
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  if (!enabled) return null;

  return (
    <section className="admin-listing-stats" aria-label="İlan sayıları özeti">
      <div className="admin-listing-stats__shell">
        <div className="admin-listing-stats__head">
          <h2 className="admin-listing-stats__title">İlan sayacı</h2>
          <button
            type="button"
            className="admin-listing-stats__refresh btn btn-nakits-outline"
            disabled={loading}
            onClick={() => void load()}
          >
            {loading ? "…" : "Yenile"}
          </button>
        </div>
        {error ? (
          <p className="admin-listing-stats__error">{error}</p>
        ) : counts ? (
          <div className="admin-listing-stats__grid">
            <button
              type="button"
              className="admin-listing-stats__tile admin-listing-stats__tile--total"
              onClick={() => onOpenListings("all")}
            >
              <span className="admin-listing-stats__label">Toplam ilan</span>
              <span className="admin-listing-stats__value">{counts.total}</span>
            </button>
            <button
              type="button"
              className="admin-listing-stats__tile admin-listing-stats__tile--pending"
              onClick={() => onOpenListings("pending")}
            >
              <span className="admin-listing-stats__label">Onay bekleyen</span>
              <span className="admin-listing-stats__value">{counts.pending}</span>
            </button>
            <button
              type="button"
              className="admin-listing-stats__tile admin-listing-stats__tile--active"
              onClick={() => onOpenListings("active")}
            >
              <span className="admin-listing-stats__label">Yayında</span>
              <span className="admin-listing-stats__value">{counts.active}</span>
            </button>
            <button
              type="button"
              className="admin-listing-stats__tile admin-listing-stats__tile--sold"
              onClick={() => onOpenListings("sold")}
            >
              <span className="admin-listing-stats__label">Satıldı</span>
              <span className="admin-listing-stats__value">{counts.sold}</span>
            </button>
            <button
              type="button"
              className="admin-listing-stats__tile admin-listing-stats__tile--rejected"
              onClick={() => onOpenListings("rejected")}
            >
              <span className="admin-listing-stats__label">Reddedilen</span>
              <span className="admin-listing-stats__value">{counts.rejected}</span>
            </button>
          </div>
        ) : loading ? (
          <p className="meta" style={{ margin: 0 }}>
            Yükleniyor…
          </p>
        ) : null}
        <p className="admin-listing-stats__hint meta">
          Kutuya tıklayınca ilgili filtre ile İlanlar bölümü açılır.
        </p>
      </div>
    </section>
  );
}
