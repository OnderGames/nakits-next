"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import {
  deleteConversation,
  fetchMyConversations,
  notifyUnreadRefresh
} from "@/lib/conversations";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inboxError, setInboxError] = useState("");

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

  async function handleDeleteConversation(
    conversationId: string,
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (
      !window.confirm(
        "Bu görüşmedeki tüm mesajlar tamamen silinir (karşı taraf da bu yazışmayı artık göremez). Aynı ilan için daha sonra yeniden yazılabilir."
      )
    ) {
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setDeletingId(conversationId);
    setInboxError("");
    const res = await deleteConversation(sb, conversationId);
    setDeletingId(null);
    if (res.error) {
      setInboxError(res.error);
      return;
    }
    setItems((prev) => prev.filter((row) => row.id !== conversationId));
    notifyUnreadRefresh();
  }

  if (!ready) {
    return (
      <div className="account-page">
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <div className="account-page">
        <h1 className="section-title">Mesajlarım</h1>
        <p className="notice">Supabase yapılandırması yok.</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="account-page">
        <h1 className="section-title">Mesajlarım</h1>
        <section className="panel account-empty-panel">
          <p className="account-empty-panel__text">
            Mesajlarını görmek için giriş yap.
          </p>
          <Link
            className="nav-pill nav-pill--login account-empty-panel__cta"
            href="/login?next=/mesajlar"
          >
            Giriş yap
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="account-page">
      <h1 className="section-title">Mesajlarım</h1>
      <section className="panel account-hero account-hero--messages">
        <p className="account-hero__eyebrow">Gelen Kutusu</p>
        <h2 className="account-hero__title">Tüm yazışmaların tek yerde</h2>
        <p className="account-hero__desc">
          Son mesaj zamanına göre sıralanır. Okunmamış mesajlar kırmızı rozet ile görünür.
        </p>
        <div className="account-hero__stats">
          <span className="account-hero__stat">
            <strong>{items.length}</strong> aktif görüşme
          </span>
        </div>
      </section>
      {inboxError ? (
        <p className="notice messages-inbox__error">{inboxError}</p>
      ) : null}
      {loading ? (
        <p className="meta">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <section className="panel account-empty-panel">
          <p className="account-empty-panel__text">
            Henüz mesajın yok. Bir ilan sayfasından satıcıya yazabilirsin.
          </p>
          <Link className="btn btn-nakits-cta account-empty-panel__cta" href="/listings">
            İlanlara git
          </Link>
        </section>
      ) : (
        <ul className="messages-inbox-list">
          {items.map((c) => (
            <li key={c.id} className="messages-inbox-list__item">
              <div className="panel messages-inbox-card">
                <div className="messages-inbox-card__row">
                  <Link
                    href={`/mesajlar/${c.id}`}
                    className="messages-inbox-card__main-link"
                  >
                    <Image
                      src={c.listingImage}
                      alt=""
                      width={72}
                      height={72}
                      className="messages-inbox-card__image"
                    />
                    <div className="messages-inbox-card__content">
                      <p className="messages-inbox-card__title-row">
                        <span>{c.listingTitle}</span>
                        {c.unreadCount ? (
                          <span className="messages-inbox-card__unread-pill">
                            {c.unreadCount > 99 ? "99+" : c.unreadCount}
                          </span>
                        ) : null}
                      </p>
                      <p className="meta messages-inbox-card__time">
                        {formatRelativeTimeTr(c.sortAt)}
                      </p>
                    </div>
                  </Link>
                  <div className="messages-inbox-card__actions">
                    <button
                      type="button"
                      className="btn btn-nakits-outline messages-inbox-card__delete-btn"
                      disabled={deletingId !== null}
                      aria-label="Görüşmeyi sil"
                      title="Bu görüşmedeki mesajların tamamını sil"
                      onClick={(ev) =>
                        void handleDeleteConversation(c.id, ev)
                      }
                    >
                      {deletingId === c.id ? "…" : "Sil"}
                    </button>
                  </div>
                </div>
                <div className="messages-inbox-card__party">
                  <span className="messages-inbox-card__party-label">
                    {c.role === "buyer" ? "Satıcı" : "Alıcı"}:
                  </span>
                  {c.otherPartyPublicCode ? (
                    <Link
                      href={`/kullanici/${c.otherPartyPublicCode}`}
                      className="messages-inbox-card__party-link"
                    >
                      {c.otherPartyName}
                    </Link>
                  ) : (
                    <span className="messages-inbox-card__party-name-plain">
                      {c.otherPartyName}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
