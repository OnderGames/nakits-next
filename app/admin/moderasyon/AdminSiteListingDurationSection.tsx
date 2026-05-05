"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LISTING_DURATION_DEFAULT_DAYS,
  LISTING_DURATION_MAX_DAYS,
  LISTING_DURATION_MIN_DAYS
} from "@/lib/site-settings";

export default function AdminSiteListingDurationSection({
  enabled,
  getAuthHeaders
}: {
  enabled: boolean;
  getAuthHeaders: () => Promise<HeadersInit | null>;
}) {
  const [days, setDays] = useState(LISTING_DURATION_DEFAULT_DAYS);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    setSaveOk("");
    const h = await getAuthHeaders();
    if (!h) {
      setLoadError("Oturum yok.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/site-settings", { headers: h });
    const json = (await res.json()) as {
      listing_duration_days?: number;
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setLoadError(
        json.error ??
          "Ayar okunamadı. Supabase’de `sql/migration_site_settings_listing_duration.sql` çalıştırılmış mı kontrol edin."
      );
      return;
    }
    if (typeof json.listing_duration_days === "number") {
      setDays(json.listing_duration_days);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  async function save() {
    setSaveError("");
    setSaveOk("");
    const h = await getAuthHeaders();
    if (!h) {
      setSaveError("Oturum yok.");
      return;
    }
    const n = Math.round(Number(days));
    if (
      !Number.isFinite(n) ||
      n < LISTING_DURATION_MIN_DAYS ||
      n > LISTING_DURATION_MAX_DAYS
    ) {
      setSaveError(
        `Geçerli aralık: ${LISTING_DURATION_MIN_DAYS}–${LISTING_DURATION_MAX_DAYS} gün.`
      );
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ listing_duration_days: n })
    });
    const json = (await res.json()) as {
      listing_duration_days?: number;
      error?: string;
    };
    setSaving(false);
    if (!res.ok) {
      setSaveError(json.error ?? "Kaydedilemedi.");
      return;
    }
    if (typeof json.listing_duration_days === "number") {
      setDays(json.listing_duration_days);
    }
    setSaveOk("Kaydedildi.");
  }

  if (!enabled) return null;

  return (
    <section
      className="panel admin-site-listing-duration"
      style={{ marginBottom: 20, padding: "14px 16px" }}
    >
      <h2
        className="section-title"
        style={{ fontSize: "1.05rem", marginBottom: 6 }}
      >
        İlan yayın süresi
      </h2>
      <p className="meta" style={{ marginBottom: 12, maxWidth: 720 }}>
        Yeni ilanlar ve «Yayına al» ile onaylananlar için bitiş tarihi bu gün sayısına
        göre hesaplanır ({LISTING_DURATION_MIN_DAYS}–{LISTING_DURATION_MAX_DAYS}{" "}
        gün). Zaten yayındaki ilanların süresi otomatik uzamaz.
      </p>
      {loadError && (
        <p
          className="notice"
          style={{
            marginBottom: 10,
            background: "#fee2e2",
            borderColor: "#fecaca",
            color: "#7f1d1d"
          }}
        >
          {loadError}
        </p>
      )}
      {saveError && (
        <p
          className="notice"
          style={{
            marginBottom: 10,
            background: "#fee2e2",
            borderColor: "#fecaca",
            color: "#7f1d1d"
          }}
        >
          {saveError}
        </p>
      )}
      {saveOk && (
        <p className="notice" style={{ marginBottom: 10 }}>
          {saveOk}
        </p>
      )}
      <div
        className="admin-moderation-toolbar"
        style={{
          border: "none",
          padding: 0,
          background: "transparent",
          flexWrap: "wrap",
          alignItems: "flex-end"
        }}
      >
        <div className="admin-moderation-toolbar__field">
          <label htmlFor="admin-listing-duration-days">Yayımda kalma (gün)</label>
          <input
            id="admin-listing-duration-days"
            type="number"
            min={LISTING_DURATION_MIN_DAYS}
            max={LISTING_DURATION_MAX_DAYS}
            step={1}
            disabled={loading || saving}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ width: 100 }}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading || saving || Boolean(loadError)}
          onClick={() => void save()}
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={loading || saving}
          onClick={() => void load()}
        >
          Yenile
        </button>
      </div>
    </section>
  );
}
