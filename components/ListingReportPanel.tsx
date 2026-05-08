"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LISTING_REPORT_REASON_KEYS,
  LISTING_REPORT_REASON_LABELS,
  type ListingReportReasonKey
} from "@/lib/listing-report-reasons";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import Link from "next/link";

type Props = {
  listingId: string;
  sellerId: string;
};

export default function ListingReportPanel({ listingId, sellerId }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [reasonKey, setReasonKey] = useState<ListingReportReasonKey>("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setSessionReady(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setSessionReady(true);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setSessionReady(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const ownListing = Boolean(userId && sellerId && userId === sellerId);

  const submit = useCallback(async () => {
    setError("");
    const sb = getSupabaseBrowser();
    if (!sb) {
      setError("Oturum kullanılamıyor.");
      return;
    }
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("Giriş yapmalısınız.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/listings/report", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        listingId,
        reasonKey,
        details: details.trim().slice(0, 2000)
      })
    });
    const json = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Gönderilemedi.");
      return;
    }
    setDone(true);
    setOpen(false);
    setDetails("");
  }, [listingId, reasonKey, details]);

  if (!hasSupabaseConfig || !sessionReady) {
    return null;
  }

  if (ownListing) {
    return null;
  }

  return (
    <div className="listing-report-panel">
      <p className="meta" style={{ marginBottom: 8 }}>
        Bu ilanda sorun mu görüyorsun?
      </p>
      {done ? (
        <p className="notice" style={{ margin: 0, background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}>
          Şikayetin moderasyon ekibine iletildi. Teşekkürler.
        </p>
      ) : (
        <>
          {!userId ? (
            <p className="meta" style={{ margin: 0 }}>
              Şikayet için{" "}
              <Link href={`/login?next=/listings/${listingId}`}>giriş yap</Link>.
            </p>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-nakits-outline listing-report-panel__trigger"
                onClick={() => {
                  setOpen(true);
                  setError("");
                }}
              >
                İlanı şikayet et
              </button>
              {open ? (
                <div
                  className="listing-report-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="listing-report-title"
                >
                  <div
                    className="listing-report-modal__backdrop"
                    aria-hidden
                    onClick={() => !busy && setOpen(false)}
                  />
                  <div className="listing-report-modal__card panel">
                    <h3 id="listing-report-title" className="section-title" style={{ marginTop: 0 }}>
                      İlan şikayeti
                    </h3>
                    <p className="meta" style={{ marginTop: 0 }}>
                      Bildirimin incelenir; gerektiğinde ilan kaldırılabilir veya satıcıyla iletişime
                      geçilir.
                    </p>
                    <label className="listing-report-modal__label" htmlFor="listing-report-reason">
                      Neden
                    </label>
                    <select
                      id="listing-report-reason"
                      className="listing-report-modal__select"
                      value={reasonKey}
                      disabled={busy}
                      onChange={(e) =>
                        setReasonKey(e.target.value as ListingReportReasonKey)
                      }
                    >
                      {LISTING_REPORT_REASON_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {LISTING_REPORT_REASON_LABELS[k]}
                        </option>
                      ))}
                    </select>
                    <label className="listing-report-modal__label" htmlFor="listing-report-details">
                      Açıklama (isteğe bağlı)
                    </label>
                    <textarea
                      id="listing-report-details"
                      className="listing-report-modal__textarea"
                      rows={4}
                      maxLength={2000}
                      placeholder="Kısa ve net yazın"
                      disabled={busy}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                    />
                    {error ? (
                      <p
                        className="notice"
                        style={{
                          marginTop: 10,
                          background: "#fee2e2",
                          borderColor: "#fecaca",
                          color: "#7f1d1d"
                        }}
                      >
                        {error}
                      </p>
                    ) : null}
                    <div className="listing-report-modal__actions">
                      <button
                        type="button"
                        className="btn btn-nakits-outline"
                        disabled={busy}
                        onClick={() => setOpen(false)}
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        className="btn btn-nakits-cta"
                        disabled={busy}
                        onClick={() => void submit()}
                      >
                        {busy ? "Gönderiliyor…" : "Şikayeti gönder"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}
