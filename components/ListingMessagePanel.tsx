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
    setSending(false);
    if (sent.error) {
      setError(sent.error);
      return;
    }
    setBody("");
    notifyUnreadRefresh();
    router.push(`/mesajlar/${conv.conversationId}`);
    router.refresh();
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

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <p className="meta" style={{ marginBottom: 10 }}>
        Satıcı:{" "}
        {sellerPublicCode ? (
          <Link
            href={`/kullanici/${sellerPublicCode}`}
            style={{ color: "var(--primary)", fontWeight: 700 }}
          >
            {sellerLabel}
          </Link>
        ) : (
          <strong>{sellerLabel}</strong>
        )}
      </p>
      <textarea
        rows={6}
        placeholder="Mesajınızı yazın…"
        value={body}
        disabled={sending}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        className="btn btn-primary"
        style={{ marginTop: 10, width: "100%" }}
        type="submit"
        disabled={sending}
      >
        {sending ? "Gönderiliyor…" : "Mesaj gönder"}
      </button>
      <p className="meta" style={{ marginTop: 12 }}>
        <Link href="/mesajlar">Mesajlarım</Link>
      </p>
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
