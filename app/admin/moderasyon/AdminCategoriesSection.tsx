"use client";

import { useCallback, useEffect, useState } from "react";

export type AdminCategoryRow = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  listingCount: number;
};

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
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState("");
  const [editName, setEditName] = useState("");

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

  async function createCategory() {
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
      body: JSON.stringify({ slug: newSlug.trim(), name: newName.trim() })
    });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setLoadError(json.error ?? "Eklenemedi.");
      return;
    }
    setNewSlug("");
    setNewName("");
    await load();
  }

  function startEdit(row: AdminCategoryRow) {
    setEditingId(row.id);
    setEditSlug(row.slug);
    setEditName(row.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditSlug("");
    setEditName("");
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
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ slug: editSlug.trim(), name: editName.trim() })
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

  if (!enabled) return null;

  return (
    <section className="panel admin-categories-panel">
      <h2 className="section-title" style={{ marginBottom: 8 }}>
        Kategoriler
      </h2>
      <p className="meta" style={{ marginBottom: 14, lineHeight: 1.55 }}>
        İlan formları ve filtreler bu kayıtlardaki <strong>slug</strong> ile eşleşir; slug
        değişince mevcut ilanların kategorisi değişmez (UUID üzerinden bağlıdır). Silme: bağlı
        ilan yoksa yapılabilir. Ekleme / düzenleme / silme için{" "}
        <strong>tam yönetici</strong> yetkisi gerekir.
      </p>

      {!adminPower ? (
        <p className="notice" style={{ marginBottom: 12 }}>
          Bu hesapla yalnızca listeyi görüntüleyebilirsiniz. Kategori eklemek için ortam
          yöneticisi veya veritabanında &quot;admin&quot; rolü gerekir.
        </p>
      ) : null}

      {adminPower ? (
        <div className="admin-categories-add">
          <div className="admin-moderation-toolbar__field" style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="admin-cat-slug">Yeni slug</label>
            <input
              id="admin-cat-slug"
              type="text"
              autoComplete="off"
              placeholder="ornek_alt_kategori"
              disabled={busyId !== null}
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
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
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="admin-categories-add__btn">
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                busyId !== null || !newSlug.trim() || !newName.trim()
              }
              onClick={() => void createCategory()}
            >
              {busyId === "__new__" ? "…" : "Kategori ekle"}
            </button>
          </div>
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
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {editingId === row.id ? (
                      <input
                        className="admin-categories-table__input"
                        value={editSlug}
                        disabled={busyId !== null || !adminPower}
                        onChange={(e) => setEditSlug(e.target.value)}
                        aria-label="Slug"
                      />
                    ) : (
                      <code className="admin-categories-slug">{row.slug}</code>
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
                              disabled={busyId !== null}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
