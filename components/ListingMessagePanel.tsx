"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  getOrCreateConversation,
  notifyUnreadRefresh,
  sendMessage
} from "@/lib/conversations";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

type Props = {
  listingId: string;
  sellerId?: string;
  /** Profil linki için 6–9 haneli üye numarası */
  sellerPublicCode?: string;
  sellerLabel: string;
};

export default function ListingMessagePanel({
  listingId,
  sellerId,
  sellerPublicCode,
  sellerLabel
}: Props) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSendSuccess(false);
    if (!sellerId) {
      setError("Bu ilan için satıcı bilgisi yok.");
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setError("Bağlantı kurulamadı.");
      return;
    }
    const text = body.trim();
    if (!text) {
      setError("Mesaj yazın.");
      return;
    }
    setSending(true);
    const conv = await getOrCreateConversation(sb, listingId, sellerId);
    if ("error" in conv) {
      setSending(false);
      setError(conv.error);
      return;
    }
    const sent = await sendMessage(sb, conv.conversationId, text);
    if (sent.error) {
      setSending(false);
      setError(sent.error);
      return;
    }
    setBody("");
    setSendSuccess(true);
    notifyUnreadRefresh();
    window.setTimeout(() => {
      setSending(false);
      router.push(`/mesajlar/${conv.conversationId}`);
      router.refresh();
    }, 1100);
  }

  if (!ready) {
    return (
      <div>
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <p className="meta">
        Mesajlaşma için Supabase yapılandırması gerekir.
      </p>
    );
  }

  if (!sellerId) {
    return (
      <p className="meta">
        Bu örnek ilanda mesaj gönderilemez (canlı ilanlarda çalışır).
      </p>
    );
  }

  if (!userId) {
    return (
      <div>
        <p className="meta" style={{ marginBottom: 12 }}>
          Satıcıya yazmak için giriş yapın.
        </p>
        <Link
          className="btn btn-primary"
          href={`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`}
        >
          Giriş yap
        </Link>
      </div>
    );
  }

  if (userId === sellerId) {
    return (
      <p className="meta">
        Bu senin ilanın; alıcılar sana buradan mesaj gönderebilir.
      </p>
    );
  }

  const canSend = body.trim().length > 0;

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="listing-message-form"
      style={{ position: "relative", zIndex: 1 }}
    >
      <div className="messages-inbox-card__party messages-inbox-card__party--bare">
        <span className="messages-inbox-card__party-label">Satıcı:</span>
        {sellerPublicCode ? (
          <Link
            href={`/kullanici/${sellerPublicCode}`}
            className="messages-inbox-card__party-link"
          >
            {sellerLabel}
          </Link>
        ) : (
          <span className="messages-inbox-card__party-name-plain">
            {sellerLabel}
          </span>
        )}
      </div>
      <textarea
        rows={6}
        placeholder="Mesajınızı yazın…"
        value={body}
        disabled={sending || sendSuccess}
        onChange={(e) => setBody(e.target.value)}
      />
      {!canSend && !sending && !sendSuccess ? (
        <p className="meta" style={{ marginTop: 8, marginBottom: 0 }}>
          Önce mesajını yaz; ardından <strong>Mesaj gönder</strong> aktif olur.
        </p>
      ) : null}
      <button
        className="btn btn-primary"
        style={{ marginTop: 10, width: "100%" }}
        type="submit"
        disabled={!canSend || sending || sendSuccess}
        aria-busy={sending}
      >
        {sendSuccess
          ? "Gönderildi"
          : sending
            ? "Gönderiliyor…"
            : "Mesaj gönder"}
      </button>
      <p className="meta" style={{ marginTop: 12 }}>
        <Link href="/mesajlar" style={{ fontWeight: 600 }}>
          Mesajlarım — gelen kutusu
        </Link>
      </p>
      {sendSuccess && (
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
          Mesajınız gönderildi. Sohbete yönlendiriliyorsunuz…
        </p>
      )}
      {error && (
        <p
          className="notice"
          style={{
            marginTop: 12,
            background: "#fee2e2",
            borderColor: "#fecaca",
            color: "#7f1d1d"
          }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
