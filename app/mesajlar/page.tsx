"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMyConversations } from "@/lib/conversations";
import { formatRelativeTimeTr } from "@/lib/listings-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

export default function MessagesInboxPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Awaited<
    ReturnType<typeof fetchMyConversations>
  > >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setReady(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setReady(true);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setReady(true);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setLoading(true);
    void fetchMyConversations(sb, userId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;

    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void fetchMyConversations(sb, userId).then(setItems);
    };

    const intervalMs = 25000;
    const tick = window.setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [userId]);

  if (!ready) {
    return (
      <main className="container">
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <main className="container">
        <h1 className="section-title">Mesajlarım</h1>
        <p className="notice">Supabase yapılandırması yok.</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="container">
        <h1 className="section-title">Mesajlarım</h1>
        <section className="panel">
          <p>Mesajlarını görmek için giriş yap.</p>
          <Link
            className="btn btn-primary"
            style={{ display: "inline-block", marginTop: 12 }}
            href="/login?next=/mesajlar"
          >
            Giriş yap
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="section-title">Mesajlarım</h1>
      <p className="meta" style={{ marginBottom: 14 }}>
        Bu hesaba ait yazışmaların özeti aşağıdadır.
      </p>
      {loading ? (
        <p className="meta">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <section className="panel">
          <p>Henüz mesajın yok. Bir ilan sayfasından satıcıya yazabilirsin.</p>
          <Link className="btn btn-primary" style={{ marginTop: 12 }} href="/listings">
            İlanlara git
          </Link>
        </section>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((c) => (
            <li key={c.id} style={{ marginBottom: 12 }}>
              <div
                className="panel"
                style={{
                  padding: 0,
                  overflow: "hidden"
                }}
              >
                <Link
                  href={`/mesajlar/${c.id}`}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    textDecoration: "none",
                    color: "inherit",
                    padding: 14
                  }}
                >
                  <Image
                    src={c.listingImage}
                    alt=""
                    width={72}
                    height={72}
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: "cover",
                      borderRadius: 10,
                      flexShrink: 0
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap"
                      }}
                    >
                      <span>{c.listingTitle}</span>
                      {c.unreadCount ? (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#dc2626",
                            color: "#fff"
                          }}
                        >
                          {c.unreadCount > 99 ? "99+" : c.unreadCount}
                        </span>
                      ) : null}
                    </p>
                    <p className="meta" style={{ margin: "6px 0 0", fontSize: 12 }}>
                      {formatRelativeTimeTr(c.sortAt)}
                    </p>
                  </div>
                </Link>
                <p
                  className="meta"
                  style={{
                    margin: 0,
                    padding: "0 14px 14px",
                    borderTop: "1px solid var(--border)"
                  }}
                >
                  {c.role === "buyer" ? "Satıcı" : "Alıcı"}:{" "}
                  {c.otherPartyPublicCode ? (
                    <Link
                      href={`/kullanici/${c.otherPartyPublicCode}`}
                      style={{ color: "var(--primary)", textDecoration: "underline" }}
                    >
                      {c.otherPartyName}
                    </Link>
                  ) : (
                    c.otherPartyName
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
