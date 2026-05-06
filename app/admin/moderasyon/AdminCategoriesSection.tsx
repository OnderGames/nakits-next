"use client";

import AddListingMainCategoryGrid from "@/components/AddListingMainCategoryGrid";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey,
  formatCategoryDisplay,
  getOtomobilModelsForBrand,
  konutLeafCategorySubSlug,
  KONUT_LISTING_KINDS,
  KONUT_PROPERTY_TYPES,
  OTOMOBIL_MARKALARI,
  sqlCategorySlugFromKey,
  sqlCategorySlugToKey,
  type SubcategoryDef
} from "@/lib/categories";
import { useCallback, useEffect, useMemo, useState } from "react";

export type AdminCategoryRow = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  listingCount: number;
};

function slugSegmentFromInput(raw: string): string {
  const map: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    â: "a",
    î: "i",
    û: "u"
  };
  let s = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  s = s.replace(/./g, (ch) => map[ch] ?? ch);
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s.slice(0, 96);
}

export default function AdminCategoriesSection({
  enabled,
  adminPower,
  getAuthHeaders
}: {
  enabled: boolean;
  adminPower: boolean;
  getAuthHeaders: () => Promise<HeadersInit | null>;
}) {
  const [rows, setRows] = useState<AdminCategoryRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [wizGroupSlug, setWizGroupSlug] = useState<string | null>(null);
  const [wizSubSlug, setWizSubSlug] = useState<string | null>(null);
  const [wizKonutTxn, setWizKonutTxn] = useState("");
  const [wizKonutProp, setWizKonutProp] = useState("");
  const [wizEmlakTxn, setWizEmlakTxn] = useState("");
  const [wizOtomobilBrand, setWizOtomobilBrand] = useState("");
  const [wizOtomobilNewModel, setWizOtomobilNewModel] = useState(false);
  const [wizOtomobilExistingModelSlug, setWizOtomobilExistingModelSlug] =
    useState("");
  const [wizOtomobilNewModelSlug, setWizOtomobilNewModelSlug] = useState("");
  const [wizDisplayName, setWizDisplayName] = useState("");

  const [manualSlug, setManualSlug] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualOpen, setManualOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState("");
  const [editName, setEditName] = useState("");
  const [editSlugUnlocked, setEditSlugUnlocked] = useState(false);

  const selectedGroup = useMemo(
    () => CATEGORY_GROUPS.find((g) => g.slug === wizGroupSlug),
    [wizGroupSlug]
  );

  const selectedSub = useMemo(() => {
    if (!selectedGroup || !wizSubSlug) return undefined;
    return selectedGroup.subs.find((s) => s.slug === wizSubSlug);
  }, [selectedGroup, wizSubSlug]);

  const wizardCompositeKey = useMemo((): string | null => {
    if (!selectedGroup || !selectedSub) return null;
    const g = selectedGroup.slug;
    const sub = selectedSub;

    if (!sub.drilldown) {
      return compositeCategoryKey(g, sub.slug);
    }

    if (sub.drilldown === "konut") {
      if (!wizKonutTxn || !wizKonutProp) return null;
      const leaf = konutLeafCategorySubSlug(
        wizKonutTxn as (typeof KONUT_LISTING_KINDS)[number]["slug"],
        wizKonutProp as (typeof KONUT_PROPERTY_TYPES)[number]["slug"]
      );
      return compositeCategoryKey(g, leaf);
    }

    if (sub.drilldown === "emlak-listing-kind") {
      if (!wizEmlakTxn) return null;
      return compositeCategoryKey(g, `${sub.slug}-${wizEmlakTxn}`);
    }

    if (sub.drilldown === "otomobil-marka") {
      if (!wizOtomobilBrand) return null;
      const brandDef = OTOMOBIL_MARKALARI.find((m) => m.slug === wizOtomobilBrand);
      if (!brandDef) return null;
      const models = getOtomobilModelsForBrand(wizOtomobilBrand);
      if (!models?.length) {
        return compositeCategoryKey(g, `otomobil-${wizOtomobilBrand}`);
      }
      if (wizOtomobilNewModel) {
        const seg = slugSegmentFromInput(wizOtomobilNewModelSlug);
        if (!seg) return null;
        return compositeCategoryKey(g, `otomobil-${wizOtomobilBrand}-${seg}`);
      }
      if (!wizOtomobilExistingModelSlug) return null;
      return compositeCategoryKey(
        g,
        `otomobil-${wizOtomobilBrand}-${wizOtomobilExistingModelSlug}`
      );
    }

    return null;
  }, [
    selectedGroup,
    selectedSub,
    wizKonutTxn,
    wizKonutProp,
    wizEmlakTxn,
    wizOtomobilBrand,
    wizOtomobilNewModel,
    wizOtomobilExistingModelSlug,
    wizOtomobilNewModelSlug
  ]);

  const wizardSqlSlug = wizardCompositeKey
    ? sqlCategorySlugFromKey(wizardCompositeKey)
    : "";

  useEffect(() => {
    if (!wizardCompositeKey) {
      setWizDisplayName("");
      return;
    }
    setWizDisplayName(formatCategoryDisplay(wizardCompositeKey));
  }, [wizardCompositeKey]);

  const load = useCallback(async () => {
    setLoadError("");
    const h = await getAuthHeaders();
    if (!h) {
      setRows([]);
      return;
    }
    const res = await fetch("/api/admin/categories", { headers: h });
    const json = (await res.json()) as {
      categories?: AdminCategoryRow[];
      error?: string;
    };
    if (!res.ok) {
      setLoadError(json.error ?? "Kategoriler yüklenemedi.");
      setRows([]);
      return;
    }
    setRows(json.categories ?? []);
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  function resetWizard() {
    setWizGroupSlug(null);
    setWizSubSlug(null);
    setWizKonutTxn("");
    setWizKonutProp("");
    setWizEmlakTxn("");
    setWizOtomobilBrand("");
    setWizOtomobilNewModel(false);
    setWizOtomobilExistingModelSlug("");
    setWizOtomobilNewModelSlug("");
    setWizDisplayName("");
  }

  function pickMainGroup(slug: string) {
    setWizGroupSlug(slug);
    setWizSubSlug(null);
    setWizKonutTxn("");
    setWizKonutProp("");
    setWizEmlakTxn("");
    setWizOtomobilBrand("");
    setWizOtomobilNewModel(false);
    setWizOtomobilExistingModelSlug("");
    setWizOtomobilNewModelSlug("");
    setWizDisplayName("");
  }

  function pickSub(sub: SubcategoryDef) {
    setWizSubSlug(sub.slug);
    setWizKonutTxn("");
    setWizKonutProp("");
    setWizEmlakTxn("");
    setWizOtomobilBrand("");
    setWizOtomobilNewModel(false);
    setWizOtomobilExistingModelSlug("");
    setWizOtomobilNewModelSlug("");
  }

  async function createCategoryFromWizard() {
    if (!adminPower || !wizardCompositeKey || !wizDisplayName.trim()) return;
    setBusyId("__new__");
    setLoadError("");
    const h = await getAuthHeaders();
    if (!h) {
      setBusyId(null);
      return;
    }
    const slug = sqlCategorySlugFromKey(wizardCompositeKey);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name: wizDisplayName.trim() })
    });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setLoadError(json.error ?? "Eklenemedi.");
      return;
    }
    resetWizard();
    await load();
  }

  async function createCategoryManual() {
    if (!adminPower) return;
    setBusyId("__new__");
    setLoadError("");
    const h = await getAuthHeaders();
    if (!h) {
      setBusyId(null);
      return;
    }
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ slug: manualSlug.trim(), name: manualName.trim() })
    });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setLoadError(json.error ?? "Eklenemedi.");
      return;
    }
    setManualSlug("");
    setManualName("");
    await load();
  }

  function startEdit(row: AdminCategoryRow) {
    setEditingId(row.id);
    setEditSlug(row.slug);
    setEditName(row.name);
    const k = sqlCategorySlugToKey(row.slug);
    setEditSlugUnlocked(k == null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditSlug("");
    setEditName("");
    setEditSlugUnlocked(false);
  }

  async function saveEdit(id: string) {
    if (!adminPower) return;
    setBusyId(id);
    setLoadError("");
    const h = await getAuthHeaders();
    if (!h) {
      setBusyId(null);
      return;
    }
    const body = editSlugUnlocked
      ? { slug: editSlug.trim(), name: editName.trim() }
      : { name: editName.trim() };
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setLoadError(json.error ?? "Güncellenemedi.");
      return;
    }
    cancelEdit();
    await load();
  }

  async function removeCategory(row: AdminCategoryRow) {
    if (!adminPower) return;
    if (
      !window.confirm(
        `«${row.name}» kategorisini silmek istediğinize emin misiniz? Bağlı ilan varsa silinmez.`
      )
    ) {
      return;
    }
    setBusyId(row.id);
    setLoadError("");
    const h = await getAuthHeaders();
    if (!h) {
      setBusyId(null);
      return;
    }
    const res = await fetch(`/api/admin/categories/${row.id}`, {
      method: "DELETE",
      headers: h
    });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setLoadError(json.error ?? "Silinemedi.");
      return;
    }
    await load();
  }

  const otomobilModels = wizOtomobilBrand
    ? getOtomobilModelsForBrand(wizOtomobilBrand)
    : undefined;

  const wizardCanSubmit =
    Boolean(wizardCompositeKey && wizDisplayName.trim()) &&
    busyId === null &&
    adminPower;

  if (!enabled) return null;

  return (
    <section className="panel admin-categories-panel">
      <h2 className="section-title" style={{ marginBottom: 8 }}>
        Kategoriler
      </h2>
      <p className="meta" style={{ marginBottom: 14, lineHeight: 1.55 }}>
        İlan formları ve filtreler bu kayıtlardaki <strong>slug</strong> ile eşleşir. Aşağıda
        ilan verme ekranındaki gibi ana grup ve alt seçimle slug üretilir; böylece veritabanı
        satırı ilan akışıyla uyumlu olur. Silme: bağlı ilan yoksa yapılabilir. Ekleme / düzenleme
        / silme için <strong>tam yönetici</strong> yetkisi gerekir.
      </p>

      {!adminPower ? (
        <p className="notice" style={{ marginBottom: 12 }}>
          Bu hesapla yalnızca listeyi görüntüleyebilirsiniz. Kategori eklemek için ortam
          yöneticisi veya veritabanında &quot;admin&quot; rolü gerekir.
        </p>
      ) : null}

      {adminPower ? (
        <div className="admin-cat-wizard">
          <h3 className="admin-cat-wizard__title">Yeni kategori (sihirbaz)</h3>
          <p className="admin-cat-wizard__hint meta">
            Önce ana grubu seçin; ardından alt türü ve gerekirse ek adımları tamamlayın. İlan
            verme sayfasıyla aynı anahtar kuralı kullanılır.
          </p>

          <AddListingMainCategoryGrid
            disabled={busyId !== null}
            onSelectMain={(slug) => pickMainGroup(slug)}
          />

          {wizGroupSlug && selectedGroup ? (
            <div className="admin-cat-wizard__step">
              <div className="admin-cat-wizard__step-head">
                <span className="admin-cat-wizard__badge">
                  {selectedGroup.emoji} {selectedGroup.name}
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busyId !== null}
                  onClick={() => resetWizard()}
                >
                  Ana kategoriyi değiştir
                </button>
              </div>

              <p className="meta admin-cat-wizard__sub-lead">Alt kategori türü</p>
              <ul className="admin-cat-wizard__sub-grid">
                {selectedGroup.subs.map((sub) => (
                  <li key={sub.slug}>
                    <button
                      type="button"
                      className={
                        wizSubSlug === sub.slug
                          ? "admin-cat-wizard__sub-tile admin-cat-wizard__sub-tile--active"
                          : "admin-cat-wizard__sub-tile"
                      }
                      disabled={busyId !== null}
                      onClick={() => pickSub(sub)}
                    >
                      {sub.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {selectedSub?.drilldown === "konut" ? (
            <div className="admin-cat-wizard__step admin-cat-wizard__fields">
              <div className="admin-moderation-toolbar__field" style={{ flex: 1, minWidth: 140 }}>
                <label htmlFor="wiz-konut-txn">İşlem</label>
                <select
                  id="wiz-konut-txn"
                  value={wizKonutTxn}
                  disabled={busyId !== null}
                  onChange={(e) => setWizKonutTxn(e.target.value)}
                >
                  <option value="">Seçin</option>
                  {KONUT_LISTING_KINDS.map((k) => (
                    <option key={k.slug} value={k.slug}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-moderation-toolbar__field" style={{ flex: 1, minWidth: 160 }}>
                <label htmlFor="wiz-konut-prop">Yapı / tip</label>
                <select
                  id="wiz-konut-prop"
                  value={wizKonutProp}
                  disabled={busyId !== null}
                  onChange={(e) => setWizKonutProp(e.target.value)}
                >
                  <option value="">Seçin</option>
                  {KONUT_PROPERTY_TYPES.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {selectedSub?.drilldown === "emlak-listing-kind" ? (
            <div className="admin-cat-wizard__step admin-cat-wizard__fields">
              <div className="admin-moderation-toolbar__field" style={{ flex: 1, minWidth: 180 }}>
                <label htmlFor="wiz-emlak-txn">Satılık / kiralık</label>
                <select
                  id="wiz-emlak-txn"
                  value={wizEmlakTxn}
                  disabled={busyId !== null}
                  onChange={(e) => setWizEmlakTxn(e.target.value)}
                >
                  <option value="">Seçin</option>
                  {KONUT_LISTING_KINDS.map((k) => (
                    <option key={k.slug} value={k.slug}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {selectedSub?.drilldown === "otomobil-marka" ? (
            <div className="admin-cat-wizard__step">
              <div className="admin-cat-wizard__fields">
                <div className="admin-moderation-toolbar__field" style={{ flex: 1, minWidth: 200 }}>
                  <label htmlFor="wiz-oto-brand">Marka</label>
                  <select
                    id="wiz-oto-brand"
                    value={wizOtomobilBrand}
                    disabled={busyId !== null}
                    onChange={(e) => {
                      const v = e.target.value;
                      setWizOtomobilBrand(v);
                      setWizOtomobilExistingModelSlug("");
                      setWizOtomobilNewModelSlug("");
                      setWizOtomobilNewModel(false);
                    }}
                  >
                    <option value="">Seçin</option>
                    {OTOMOBIL_MARKALARI.map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {wizOtomobilBrand && otomobilModels?.length ? (
                <div className="admin-cat-wizard__oto-options">
                  <label className="admin-cat-wizard__radio">
                    <input
                      type="radio"
                      name="wiz-oto-mode"
                      checked={!wizOtomobilNewModel}
                      disabled={busyId !== null}
                      onChange={() => setWizOtomobilNewModel(false)}
                    />
                    Katalogdaki model
                  </label>
                  <label className="admin-cat-wizard__radio">
                    <input
                      type="radio"
                      name="wiz-oto-mode"
                      checked={wizOtomobilNewModel}
                      disabled={busyId !== null}
                      onChange={() => setWizOtomobilNewModel(true)}
                    />
                    Yeni model (slug)
                  </label>
                </div>
              ) : null}

              {wizOtomobilBrand && otomobilModels?.length && !wizOtomobilNewModel ? (
                <div className="admin-moderation-toolbar__field" style={{ maxWidth: 420 }}>
                  <label htmlFor="wiz-oto-model">Model</label>
                  <select
                    id="wiz-oto-model"
                    value={wizOtomobilExistingModelSlug}
                    disabled={busyId !== null}
                    onChange={(e) => setWizOtomobilExistingModelSlug(e.target.value)}
                  >
                    <option value="">Seçin</option>
                    {otomobilModels!.map((mod) => (
                      <option key={mod.slug} value={mod.slug}>
                        {mod.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {wizOtomobilBrand && otomobilModels?.length && wizOtomobilNewModel ? (
                <div className="admin-cat-wizard__fields">
                  <div className="admin-moderation-toolbar__field" style={{ flex: 1, minWidth: 200 }}>
                    <label htmlFor="wiz-oto-new-slug">Model slug (URL parçası)</label>
                    <input
                      id="wiz-oto-new-slug"
                      type="text"
                      autoComplete="off"
                      placeholder="ornek-yeni-model"
                      disabled={busyId !== null}
                      value={wizOtomobilNewModelSlug}
                      onChange={(e) => setWizOtomobilNewModelSlug(e.target.value)}
                    />
                  </div>
                  <p className="meta" style={{ flex: 1, minWidth: 220, margin: 0, alignSelf: "flex-end" }}>
                    Küçük harf, tire; Türkçe harfler otomatik dönüştürülür. İlan formunda bu modeli
                    seçilebilir yapmak için ileride <code>lib/categories.ts</code> içindeki marka
                    model listesine de eklemeniz gerekebilir.
                  </p>
                </div>
              ) : null}

              {wizOtomobilBrand && !otomobilModels?.length ? (
                <p className="meta admin-cat-wizard__note">
                  Bu markada önceden tanımlı model listesi yok; kayıt marka düzeyinde yapılır (
                  <code>otomobil-{wizOtomobilBrand}</code>).
                </p>
              ) : null}
            </div>
          ) : null}

          {wizardSqlSlug ? (
            <div className="admin-cat-wizard__preview">
              <div>
                <span className="meta">Üretilen slug</span>
                <code className="admin-cat-wizard__preview-slug">{wizardSqlSlug}</code>
              </div>
              <div className="admin-moderation-toolbar__field" style={{ flex: 1, minWidth: 240 }}>
                <label htmlFor="wiz-display-name">Listede görünen ad</label>
                <input
                  id="wiz-display-name"
                  type="text"
                  disabled={busyId !== null}
                  value={wizDisplayName}
                  onChange={(e) => setWizDisplayName(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!wizardCanSubmit}
                onClick={() => void createCategoryFromWizard()}
              >
                {busyId === "__new__" ? "…" : "Kategori ekle"}
              </button>
            </div>
          ) : null}

          <details
            className="admin-cat-wizard__manual"
            open={manualOpen}
            onToggle={(e) => setManualOpen(e.currentTarget.open)}
          >
            <summary>Manuel slug (ileri düzey)</summary>
            <p className="meta">
              Özel veya geçmiş kayıtlar için slug ve adı doğrudan girebilirsiniz (ilan anahtarıyla
              uyumlu olmalıdır).
            </p>
            <div className="admin-categories-add">
              <div className="admin-moderation-toolbar__field" style={{ flex: 1, minWidth: 160 }}>
                <label htmlFor="admin-cat-slug">Slug</label>
                <input
                  id="admin-cat-slug"
                  type="text"
                  autoComplete="off"
                  placeholder="ornek_alt_kategori"
                  disabled={busyId !== null}
                  value={manualSlug}
                  onChange={(e) => setManualSlug(e.target.value)}
                />
              </div>
              <div className="admin-moderation-toolbar__field" style={{ flex: 2, minWidth: 200 }}>
                <label htmlFor="admin-cat-name">Görünen ad</label>
                <input
                  id="admin-cat-name"
                  type="text"
                  autoComplete="off"
                  placeholder="Örnek › Alt kategori"
                  disabled={busyId !== null}
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
              <div className="admin-categories-add__btn">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={
                    busyId !== null || !manualSlug.trim() || !manualName.trim()
                  }
                  onClick={() => void createCategoryManual()}
                >
                  {busyId === "__new__" ? "…" : "Manuel ekle"}
                </button>
              </div>
            </div>
          </details>
        </div>
      ) : null}

      {loadError ? (
        <p
          className="notice"
          style={{
            marginTop: 12,
            marginBottom: 0,
            background: "#fee2e2",
            borderColor: "#fecaca",
            color: "#7f1d1d"
          }}
        >
          {loadError}
        </p>
      ) : null}

      <div className="admin-categories-toolbar">
        <button
          type="button"
          className="btn btn-outline"
          disabled={busyId !== null}
          onClick={() => void load()}
        >
          Listeyi yenile
        </button>
      </div>

      <div className="admin-categories-scroll">
        <table className="admin-categories-table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Ad</th>
              <th>İlan</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="admin-categories-table__empty">
                  Kategori yok veya yüklenemedi.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const taxonomyKey = sqlCategorySlugToKey(row.slug);
                const taxonomyLabel =
                  taxonomyKey != null ? formatCategoryDisplay(taxonomyKey) : null;
                return (
                  <tr key={row.id}>
                    <td>
                      {editingId === row.id ? (
                        editSlugUnlocked ? (
                          <input
                            className="admin-categories-table__input"
                            value={editSlug}
                            disabled={busyId !== null || !adminPower}
                            onChange={(e) => setEditSlug(e.target.value)}
                            aria-label="Slug"
                          />
                        ) : (
                          <div>
                            <code className="admin-categories-slug">{row.slug}</code>
                            <label className="admin-cat-edit__unlock meta">
                              <input
                                type="checkbox"
                                checked={editSlugUnlocked}
                                disabled={busyId !== null}
                                onChange={(e) => setEditSlugUnlocked(e.target.checked)}
                              />
                              Slug düzenle (riskli)
                            </label>
                          </div>
                        )
                      ) : (
                        <div>
                          <code className="admin-categories-slug">{row.slug}</code>
                          {taxonomyLabel ? (
                            <div className="meta admin-cat-edit__taxonomy">{taxonomyLabel}</div>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td>
                      {editingId === row.id ? (
                        <input
                          className="admin-categories-table__input"
                          value={editName}
                          disabled={busyId !== null || !adminPower}
                          onChange={(e) => setEditName(e.target.value)}
                          aria-label="Ad"
                        />
                      ) : (
                        row.name
                      )}
                    </td>
                    <td>{row.listingCount}</td>
                    <td>
                      {adminPower ? (
                        <div className="admin-categories-actions">
                          {editingId === row.id ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary"
                                disabled={busyId !== null || !editName.trim()}
                                onClick={() => void saveEdit(row.id)}
                              >
                                {busyId === row.id ? "…" : "Kaydet"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                disabled={busyId !== null}
                                onClick={cancelEdit}
                              >
                                İptal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline"
                                disabled={busyId !== null}
                                onClick={() => startEdit(row)}
                              >
                                Düzenle
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{
                                  borderColor: "#991b1b",
                                  color: "#991b1b",
                                  fontWeight: 600
                                }}
                                disabled={busyId !== null}
                                onClick={() => void removeCategory(row)}
                              >
                                {busyId === row.id ? "…" : "Sil"}
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="meta">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
