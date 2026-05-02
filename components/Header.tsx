"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchTotalUnreadMessages } from "@/lib/conversations";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const refresh = useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      setUser(null);
      setReady(true);
      return;
    }
    const { data } = await sb.auth.getSession();
    setUser(data.session?.user ?? null);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    const sb = getSupabaseBrowser();
    if (!sb) return;
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  useEffect(() => {
    if (!hasSupabaseConfig || !user) {
      setIsAdmin(false);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setIsAdmin(false);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) {
        setIsAdmin(false);
        return;
      }
      void fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((r) => r.json())
        .then((j: { admin?: boolean }) => setIsAdmin(Boolean(j.admin)))
        .catch(() => setIsAdmin(false));
    });
  }, [user]);

  const refreshUnread = useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (!sb || !user) {
      setUnreadMessages(0);
      return;
    }
    const n = await fetchTotalUnreadMessages(sb);
    setUnreadMessages(n);
  }, [user]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    const onUnread = () => void refreshUnread();
    window.addEventListener("nakits-unread", onUnread);
    window.addEventListener("focus", onUnread);
    const interval = window.setInterval(onUnread, 45000);
    return () => {
      window.removeEventListener("nakits-unread", onUnread);
      window.removeEventListener("focus", onUnread);
      window.clearInterval(interval);
    };
  }, [refreshUnread]);

  async function handleSignOut() {
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    setUser(null);
  }

  const loggedIn = Boolean(user);
  const showAuth = hasSupabaseConfig;

  return (
    <header className="topbar">
      <div className="container nav">
        <Link className="brand" href="/">
          naki<span>ts</span>
        </Link>
        <nav className="menu">
          <Link href="/listings">İlanlar</Link>
          <Link
            href="/mesajlar"
            title="Mesajların — gelen kutusu ve tüm yazışmalar"
            style={{
              position: "relative",
              paddingRight:
                loggedIn && unreadMessages > 0 ? 14 : 0
            }}
          >
            Mesajlarım
            {loggedIn && unreadMessages > 0 && (
              <span
                aria-label={`Okunmamış ${unreadMessages} mesaj`}
                style={{
                  position: "absolute",
                  top: -7,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 999,
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: "18px",
                  textAlign: "center"
                }}
              >
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </Link>
          <Link className="nav-cta" href="/add-listing">
            + İlan ver
          </Link>

          {!ready ? (
            <span className="meta">…</span>
          ) : showAuth ? (
            loggedIn ? (
              <>
                {isAdmin && (
                  <Link href="/admin/moderasyon">Moderasyon</Link>
                )}
                <Link href="/profile">Profilim</Link>
                <Link href="/ilanlarim">İlanlarım</Link>
                <button
                  type="button"
                  className="btn-nav-text"
                  onClick={() => void handleSignOut()}
                >
                  Çıkış yap
                </button>
              </>
            ) : (
              <>
                <Link href="/register">Üye ol</Link>
                <Link className="nav-login" href="/login">
                  Giriş yap
                </Link>
              </>
            )
          ) : (
            <>
              <Link href="/register">Üye ol</Link>
              <Link className="nav-login" href="/login">
                Giriş yap
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
