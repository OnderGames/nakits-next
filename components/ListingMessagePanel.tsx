"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
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

function sellerInitial(label: string): string {
  const t = label.trim();
  if (!t) return "?";
  return t[0].toLocaleUpperCase("tr-TR");
}

function MessagePanelIcon() {
  return (
    <span className="listing-contact-card__icon" aria-hidden>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    </span>
  );
}

function ContactCardShell({
  lede,
  children
}: {
  lede: string;
  children: ReactNode;
}) {
  return (
    <div className="listing-contact-card">
      <div className="listing-contact-card__head">
        <MessagePanelIcon />
        <div className="listing-contact-card__head-text">
          <h2 className="listing-contact-card__title">Satıcı ile iletişime geç</h2>
          <p className="listing-contact-card__lede">{lede}</p>
        </div>
      </div>
      <div className="listing-contact-card__body">{children}</div>
    </div>
  );
}

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
  const textareaId = "listing-contact-message";

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
      <ContactCardShell lede="Mesaj kutusu yükleniyor…">
        <p className="listing-contact-card__skeleton meta">Bir saniye…</p>
      </ContactCardShell>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <ContactCardShell lede="Canlı sitede güvenli mesajlaşma için yapılandırma gerekir.">
        <p className="meta listing-contact-card__muted">
          Mesajlaşma için Supabase yapılandırması gerekir.
        </p>
      </ContactCardShell>
    );
  }

  if (!sellerId) {
    return (
      <ContactCardShell lede="Bu örnek ilanda mesaj gönderimi kapalıdır.">
        <p className="meta listing-contact-card__muted">
          Bu örnek ilanda mesaj gönderilemez (canlı ilanlarda çalışır).
        </p>
      </ContactCardShell>
    );
  }

  if (!userId) {
    return (
      <ContactCardShell lede="Telefon numarası paylaşılmaz; yanıt satıcının gelen kutusuna düşer.">
        <div className="listing-contact-cta">
          <p className="listing-contact-cta__text">
            Satıcıya ilk mesajını yazmak için giriş yap.
          </p>
          <Link
            className="nav-pill nav-pill--login listing-contact-cta__btn"
            href={`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`}
          >
            Giriş yap
          </Link>
        </div>
      </ContactCardShell>
    );
  }

  if (userId === sellerId) {
    return (
      <ContactCardShell lede="Alıcılar bu ilan sayfasından sana yazabilir; gelen kutusu Mesajlarım’da.">
        <p className="meta listing-contact-card__muted listing-contact-card__muted--info">
          Bu senin ilanın. Mesajları takip etmek için{" "}
          <Link href="/mesajlar" className="listing-contact-inline-link">
            Mesajlarım
          </Link>{" "}
          sayfasını kullan.
        </p>
      </ContactCardShell>
    );
  }

  const canSend = body.trim().length > 0;

  return (
    <ContactCardShell lede="Telefon numarası paylaşılmaz; mesajın doğrudan satıcıya iletilir.">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="listing-message-form"
      >
        <div className="listing-contact-seller">
          <span
            className="listing-contact-seller__avatar"
            aria-hidden
          >
            {sellerInitial(sellerLabel)}
          </span>
          <div className="listing-contact-seller__info">
            <span className="listing-contact-seller__label">Mesaj alıcısı</span>
            {sellerPublicCode ? (
              <Link
                href={`/kullanici/${sellerPublicCode}`}
                className="listing-contact-seller__name"
              >
                {sellerLabel}
              </Link>
            ) : (
              <span className="listing-contact-seller__name listing-contact-seller__name--plain">
                {sellerLabel}
              </span>
            )}
          </div>
        </div>

        <div className="listing-contact-field">
          <label htmlFor={textareaId} className="listing-contact-field__label">
            Mesajınız
          </label>
          <textarea
            id={textareaId}
            className="listing-contact-textarea"
            rows={5}
            placeholder="Merhaba, ilanınız hakkında…"
            value={body}
            disabled={sending || sendSuccess}
            onChange={(e) => setBody(e.target.value)}
            spellCheck
          />
          {!canSend && !sending && !sendSuccess ? (
            <p className="listing-contact-field__hint meta">
              Kısa bir soru veya teklif yazın; gönderince sohbet sayfasına
              yönlendirilirsiniz.
            </p>
          ) : null}
        </div>

        <button
          className="btn btn-nakits-cta listing-contact-submit"
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

        <Link href="/mesajlar" className="listing-contact-inbox-link">
          <span>Mesajlarım — gelen kutusu</span>
          <span className="listing-contact-inbox-link__arrow" aria-hidden>
            →
          </span>
        </Link>

        {sendSuccess && (
          <p
            className="notice listing-contact-notice listing-contact-notice--success"
            role="status"
            aria-live="polite"
          >
            Mesajınız iletildi. Sohbete yönlendiriliyorsunuz…
          </p>
        )}
        {error && (
          <p className="notice listing-contact-notice listing-contact-notice--error">
            {error}
          </p>
        )}
      </form>
    </ContactCardShell>
  );
}
