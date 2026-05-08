"use client";

import { BROADCAST_NOTIFICATION_MAX_LEN } from "@/lib/broadcast-notification";
import { useCallback, useEffect, useState } from "react";

export default function AdminBroadcastNotificationSection({
  enabled,
  adminPower,
  getAuthHeaders
}: {
  enabled: boolean;
  adminPower: boolean;
  getAuthHeaders: () => Promise<HeadersInit | null>;
}) {
  const [text, setText] = useState("");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

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
      broadcast_notification_body?: string;
      broadcast_notification_updated_at?: string | null;
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setLoadError(
        json.error ??
          "Okunamadı. Supabase’de `sql/migration_site_broadcast_notification.sql` çalıştırılmış mı?"
      );
      return;
    }
    setText(
      typeof json.broadcast_notification_body === "string"
        ? json.broadcast_notification_body
        : ""
    );
    setPublishedAt(
      json.broadcast_notification_updated_at != null
        ? String(json.broadcast_notification_updated_at)
        : null
    );
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  async function save() {
    if (!adminPower) return;
    setSaveError("");
    setSaveOk("");
    const t = text.trim();
    if (t.length > BROADCAST_NOTIFICATION_MAX_LEN) {
      setSaveError(`En fazla ${BROADCAST_NOTIFICATION_MAX_LEN} karakter.`);
      return;
    }
    const h = await getAuthHeaders();
    if (!h) {
      setSaveError("Oturum yok.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ broadcast_notification_body: t })
    });
    const json = (await res.json()) as {
      error?: string;
      broadcast_notification_updated_at?: string | null;
    };
    setSaving(false);
    if (!res.ok) {
      setSaveError(json.error ?? "Kaydedilemedi.");
      return;
    }
    setSaveOk(t.length === 0 ? "Duyuru kaldırıldı." : "Kaydedildi. Üyeler bildirim listesinde görür.");
    if (json.broadcast_notification_updated_at != null) {
      setPublishedAt(String(json.broadcast_notification_updated_at));
    } else {
      setPublishedAt(null);
    }
  }

  if (!enabled) return null;

  const remaining = BROADCAST_NOTIFICATION_MAX_LEN - text.length;

  return (
    <section
      className="panel admin-broadcast-notification"
      style={{ marginBottom: 20, padding: "14px 16px" }}
    >
      <h2 className="section-title" style={{ fontSize: "1.05rem", marginBottom: 6 }}>
        Tüm kullanıcılara bildirim duyurusu
      </h2>
      <p className="meta" style={{ marginBottom: 12, maxWidth: 720, lineHeight: 1.55 }}>
        Buraya yazdığınız metin, <strong>giriş yapan her kullanıcının</strong> üst çubuktaki bildirim
        listesinde en üstte görünür. Metni güncellediğinizde yeni bir sürüm sayılır; kullanıcı
        bildirimi okuduysa yalnızca <strong>cihazında</strong> saklanır (hesap bazlı kalıcı &quot;
        okundu &quot; veritabanında tutulmaz). Boş kaydederek duyuruyu kaldırırsınız.
      </p>

      {!adminPower ? (
        <p className="notice" style={{ marginBottom: 12 }}>
          Bu metni düzenlemek için tam yönetici yetkisi gerekir.
        </p>
      ) : null}

      {publishedAt ? (
        <p className="meta" style={{ marginBottom: 10 }}>
          Son yayın:{" "}
          {new Date(publishedAt).toLocaleString("tr-TR", {
            dateStyle: "medium",
            timeStyle: "short"
          })}
        </p>
      ) : null}

      {loadError ? (
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
      ) : null}
      {saveError ? (
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
      ) : null}
      {saveOk ? (
        <p className="notice" style={{ marginBottom: 10 }}>
          {saveOk}
        </p>
      ) : null}

      <div className="admin-moderation-toolbar__field" style={{ marginBottom: 10 }}>
        <label htmlFor="admin-broadcast-body">
          Duyuru metni ({BROADCAST_NOTIFICATION_MAX_LEN} karaktere kadar)
        </label>
        <textarea
          id="admin-broadcast-body"
          className="admin-broadcast-notification__textarea"
          rows={5}
          maxLength={BROADCAST_NOTIFICATION_MAX_LEN}
          disabled={loading || saving || !adminPower}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Örn. Ödeme yönergeleri güncellenmiştir. Lütfen ilan kartlarından okuyun."
        />
        <p className="meta" style={{ marginTop: 6, marginBottom: 0 }}>
          Kalan karakter: {remaining < 0 ? 0 : remaining}
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button
          type="button"
          className="btn btn-nakits-cta"
          disabled={loading || saving || !adminPower || Boolean(loadError)}
          onClick={() => void save()}
        >
          {saving ? "Kaydediliyor…" : "Yayınla"}
        </button>
        <button
          type="button"
          className="btn btn-nakits-outline"
          disabled={loading || saving || !adminPower}
          onClick={() => void load()}
        >
          Yenile
        </button>
      </div>
    </section>
  );
}
