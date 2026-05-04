"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import {
  fetchLastMessageSnippetByConversations,
  fetchMyConversations,
  fetchMessages,
  fetchTotalUnreadMessages,
  markConversationRead,
  markIncomingMessagesAsRead,
  notifyUnreadRefresh,
  sendMessage,
  type ChatMessage,
  type ConversationSummary
} from "@/lib/conversations";
import { formatRelativeTimeTr } from "@/lib/listings-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

const POLL_MS = 22000;
const LIST_MAX = 14;

/** Girişli kullanıcı: sağ altta önizleme (Mesajlarım’a girmeden gelen özeti). */
export default function MessagesPeekDock() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [snippets, setSnippets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyErr, setReplyErr] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const rowsRef = useRef(rows);
  const panelRef = useRef<HTMLDivElement>(null);
  const threadBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const selectedRow = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const hideForRoute = useMemo(() => {
    if (!pathname) return true;
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/auth/")
    ) {
      return true;
    }
    /** Tam mesaj akışının olduğu yerde tekrar gösterme */
    if (pathname.startsWith("/mesajlar")) {
      return true;
    }
    return false;
  }, [pathname]);

  useEffect(() => {
    if (hideForRoute) setOpen(false);
  }, [hideForRoute]);

  const loadAll = useCallback(async () => {
    if (!hasSupabaseConfig || !userId) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;

    const [conv, unread] = await Promise.all([
      fetchMyConversations(sb, userId),
      fetchTotalUnreadMessages(sb)
    ]);
    setTotalUnread(unread);

    const top = conv.slice(0, LIST_MAX);
    setRows(top);

    const ids = top.map((r) => r.id);
    if (ids.length) {
      const sn = await fetchLastMessageSnippetByConversations(sb, ids);
      setSnippets(sn);
    } else {
      setSnippets({});
    }
  }, [userId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;

    void sb.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || hideForRoute) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        if (!cancelled) await loadAll();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();

    const onUnread = () => {
      void loadAll();
    };
    window.addEventListener("nakits-unread", onUnread);

    const onVis = () => {
      if (document.visibilityState === "visible") void loadAll();
    };
    document.addEventListener("visibilitychange", onVis);

    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadAll();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("nakits-unread", onUnread);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(tick);
    };
  }, [userId, hideForRoute, loadAll]);

  useEffect(() => {
    if (!open || !userId) return;
    void loadAll();
  }, [open, userId, loadAll]);

  useEffect(() => {
    if (!open) {
      setReplyDraft("");
      setReplyErr("");
      setReplySending(false);
      setSelectedId(null);
      setChatMessages([]);
      setChatLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !userId || !selectedId || !hasSupabaseConfig) {
      if (!selectedId || !open) setChatMessages([]);
      return;
    }

    const peekSb = getSupabaseBrowser();
    if (!peekSb) return;
    const db: SupabaseClient = peekSb;
    const conversationId = selectedId;
    const viewerId = userId;

    let cancelled = false;
    setChatMessages([]);

    async function pullThread() {
      const row = rowsRef.current.find((r) => r.id === conversationId);
      if (!row) return;
      const msgs = await fetchMessages(
        db,
        conversationId,
        viewerId,
        row.otherPartyId
      );
      if (cancelled) return;
      setChatMessages(msgs);
      try {
        await markIncomingMessagesAsRead(
          db,
          conversationId,
          viewerId,
          row.otherPartyId
        );
        await markConversationRead(db, conversationId);
        notifyUnreadRefresh();
      } catch {
        /* özeti yine güncellenir */
      }
    }

    async function bootstrap() {
      const row = rowsRef.current.find((r) => r.id === conversationId);
      if (!row) {
        setChatLoading(false);
        return;
      }
      setChatLoading(true);
      await pullThread();
      if (!cancelled) setChatLoading(false);
    }

    void bootstrap();

    let channel: RealtimeChannel | null = null;

    channel = db
      .channel(`nakits-msg-peek:${conversationId}:${viewerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        async () => {
          if (document.visibilityState !== "visible") return;
          await pullThread();
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
          if (document.visibilityState !== "visible") return;
          await pullThread();
        }
      )
      .subscribe();

    const intervalMs = 12000;
    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void pullThread();
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(tick);
      if (channel) void db.removeChannel(channel);
    };
  }, [open, selectedId, userId]);

  useEffect(() => {
    if (!selectedId || !open) return;
    threadBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, selectedId, open]);

  const handleReplySubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!hasSupabaseConfig || !userId || !selectedRow) return;
      const text = replyDraft.trim();
      if (!text || replySending) return;

      const sb = getSupabaseBrowser();
      if (!sb) {
        setReplyErr("Bağlantı yok.");
        return;
      }

      setReplyErr("");
      setReplySending(true);
      const res = await sendMessage(sb, selectedRow.id, text);
      if (res.error) {
        setReplyErr(res.error);
        setReplySending(false);
        return;
      }

      try {
        await markIncomingMessagesAsRead(
          sb,
          selectedRow.id,
          userId,
          selectedRow.otherPartyId
        );
        await markConversationRead(sb, selectedRow.id);
      } catch {
        /* okunma güncellemesi başarısız olsa da mesaj gitti */
      }

      const nextMsgs = await fetchMessages(
        sb,
        selectedRow.id,
        userId,
        selectedRow.otherPartyId
      );
      setChatMessages(nextMsgs);

      setReplyDraft("");
      setReplySending(false);
      notifyUnreadRefresh();
      void loadAll();
    },
    [
      userId,
      selectedRow,
      replyDraft,
      replySending,
      loadAll
    ]
  );

  /** Esc ile kapat */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /** Panel dışı tıklanınca kapat */
  useEffect(() => {
    if (!open) return;

    function onDocPointerDown(e: PointerEvent) {
      const panel = panelRef.current;
      const target = e.target as Node | null;
      if (!panel || !target || panel.contains(target)) return;
      const fabId = document.getElementById("nakits-msg-peek-trigger");
      if (fabId?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [open]);

  if (!mounted || !hasSupabaseConfig || hideForRoute || !userId) {
    return null;
  }

  return (
    <div className="msg-peek" aria-live="polite">
      <div
        ref={panelRef}
        id="nakits-msg-peek-panel"
        className={`msg-peek__panel ${open ? "msg-peek__panel--open" : ""}`}
        role="dialog"
        aria-modal={false}
        aria-label="Mesaj önizleme"
        aria-hidden={!open}
      >
        <div className="msg-peek__panel-head">
          <span className="msg-peek__panel-title">Mesajlarınız</span>
          <span className="msg-peek__panel-sub">
            {totalUnread > 0 ? (
              <strong>{totalUnread}</strong>
            ) : (
              <>Güncel</>
            )}{" "}
            · son yazışmalar
          </span>
          <button
            type="button"
            className="msg-peek__panel-close"
            aria-label="Kapat"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="msg-peek__panel-mid">
          <div className="msg-peek__scroll">
            {selectedRow ? (
              <>
                <div className="msg-peek__thread-head">
                  <button
                    type="button"
                    className="msg-peek__thread-back"
                    onClick={() => setSelectedId(null)}
                  >
                    ← Görüşmeler
                  </button>
                  <span className="msg-peek__thread-party">
                    {selectedRow.role === "buyer" ? "Satıcı" : "Alıcı"}:{" "}
                    {selectedRow.otherPartyName}
                  </span>
                </div>
                <div className="msg-peek__thread">
                  <p className="msg-peek__thread-listing-title">
                    {selectedRow.listingTitle}
                  </p>
                  {chatLoading && chatMessages.length === 0 ? (
                    <p className="msg-peek__thread-empty">
                      Mesajlar yükleniyor…
                    </p>
                  ) : chatMessages.length === 0 ? (
                    <p className="msg-peek__thread-empty">
                      Henüz mesaj yok; aşağıdan yazabilirsiniz.
                    </p>
                  ) : (
                    chatMessages.map((m) => {
                      const mine = m.senderId === userId;
                      return (
                        <div
                          key={m.id}
                          className={
                            mine
                              ? "msg-peek__bubble msg-peek__bubble--mine"
                              : "msg-peek__bubble msg-peek__bubble--theirs"
                          }
                        >
                          <p className="msg-peek__bubble-body">{m.body}</p>
                          <time className="msg-peek__bubble-time">
                            {formatRelativeTimeTr(m.createdAt)}
                          </time>
                          {mine && m.readByOtherAt ? (
                            <p className="msg-peek__bubble-read">
                              Görüldü ·{" "}
                              {formatRelativeTimeTr(m.readByOtherAt)}
                            </p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                  <div ref={threadBottomRef} className="msg-peek__thread-end" />
                </div>
              </>
            ) : loading && rows.length === 0 ? (
              <p className="msg-peek__empty">Yükleniyor…</p>
            ) : rows.length === 0 ? (
              <p className="msg-peek__empty">
                Henüz görüşmeniz yok. İlanlardan yazışmaya başlayın.
              </p>
            ) : (
              <ul className="msg-peek__list">
                {rows.map((c) => {
                  const snip = snippets[c.id] ?? "…";
                  const roleLabel =
                    c.role === "buyer" ? "Satıcı" : "Alıcı";
                  const selected = selectedId === c.id;

                  return (
                    <li
                      key={c.id}
                      className={
                        selected
                          ? "msg-peek__item msg-peek__item--selected"
                          : "msg-peek__item"
                      }
                    >
                      <div className="msg-peek__item-row">
                        <button
                          type="button"
                          className="msg-peek__select"
                          onClick={() =>
                            setSelectedId((prev) =>
                              prev === c.id ? null : c.id
                            )
                          }
                          aria-pressed={selected}
                        >
                          <Image
                            src={c.listingImage}
                            alt=""
                            width={48}
                            height={48}
                            className="msg-peek__thumb"
                          />
                          <div className="msg-peek__text">
                            <div className="msg-peek__row1">
                              <span className="msg-peek__listing">
                                {c.listingTitle}
                              </span>
                              {(c.unreadCount ?? 0) > 0 ? (
                                <span className="msg-peek__badge">
                                  {c.unreadCount! > 99
                                    ? "99+"
                                    : c.unreadCount}
                                </span>
                              ) : null}
                            </div>
                            <span className="msg-peek__party-line">
                              {roleLabel}: {c.otherPartyName}
                            </span>
                            <p className="msg-peek__snippet">{snip}</p>
                            <time className="msg-peek__time">
                              {formatRelativeTimeTr(c.sortAt)}
                            </time>
                          </div>
                        </button>
                        <Link
                          href={`/mesajlar/${c.id}`}
                          className="msg-peek__open-thread"
                          title="Tam sohbet"
                          aria-label="Tam sohbeti aç"
                          onClick={() => setOpen(false)}
                        >
                          ↗
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="msg-peek__reply">
            {selectedRow ? (
              <form onSubmit={(ev) => void handleReplySubmit(ev)}>
                <textarea
                  className="msg-peek__reply-input"
                  rows={2}
                  value={replyDraft}
                  disabled={replySending}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder={`${selectedRow.otherPartyName} kişisine yazın…`}
                  maxLength={4000}
                  enterKeyHint="send"
                />
                {replyErr ? (
                  <p className="msg-peek__reply-error" role="alert">
                    {replyErr}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="msg-peek__reply-submit"
                  disabled={
                    replySending || replyDraft.trim().length === 0
                  }
                >
                  {replySending ? "Gönderiliyor…" : "Gönder"}
                </button>
              </form>
            ) : (
              <p className="msg-peek__reply-hint">
                Cevap yazmak için yukarıdan bir görüşmeye dokunun.
              </p>
            )}
          </div>
        </div>

        <Link
          href="/mesajlar"
          className="msg-peek__full"
          onClick={() => setOpen(false)}
        >
          Mesajlarım’a git →
        </Link>
      </div>

      <button
        type="button"
        id="nakits-msg-peek-trigger"
        className="msg-peek__fab"
        aria-expanded={open}
        aria-controls="nakits-msg-peek-panel"
        title="Mesajlarınızı aç · kapat"
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {totalUnread > 0 ? (
          <span className="msg-peek__fab-badge">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        ) : null}
      </button>
    </div>
  );
}
