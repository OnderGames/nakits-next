"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ModerationUserRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  public_code: string;
  created_at: string;
  app_role: "member" | "moderator" | "admin";
  is_blocked: boolean;
  moderation_flagged: boolean;
  admin_verified_email: boolean;
  admin_verified_phone: boolean;
  auth_email_verified: boolean;
  auth_phone_verified: boolean;
};

const ROLE_LABEL: Record<ModerationUserRow["app_role"], string> = {
  member: "Üye",
  moderator: "Moderatör",
  admin: "Admin"
};

type UserDraftFields = Pick<
  ModerationUserRow,
  | "app_role"
  | "is_blocked"
  | "moderation_flagged"
  | "admin_verified_email"
  | "admin_verified_phone"
>;

function formatWhen(iso: string): string {
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

function rowToDraft(r: ModerationUserRow): UserDraftFields {
  return {
    app_role: r.app_role,
    is_blocked: r.is_blocked,
    moderation_flagged: r.moderation_flagged,
    admin_verified_email: r.admin_verified_email,
    admin_verified_phone: r.admin_verified_phone
  };
}

export default function AdminUserManagementSection({
  enabled,
  adminPower,
  getAuthHeaders
}: {
  enabled: boolean;
  adminPower: boolean;
  getAuthHeaders: () => Promise<HeadersInit | null>;
}) {
  const [rows, setRows] = useState<ModerationUserRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, UserDraftFields>>({});

  const loadUsers = useCallback(async () => {
    setLoadError("");
    const h = await getAuthHeaders();
    if (!h) {
      setRows([]);
      return;
    }
    const res = await fetch("/api/admin/users", { headers: h });
    const json = (await res.json()) as { users?: ModerationUserRow[]; error?: string };
    if (!res.ok) {
      setLoadError(json.error ?? "Üyeler yüklenemedi.");
      setRows([]);
      return;
    }
    const list = json.users ?? [];
    setRows(list);
    const d: Record<string, UserDraftFields> = {};
    for (const r of list) {
      d[r.id] = rowToDraft(r);
    }
    setDrafts(d);
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!enabled) return;
    void loadUsers();
  }, [enabled, loadUsers]);

  const displayRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        r.full_name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.public_code.includes(q)
    );
  }, [rows, search]);

  function setDraftField(id: string, patch: Partial<UserDraftFields>) {
    const base = rows.find((x) => x.id === id);
    if (!base) return;
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? rowToDraft(base)), ...patch }
    }));
  }

  async function patchUser(id: string, body: UserDraftFields) {
    setBusyId(id);
    setLoadError("");
    const h = await getAuthHeaders();
    if (!h) {
      setBusyId(null);
      return;
    }
    const res = await fetch(`/api/admin/users/${id}`, {
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
    await loadUsers();
  }

  async function deleteUser(row: ModerationUserRow) {
    if (
      !window.confirm(
        `${row.email} hesabını ve ilişkili verileri kalıcı silmek istediğine emin misin? Bu işlem geri alınamaz.`
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
    const res = await fetch(`/api/admin/users/${row.id}`, { method: "DELETE", headers: h });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setLoadError(json.error ?? "Silinemedi.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setDrafts((prev) => {
      const n = { ...prev };
      delete n[row.id];
      return n;
    });
  }

  if (!enabled) return null;

  return (
    <section className="panel admin-moderation-list-panel admin-users-panel" style={{ marginTop: 28 }}>
      <h2 className="section-title" style={{ padding: "0 14px", marginBottom: 8 }}>
        Kullanıcı yönetimi
      </h2>
      <p className="meta" style={{ margin: "0 14px 14px", lineHeight: 1.55 }}>
        Üyeleri listeleme, engelleme, şüpheli işaretleme ve yönetici doğrulaması (e‑posta /
        telefon). Rol: üye, moderatör, admin — rol ataması ve üye silme tam yönetici
        gerektirir.
        Supabase doğruluğu kayıtta Auth tarafından onay göstergesidir (
        <abbr title="E-posta / telefon doğrulama tarihi Auth üzerinden">salt okunur</abbr>
        ).
      </p>

      <div className="admin-moderation-toolbar admin-moderation-toolbar--secondary">
        <div className="admin-moderation-toolbar__field" style={{ flex: 1, minWidth: 200 }}>
          <label htmlFor="admin-users-search">Üye ara</label>
          <input
            id="admin-users-search"
            type="search"
            placeholder="E-posta, ad, tel, üye no…"
            autoComplete="off"
            disabled={busyId !== null}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => void loadUsers()}
          disabled={busyId !== null}
        >
          Listeyi yenile
        </button>
      </div>

      {loadError ? (
        <p
          className="notice"
          style={{
            margin: "0 14px 12px",
            background: "#fee2e2",
            borderColor: "#fecaca",
            color: "#7f1d1d"
          }}
        >
          {loadError}
        </p>
      ) : null}

      <div className="admin-users-scroll">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Üye</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>Auth doğrula</th>
              <th>Yönetici doğrula</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20 }}>
                  <span className="meta">
                    Kayıt yok veya arama eşleşmedi (en fazla 500 üye yüklendi). İlk kurulumda
                    veritabanında sql/migration_profile_staff.sql çalışmış olmalı.
                  </span>
                </td>
              </tr>
            ) : (
              displayRows.map((r) => {
                const d = drafts[r.id];
                if (!d) return null;
                const dirty =
                  d.app_role !== r.app_role ||
                  d.is_blocked !== r.is_blocked ||
                  d.moderation_flagged !== r.moderation_flagged ||
                  d.admin_verified_email !== r.admin_verified_email ||
                  d.admin_verified_phone !== r.admin_verified_phone;
                return (
                  <tr key={r.id}>
                    <td data-label="Üye">
                      <div className="admin-users-who">
                        <strong>{r.full_name || "(İsimsiz)"}</strong>
                        <span className="meta">{r.email}</span>
                        <span className="meta">{r.phone ? `📱 ${r.phone}` : "— tel —"}</span>
                        <span className="meta">
                          Üye no:{" "}
                          <Link href={`/kullanici/${r.public_code}`}>{r.public_code}</Link>
                        </span>
                        <span className="meta">{formatWhen(r.created_at)}</span>
                      </div>
                    </td>
                    <td data-label="Rol">
                      <select
                        className="admin-users-role-select"
                        value={d.app_role}
                        disabled={!adminPower || busyId !== null}
                        onChange={(e) =>
                          setDraftField(r.id, {
                            app_role: e.target.value as ModerationUserRow["app_role"]
                          })
                        }
                      >
                        {(Object.keys(ROLE_LABEL) as ModerationUserRow["app_role"][]).map(
                          (role) => (
                            <option key={role} value={role}>
                              {ROLE_LABEL[role]}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                    <td data-label="Durum">
                      <label className="admin-users-check">
                        <input
                          type="checkbox"
                          checked={d.is_blocked}
                          disabled={busyId !== null}
                          onChange={(e) =>
                            setDraftField(r.id, { is_blocked: e.target.checked })
                          }
                        />
                        Engelli
                      </label>
                      <label className="admin-users-check">
                        <input
                          type="checkbox"
                          checked={d.moderation_flagged}
                          disabled={busyId !== null}
                          onChange={(e) =>
                            setDraftField(r.id, {
                              moderation_flagged: e.target.checked
                            })
                          }
                        />
                        Şüpheli
                      </label>
                    </td>
                    <td data-label="Auth doğrula">
                      <span className="admin-users-verify-pill admin-users-verify-pill--muted">
                        {r.auth_email_verified ? "E-posta ✓" : "E-posta —"}
                      </span>
                      <span className="admin-users-verify-pill admin-users-verify-pill--muted">
                        {r.auth_phone_verified ? "SMS ✓" : "SMS —"}
                      </span>
                    </td>
                    <td data-label="Yönetici doğrula">
                      <label className="admin-users-check">
                        <input
                          type="checkbox"
                          checked={d.admin_verified_email}
                          disabled={busyId !== null}
                          onChange={(e) =>
                            setDraftField(r.id, {
                              admin_verified_email: e.target.checked
                            })
                          }
                        />
                        E‑posta doğrula
                      </label>
                      <label className="admin-users-check">
                        <input
                          type="checkbox"
                          checked={d.admin_verified_phone}
                          disabled={busyId !== null}
                          onChange={(e) =>
                            setDraftField(r.id, {
                              admin_verified_phone: e.target.checked
                            })
                          }
                        />
                        Telefon doğrula
                      </label>
                    </td>
                    <td data-label="İşlem">
                      <div className="admin-users-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={!dirty || busyId !== null}
                          onClick={() => void patchUser(r.id, d)}
                        >
                          {busyId === r.id ? "…" : "Kaydet"}
                        </button>
                        {adminPower ? (
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ borderColor: "#991b1b", color: "#991b1b" }}
                            disabled={busyId !== null || r.app_role !== "member"}
                            title={
                              r.app_role !== "member"
                                ? "Önce rolü üyeye düşürün."
                                : "Üyeliği tamamen sil"
                            }
                            onClick={() => void deleteUser(r)}
                          >
                            Sil
                          </button>
                        ) : (
                          <span className="meta">Sil: tam admin</span>
                        )}
                      </div>
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
