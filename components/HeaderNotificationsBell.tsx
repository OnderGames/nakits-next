"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { formatRelativeTimeTr } from "@/lib/listings-data";
import {
  countMyUnreadNotifications,
  fetchMyNotifications,
  markAllMyNotificationsRead,
  markNotificationRead,
  notifyNotificationsRefresh,
  type AppNotificationRow
} from "@/lib/notifications";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

type Props = {
  userId: string;
  onCloseDrawer?: () => void;
};

export default function HeaderNotificationsBell({
  userId,
  onCloseDrawer
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markAllBusy, setMarkAllBusy] = useState(false);

  const load = useCallback(async () => {
    if (!hasSupabaseConfig || !userId) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setLoading(true);
    try {
      const [rows, unread] = await Promise.all([
        fetchMyNotifications(sb, userId),
        countMyUnreadNotifications(sb, userId)
      ]);
      setItems(rows);
      setUnreadCount(unread);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onCustom = () => {
      void load();
    };
    window.addEventListener("nakits-notifications", onCustom);
    return () => window.removeEventListener("nakits-notifications", onCustom);
  }, [load]);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId || !open) return;
    void load();
  }, [open, load, userId]);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;

    let channel: RealtimeChannel | null = null;
    const onNotifDb = (): void => {
      void load();
    };
    const filter = `profile_id=eq.${userId}`;
    channel = sb
      .channel(`nakits-header-notif:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter
        },
        onNotifDb
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter
        },
        onNotifDb
      )
      .subscribe();

    const tick = window.setInterval(() => {
      if (!open && document.visibilityState === "visible") void load();
    }, 45000);

    return () => {
      window.clearInterval(tick);
      if (channel) void sb.removeChannel(channel);
    };
  }, [userId, load, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDoc(e: MouseEvent) {
      const root = wrapRef.current;
      if (!root?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  const unreadLabel = useMemo(() => {
    if (unreadCount <= 0) return "";
    if (unreadCount > 99) return "99+";
    return String(unreadCount);
  }, [unreadCount]);

  function handleOpenItem(n: AppNotificationRow) {
    setOpen(false);
    onCloseDrawer?.();
    if (!hasSupabaseConfig || n.readAt) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    void markNotificationRead(sb, n.id).then(() => {
      notifyNotificationsRefresh();
      void load();
    });
  }

  async function handleMarkAll() {
    if (!hasSupabaseConfig) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setMarkAllBusy(true);
    try {
      await markAllMyNotificationsRead(sb, userId);
      notifyNotificationsRefresh();
      await load();
    } finally {
      setMarkAllBusy(false);
    }
  }

  if (!hasSupabaseConfig) return null;

  return (
    <div ref={wrapRef} className="nav-notif">
      <button
        type="button"
        className={`nav-notif__trigger ${open ? "nav-notif__trigger--open" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="nav-notif-panel"
        title="Bildirimler"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="nav-notif__icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        {unreadCount > 0 ? (
          <span className="nav-notif__badge" aria-label={`Okunmamış ${unreadCount}`}>
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id="nav-notif-panel"
          className="nav-notif__panel"
          role="dialog"
          aria-label="Bildirimler"
        >
          <div className="nav-notif__panel-head">
            <span className="nav-notif__panel-title">Bildirimler</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="nav-notif__mark-all"
                disabled={markAllBusy}
                onClick={() => void handleMarkAll()}
              >
                {markAllBusy ? "…" : "Tümünü okundu"}
              </button>
            ) : null}
          </div>
          <div className="nav-notif__list-wrap">
            {loading && items.length === 0 ? (
              <p className="nav-notif__empty">Yükleniyor…</p>
            ) : items.length === 0 ? (
              <p className="nav-notif__empty">Henüz bildirim yok.</p>
            ) : (
              <ul className="nav-notif__list">
                {items.map((n) => {
                  const unread = !n.readAt;
                  const href =
                    n.listingId != null ? `/listings/${n.listingId}` : null;

                  const content = (
                    <>
                      <p
                        className={
                          unread
                            ? "nav-notif__item-body nav-notif__item-body--unread"
                            : "nav-notif__item-body"
                        }
                      >
                        {n.body}
                      </p>
                      <span className="nav-notif__item-time">
                        {formatRelativeTimeTr(n.createdAt)}
                      </span>
                    </>
                  );

                  return (
                    <li key={n.id}>
                      {href ? (
                        <Link
                          href={href}
                          className={`nav-notif__item ${unread ? "nav-notif__item--unread" : ""}`}
                          onClick={() => handleOpenItem(n)}
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={`nav-notif__item nav-notif__item--plain ${unread ? "nav-notif__item--unread" : ""}`}
                          onClick={() => handleOpenItem(n)}
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
