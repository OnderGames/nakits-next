"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  fetchConversationParticipants,
  fetchMessages,
  markConversationRead,
  markIncomingMessagesAsRead,
  notifyUnreadRefresh,
  sendMessage,
  type ChatMessage,
  type ConversationParticipantsInfo
} from "@/lib/conversations";
import { formatRelativeTimeTr } from "@/lib/listings-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export default function ConversationPage() {
  const params = useParams();
  const rawId = params.id;
  const conversationId = Array.isArray(rawId) ? rawId[0] ?? "" : rawId ?? "";

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [convMeta, setConvMeta] = useState<ConversationParticipantsInfo | null>(
    null
  );
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendOk, setSendOk] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setAuthReady(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setAuthReady(true);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setAuthReady(true);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !hasSupabaseConfig || !conversationId || !userId) {
      if (authReady && (!conversationId || !userId)) setLoading(false);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) return;

    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    void (async () => {
      const meta = await fetchConversationParticipants(sb, conversationId);
      if (cancelled) return;
      if (
        !meta ||
        (userId !== meta.buyerId && userId !== meta.sellerId)
      ) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      setAllowed(true);
      setConvMeta(meta);

      const otherPartyId =
        userId === meta.buyerId ? meta.sellerId : meta.buyerId;

      const rows = await fetchMessages(
        sb,
        conversationId,
        userId,
        otherPartyId
      );
      if (cancelled) return;
      setMessages(rows);
      await markIncomingMessagesAsRead(sb, conversationId, userId, otherPartyId);
      await markConversationRead(sb, conversationId);
      notifyUnreadRefresh();
      setLoading(false);

      channel = sb
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`
          },
          async () => {
            const nextSb = getSupabaseBrowser();
            if (!nextSb) return;
            const next = await fetchMessages(
              nextSb,
              conversationId,
              userId,
              otherPartyId
            );
            setMessages(next);
            await markIncomingMessagesAsRead(
              nextSb,
              conversationId,
              userId,
              otherPartyId
            );
            await markConversationRead(nextSb, conversationId);
            notifyUnreadRefresh();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "message_reads"
          },
          async () => {
            const nextSb = getSupabaseBrowser();
            if (!nextSb) return;
            const next = await fetchMessages(
              nextSb,
              conversationId,
              userId,
              otherPartyId
            );
            setMessages(next);
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      const cleanupSb = getSupabaseBrowser();
      if (channel && cleanupSb) void cleanupSb.removeChannel(channel);
    };
  }, [authReady, conversationId, userId]);

  /** Realtime kapalı / yayın yoksa bile karşı taraf mesajları görsün diye yedek yenileme */
  useEffect(() => {
    if (!allowed || !conversationId || !userId || !convMeta) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;

    const otherPartyId =
      userId === convMeta.buyerId ? convMeta.sellerId : convMeta.buyerId;

    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible")
        return;
      void (async () => {
        const next = await fetchMessages(
          sb,
          conversationId,
          userId,
          otherPartyId
        );
        setMessages(next);
        await markIncomingMessagesAsRead(sb, conversationId, userId, otherPartyId);
        await markConversationRead(sb, conversationId);
        notifyUnreadRefresh();
      })();
    };

    const intervalMs = 12000;
    const tick = window.setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [allowed, conversationId, userId, convMeta]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    setSendError("");
    setSendOk(false);
    const sb = getSupabaseBrowser();
    if (!sb || !conversationId) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    const res = await sendMessage(sb, conversationId, text);
    setSending(false);
    if (res.error) {
      setSendError(res.error);
      return;
    }
    setDraft("");
    setSendOk(true);
    window.setTimeout(() => setSendOk(false), 5000);
    notifyUnreadRefresh();
    if (!convMeta || !userId) return;
    const otherPartyId =
      userId === convMeta.buyerId ? convMeta.sellerId : convMeta.buyerId;
    const next = await fetchMessages(sb, conversationId, userId, otherPartyId);
    setMessages(next);
    await markIncomingMessagesAsRead(sb, conversationId, userId, otherPartyId);
    await markConversationRead(sb, conversationId);
    notifyUnreadRefresh();
  }

  if (!authReady) {
    return (
      <div className="account-page">
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <div className="account-page">
        <p className="notice">Supabase yapılandırması yok.</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="account-page">
        <h1 className="section-title">Mesaj</h1>
        <section className="panel">
          <Link href={`/login?next=${encodeURIComponent(`/mesajlar/${conversationId}`)}`}>
            Giriş yap
          </Link>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="account-page">
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  if (allowed === false) {
    return (
      <div className="account-page">
        <h1 className="section-title">Mesaj</h1>
        <section className="panel">
          <p>Bu görüşmeye erişemezsin veya konuşma yok.</p>
          <Link href="/mesajlar">Mesajlarıma dön</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="account-page">
      <p className="meta" style={{ marginBottom: 8 }}>
        <Link href="/mesajlar">← Mesajlarım</Link>
      </p>
      <h1 className="section-title" style={{ fontSize: 22 }}>
        {convMeta?.listingTitle || "Mesaj"}
      </h1>
      {convMeta && userId ? (
        <div className="messages-inbox-card__party messages-inbox-card__party--thread">
          <span className="messages-inbox-card__party-label">
            {userId === convMeta.buyerId ? "Satıcı" : "Alıcı"}:
          </span>
          {userId === convMeta.buyerId ? (
            convMeta.sellerPublicCode ? (
              <Link
                href={`/kullanici/${convMeta.sellerPublicCode}`}
                className="messages-inbox-card__party-link"
              >
                {convMeta.sellerName}
              </Link>
            ) : (
              <span className="messages-inbox-card__party-name-plain">
                {convMeta.sellerName}
              </span>
            )
          ) : convMeta.buyerPublicCode ? (
            <Link
              href={`/kullanici/${convMeta.buyerPublicCode}`}
              className="messages-inbox-card__party-link"
            >
              {convMeta.buyerName}
            </Link>
          ) : (
            <span className="messages-inbox-card__party-name-plain">
              {convMeta.buyerName}
            </span>
          )}
        </div>
      ) : null}

      <section
        className="panel"
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "min(70vh, 560px)",
          padding: 0,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
        >
          {messages.length === 0 ? (
            <p className="account-empty-panel__text" style={{ margin: 0 }}>
              Henüz mesaj yok. İlk mesajı sen gönder.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === userId;
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "min(100%, 420px)",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: mine ? "var(--primary)" : "var(--border)",
                    color: mine ? "#fff" : "var(--text)",
                    position: "relative"
                  }}
                >
                  <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                    {m.body}
                  </p>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 11,
                      opacity: mine ? 0.88 : 0.85
                    }}
                  >
                    {formatRelativeTimeTr(m.createdAt)}
                  </p>
                  {mine && m.readByOtherAt ? (
                    <p
                      className="chat-read-receipt"
                      style={{
                        margin: "6px 0 0",
                        fontSize: 11,
                        opacity: 0.92,
                        fontWeight: 600
                      }}
                    >
                      Görüldü · {formatRelativeTimeTr(m.readByOtherAt)}
                    </p>
                  ) : null}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => void handleSend(e)}
          style={{
            borderTop: "1px solid var(--border)",
            padding: 12,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "flex-end"
          }}
        >
          <textarea
            rows={2}
            placeholder="Yanıt yaz…"
            value={draft}
            disabled={sending}
            onChange={(e) => setDraft(e.target.value)}
            style={{ flex: "1 1 200px", minHeight: 44, resize: "vertical" }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !draft.trim()}
            aria-busy={sending}
          >
            {sending ? "Gönderiliyor…" : "Gönder"}
          </button>
        </form>
      </section>
      {sendOk && (
        <p
          className="notice"
          role="status"
          aria-live="polite"
          style={{
            marginTop: 12,
            background: "#dcfce7",
            borderColor: "#bbf7d0",
            color: "#14532d"
          }}
        >
          Mesajınız gönderildi.
        </p>
      )}
      {sendError && (
        <p className="notice" style={{ marginTop: 12 }}>
          {sendError}
        </p>
      )}
    </div>
  );
}
