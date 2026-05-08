"use client";

import {
  LEGAL_PAGE_LABELS,
  LEGAL_PAGE_SLUGS,
  type LegalPageSlug
} from "@/lib/legal-pages";
import { useCallback, useEffect, useState } from "react";

export default function AdminLegalPagesSection({
  enabled,
  adminPower,
  getAuthHeaders
}: {
  enabled: boolean;
  adminPower: boolean;
  getAuthHeaders: () => Promise<HeadersInit | null>;
}) {
  const [slug, setSlug] = useState<LegalPageSlug>("uyelik-sozlesmesi");
  const [pageTitle, setPageTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [usesDefault, setUsesDefault] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadOne = useCallback(async () => {
    setLoadError("");
    setSaveOk("");
    const h = await getAuthHeaders();
    if (!h) {
      setLoadError("Oturum yok.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/legal-pages/${slug}`, { headers: h });
    const json = (await res.json()) as {
      page_title?: string;
      meta_description?: string;
      body_html?: string;
      uses_app_default?: boolean;
      updated_at?: string | null;
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setLoadError(
        json.error ??
          "Yüklenemedi. Supabase’de `sql/migration_site_legal_pages.sql` çalıştırılmış mı?"
      );
      return;
    }
    setPageTitle(json.page_title ?? "");
    setMetaDescription(json.meta_description ?? "");
    setBodyHtml(json.body_html ?? "");
    setUsesDefault(Boolean(json.uses_app_default));
    setUpdatedAt(typeof json.updated_at === "string" ? json.updated_at : null);
  }, [getAuthHeaders, slug]);

  useEffect(() => {
    if (!enabled) return;
    void loadOne();
  }, [enabled, loadOne]);

  async function save() {
    if (!adminPower) return;
    setSaveError("");
    setSaveOk("");
    const h = await getAuthHeaders();
    if (!h) {
      setSaveError("Oturum yok.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/legal-pages/${slug}`, {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({
        page_title: pageTitle.trim(),
        meta_description: metaDescription.trim(),
        body_html: bodyHtml
      })
    });
    const json = (await res.json()) as { error?: string; uses_app_default?: boolean };
    setSaving(false);
    if (!res.ok) {
      setSaveError(json.error ?? "Kaydedilemedi.");
      return;
    }
    setSaveOk("Kaydedildi.");
    void loadOne();
  }

  async function revertToDefault() {
    if (!adminPower) return;
    if (
      !window.confirm(
        "Veritabanındaki özelleştirilmiş metni silip uygulama varsayılanına dönmek istiyor musunuz?"
      )
    ) {
      return;
    }
    setSaveError("");
    setSaveOk("");
    const h = await getAuthHeaders();
    if (!h) {
      setSaveError("Oturum yok.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/legal-pages/${slug}`, {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({
        page_title: "",
        meta_description: "",
        body_html: ""
      })
    });
    const json = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setSaveError(json.error ?? "İşlem başarısız.");
      return;
    }
    setSaveOk("Varsayılan içerik kullanılıyor.");
    void loadOne();
  }

  if (!enabled) return null;

  const publicPath = `/` + slug;

  return (
    <section className="panel admin-legal-pages">
      <h2 className="section-title" style={{ marginBottom: 8 }}>
        Sözleşme ve politikalar (metin sayfaları)
      </h2>
      <p className="meta" style={{ marginBottom: 14, lineHeight: 1.55 }}>
        Kullanım şartları, gizlilik / KVKK, İngilizce politikalar ve yasaklı ürün listesi gibi
        sayfaları güncelleyin. Alanlar dolu olduğunda canlı içerik veritabanından gösterilir; metin
        alanını boş kayıtlarsanız uygulamadaki varsayılan (gömülü) metin kullanılır. HTML:
        başlıklar (<code>h1</code>–<code>h3</code>), paragraf, liste ve güvenli bağlantılar;{" "}
        <code>script</code> süzülür.
      </p>

      {!adminPower ? (
        <p className="notice" style={{ marginBottom: 12 }}>
          Bu bölümde düzenlemek için tam yönetici yetkisi gerekir. Sayfayı görüntüleyebilir veya liste
          yükleyebilirsiniz (staff API ile).
        </p>
      ) : null}

      <div className="admin-moderation-toolbar__field" style={{ maxWidth: 420, marginBottom: 12 }}>
        <label htmlFor="admin-legal-slug">Sayfa</label>
        <select
          id="admin-legal-slug"
          disabled={loading || saving}
          value={slug}
          onChange={(e) => setSlug(e.target.value as LegalPageSlug)}
        >
          {LEGAL_PAGE_SLUGS.map((s) => (
            <option key={s} value={s}>
              {LEGAL_PAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <p className="meta" style={{ marginBottom: 12 }}>
        <a href={publicPath} target="_blank" rel="noopener noreferrer">
          Canlı önizleme: {publicPath}
        </a>
        {updatedAt ? (
          <>
            {" "}
            · Son kayıt:{" "}
            {new Date(updatedAt).toLocaleString("tr-TR", {
              dateStyle: "medium",
              timeStyle: "short"
            })}
          </>
        ) : null}{" "}
        · Durum: {usesDefault ? "varsayılan (gömülü) içerik" : "özelleştirilmiş"}
      </p>

      <div className="admin-moderation-toolbar__field" style={{ marginBottom: 12 }}>
        <label htmlFor="admin-legal-title">Sayfa başlığı (SEO / sekme)</label>
        <input
          id="admin-legal-title"
          type="text"
          autoComplete="off"
          placeholder="Özelleştirilmiş içerik için zorunlu"
          disabled={loading || saving || !adminPower}
          value={pageTitle}
          onChange={(e) => setPageTitle(e.target.value)}
        />
      </div>

      <div className="admin-moderation-toolbar__field" style={{ marginBottom: 12 }}>
        <label htmlFor="admin-legal-meta">Kısa açıklama (meta description)</label>
        <input
          id="admin-legal-meta"
          type="text"
          autoComplete="off"
          disabled={loading || saving || !adminPower}
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
        />
      </div>

      <div className="admin-moderation-toolbar__field" style={{ marginBottom: 12 }}>
        <label htmlFor="admin-legal-body">Tam sayfa içeriği (HTML)</label>
        <textarea
          id="admin-legal-body"
          className="admin-legal-pages__textarea"
          rows={22}
          spellCheck={false}
          placeholder="Özelleştirilmiş metin için buraya HTML yazın veya yapıştırın. Varsayılana dönmek için boş kaydedin (Varsayılana dön düğmesi)."
          disabled={loading || saving || !adminPower}
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          className="btn btn-nakits-cta"
          disabled={loading || saving || !adminPower}
          onClick={() => void save()}
        >
          {saving ? "…" : "Kaydet"}
        </button>
        <button
          type="button"
          className="btn btn-nakits-outline"
          disabled={
            loading ||
            saving ||
            !adminPower ||
            usesDefault
          }
          onClick={() => void revertToDefault()}
        >
          Varsayılana dön
        </button>
        <button
          type="button"
          className="btn btn-nakits-outline"
          disabled={loading || saving}
          onClick={() => void loadOne()}
        >
          Yenile
        </button>
      </div>

      {loadError ? (
        <p
          className="notice"
          style={{
            marginTop: 14,
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
            marginTop: 14,
            background: "#fee2e2",
            borderColor: "#fecaca",
            color: "#7f1d1d"
          }}
        >
          {saveError}
        </p>
      ) : null}
      {saveOk ? (
        <p className="notice" style={{ marginTop: 14 }}>
          {saveOk}
        </p>
      ) : null}
    </section>
  );
}
