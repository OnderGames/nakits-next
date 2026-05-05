"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listingDetailHref } from "@/lib/listing-code";

export type AdminListingReportRow = {
  id: string;
  listingId: string;
  reasonKey: string;
  reasonLabel: string;
  details: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  listingTitle: string;
  listingCode: string;
  listingStatus: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  sellerPublicCode: string;
  reporterEmail: string;
  reporterName: string;
  reporterPublicCode: string;
};

const STATUS_LABEL: Record<string, string> = {
  open: "Bekliyor",
  reviewed: "İşlendi",
  dismissed: "Şikayet reddedildi"
};

function formatDt(iso: string): string {
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

export default function AdminListingReportsSection({
  enabled,
  getAuthHeaders,
  onReportsUpdated
}: {
  enabled: boolean;
  getAuthHeaders: () => Promise<HeadersInit | null>;
  onReportsUpdated?: () => void;
}) {
  const [filter, setFilter] = useState<"open" | "all" | "reviewed" | "dismissed">("open");
  const [rows, setRows] = useState<AdminListingReportRow[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError("");
    const h = await getAuthHeaders();
    if (!h) {
      setRows([]);
      return;
    }
    const res = await fetch(
      `/api/admin/listing-reports?status=${encodeURIComponent(filter)}`,
      { headers: h }
    );
    const json = (await res.json()) as {
      reports?: AdminListingReportRow[];
      openCount?: number;
      error?: string;
    };
    if (!res.ok) {
      setLoadError(json.error ?? "Şikayetler yüklenemedi.");
      setRows([]);
      return;
    }
    setRows(json.reports ?? []);
    setOpenCount(typeof json.openCount === "number" ? json.openCount : 0);
  }, [filter, getAuthHeaders]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  async function patchStatus(id: string, status: "reviewed" | "dismissed") {
    setBusyId(id);
    setLoadError("");
    const h = await getAuthHeaders();
    if (!h) {
      setBusyId(null);
      return;
    }
    const res = await fetch(`/api/admin/listing-reports/${id}`, {
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
    await load();
    onReportsUpdated?.();
  }

  if (!enabled) return null;

  return (
    <section className="panel admin-moderation-list-panel admin-listing-reports" style={{ marginTop: 28 }}>
      <h2 className="section-title" style={{ padding: "0 14px", marginBottom: 8 }}>
        Şikayetler
      </h2>
      <p className="meta" style={{ margin: "0 14px 14px", lineHeight: 1.55 }}>
        Kullanıcıların ilettiği ilan şikayetleri. İnceleyip kaydı kapatabilirsiniz; ilanın kendisi
        için ilan moderasyon bölümünü kullanın.
        {openCount > 0 ? (
          <>
            {" "}
            <strong>Açık şikayet: {openCount}</strong>
          </>
        ) : null}
      </p>

      <div className="admin-moderation-toolbar">
        {(
          [
            ["open", "Bekleyen"],
            ["all", "Tümü"],
            ["reviewed", "İşlenen"],
            ["dismissed", "Reddedilen"]
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={filter === key ? "btn btn-primary" : "btn btn-outline"}
            disabled={busyId !== null}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-outline"
          disabled={busyId !== null}
          onClick={() => void load()}
        >
          Yenile
        </button>
      </div>

      {loadError ? (
        <p
          className="notice"
          style={{
            margin: "10px 14px",
            background: "#fee2e2",
            borderColor: "#fecaca",
            color: "#7f1d1d"
          }}
        >
          {loadError}
          {" — "}
          <span className="meta">
            Tablo yoksa veritabanında{" "}
            <code style={{ fontSize: 12 }}>sql/migration_listing_reports.sql</code> çalıştırın.
          </span>
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="account-empty-panel" style={{ padding: "8px 14px 20px" }}>
          <p className="account-empty-panel__text" style={{ margin: 0 }}>
            Bu filtreye uygun şikayet yok.
          </p>
        </div>
      ) : (
        <ul className="admin-listing-reports__list">
          {rows.map((r) => (
            <li key={r.id} className="admin-listing-reports__item panel">
              <div className="admin-listing-reports__head">
                <span
                  className="admin-listing-reports__badge"
                  data-status={r.status}
                >
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
                <span className="meta">{formatDt(r.createdAt)}</span>
              </div>
              <p className="admin-listing-reports__title">
                <strong>{r.reasonLabel}</strong>
                {r.listingTitle ? (
                  <>
                    {" · "}
                    <Link
                      href={listingDetailHref({
                        id: r.listingId,
                        listingCode: r.listingCode
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {r.listingTitle}
                    </Link>
                  </>
                ) : null}
                {r.listingCode ? (
                  <span className="meta"> · İlan no: {r.listingCode}</span>
                ) : null}
              </p>
              {r.details?.trim() ? (
                <p className="admin-listing-reports__details">{r.details.trim()}</p>
              ) : (
                <p className="meta" style={{ marginTop: 6 }}>
                  Ek açıklama yok.
                </p>
              )}
              <div className="admin-listing-reports__people meta">
                <span>
                  Bildiren: {r.reporterName || r.reporterEmail || "—"}
                  {r.reporterPublicCode ? (
                    <>
                      {" "}
                      (
                      <Link href={`/kullanici/${r.reporterPublicCode}`}>profil</Link>)
                    </>
                  ) : null}
                </span>
                <span>
                  Satıcı: {r.sellerName || r.sellerEmail || "—"}
                  {r.sellerPublicCode ? (
                    <>
                      {" "}
                      (
                      <Link href={`/kullanici/${r.sellerPublicCode}`}>profil</Link>)
                    </>
                  ) : null}
                </span>
              </div>
              {r.status === "open" ? (
                <div className="admin-listing-reports__actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busyId !== null}
                    onClick={() => void patchStatus(r.id, "reviewed")}
                  >
                    {busyId === r.id ? "…" : "İşlendi olarak işaretle"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={busyId !== null}
                    onClick={() => void patchStatus(r.id, "dismissed")}
                  >
                    Şikayeti reddet
                  </button>
                </div>
              ) : r.reviewedAt ? (
                <p className="meta" style={{ marginTop: 10 }}>
                  Güncelleme: {formatDt(r.reviewedAt)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
