"use client";

import { useCallback, useEffect, useState } from "react";

type CountsPayload = {
  total: number;
  blocked: number;
  panel_access: number;
  active_members: number;
};

type Props = {
  enabled: boolean;
  getAuthHeaders: () => Promise<HeadersInit | null>;
  onOpenUsers: () => void;
};

export default function AdminMemberStatsCard({
  enabled,
  getAuthHeaders,
  onOpenUsers
}: Props) {
  const [counts, setCounts] = useState<CountsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const h = await getAuthHeaders();
    if (!h) return;
    setLoading(true);
    const res = await fetch("/api/admin/users/counts", { headers: h });
    const json = (await res.json()) as CountsPayload & { error?: string };
    setLoading(false);
    if (!res.ok) {
      setCounts(null);
      setError(json.error ?? "Sayılar alınamadı.");
      return;
    }
    setCounts({
      total: json.total ?? 0,
      blocked: json.blocked ?? 0,
      panel_access: json.panel_access ?? 0,
      active_members: json.active_members ?? 0
    });
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  if (!enabled) return null;

  return (
    <section
      className="admin-listing-stats admin-listing-stats--members"
      aria-label="Üye sayıları özeti"
    >
      <div className="admin-listing-stats__shell">
        <div className="admin-listing-stats__head">
          <h2 className="admin-listing-stats__title">Üye sayacı</h2>
          <button
            type="button"
            className="admin-listing-stats__refresh btn btn-outline"
            disabled={loading}
            onClick={() => void load()}
          >
            {loading ? "…" : "Yenile"}
          </button>
        </div>
        {error ? (
          <p className="admin-listing-stats__error">{error}</p>
        ) : counts ? (
          <div className="admin-listing-stats__grid admin-listing-stats__grid--members">
            <button
              type="button"
              className="admin-listing-stats__tile admin-listing-stats__tile--total admin-listing-stats__tile--members-total"
              onClick={() => onOpenUsers()}
            >
              <span className="admin-listing-stats__label">Kayıtlı üye</span>
              <span className="admin-listing-stats__value">{counts.total}</span>
            </button>
            <button
              type="button"
              className="admin-listing-stats__tile admin-listing-stats__tile--member-active"
              onClick={() => onOpenUsers()}
            >
              <span className="admin-listing-stats__label">Engelli değil</span>
              <span className="admin-listing-stats__value">{counts.active_members}</span>
            </button>
            <button
              type="button"
              className="admin-listing-stats__tile admin-listing-stats__tile--member-blocked"
              onClick={() => onOpenUsers()}
            >
              <span className="admin-listing-stats__label">Engelli hesap</span>
              <span className="admin-listing-stats__value">{counts.blocked}</span>
            </button>
            <button
              type="button"
              className="admin-listing-stats__tile admin-listing-stats__tile--member-staff"
              onClick={() => onOpenUsers()}
            >
              <span className="admin-listing-stats__label">Mod / Admin</span>
              <span className="admin-listing-stats__value">{counts.panel_access}</span>
            </button>
          </div>
        ) : loading ? (
          <p className="meta" style={{ margin: 0 }}>
            Yükleniyor…
          </p>
        ) : null}
        <p className="admin-listing-stats__hint meta">
          Kutuya tıklayınca{" "}
          <strong>Kullanıcı yönetimi</strong> bölümü açılır.
        </p>
      </div>
    </section>
  );
}
