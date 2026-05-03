"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { fetchTotalUnreadMessages } from "@/lib/conversations";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    setUser(null);
  }

  const loggedIn = Boolean(user);
  const showAuth = hasSupabaseConfig;

  return (
    <header className="topbar">
      <div className="container nav">
        <Link className="brand-mark" href="/" aria-label="Nakits — ana sayfa">
          <span className="brand-mark__icon" aria-hidden>
            <svg
              className="brand-mark__svg"
              viewBox="0 0 32 32"
              width="32"
              height="32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="32"
                height="32"
                rx="10"
                fill="url(#nakitsBrandMarkGrad)"
              />
              <path
                d="M10 24V8M10 8l12 16M22 8v16"
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="nakitsBrandMarkGrad"
                  x1="2"
                  y1="2"
                  x2="32"
                  y2="32"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#4f46e5" />
                  <stop offset="0.55" stopColor="#4f39f6" />
                  <stop offset="1" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="brand-mark__word">Nakits</span>
        </Link>

        <nav
          id="site-menu"
          className={`menu ${menuOpen ? "menu--open" : ""}`}
          aria-label="Site menüsü"
        >
          <div className="menu__header">
            <span className="menu__title">Menü</span>
            <button
              type="button"
              className="menu__close"
              aria-label="Menüyü kapat"
              onClick={() => setMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7A1 1 0 1 0 5.7 7.1L10.6 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z"
                />
              </svg>
            </button>
          </div>

          <Link className="nav-pill" href="/listings">
            İlanlar
          </Link>
          {loggedIn && (
            <Link
              className="nav-pill nav-pill--badged"
              href="/mesajlar"
              title="Mesajların — gelen kutusu ve tüm yazışmalar"
              style={{
                paddingRight: unreadMessages > 0 ? 16 : undefined
              }}
            >
              Mesajlarım
              {unreadMessages > 0 && (
                <span
                  aria-label={`Okunmamış ${unreadMessages} mesaj`}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -4,
                    minWidth: 20,
                    height: 20,
                    padding: "0 6px",
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #f87171, #dc2626)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    lineHeight: "20px",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(220,38,38,0.45)",
                    border: "2px solid #fff"
                  }}
                >
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
            </Link>
          )}
          <Link className="nav-cta" href="/add-listing">
            + İlan ver
          </Link>

          {!ready ? (
            <span className="meta menu__loading">…</span>
          ) : showAuth ? (
            loggedIn ? (
              <>
                {isAdmin && (
                  <Link className="nav-pill" href="/admin/moderasyon">
                    Moderasyon
                  </Link>
                )}
                <Link className="nav-pill" href="/profile">
                  Profilim
                </Link>
                <Link className="nav-pill" href="/ilanlarim">
                  İlanlarım
                </Link>
                <button
                  type="button"
                  className="nav-pill nav-pill--quiet"
                  onClick={() => void handleSignOut()}
                >
                  Çıkış yap
                </button>
              </>
            ) : (
              <>
                <Link className="nav-pill nav-pill--join" href="/register">
                  Üye ol
                </Link>
                <Link className="nav-pill nav-pill--login" href="/login">
                  Giriş yap
                </Link>
              </>
            )
          ) : (
            <>
              <Link className="nav-pill nav-pill--join" href="/register">
                Üye ol
              </Link>
              <Link className="nav-pill nav-pill--login" href="/login">
                Giriş yap
              </Link>
            </>
          )}
        </nav>

        <div className="nav-mobile-bar">
          <Link
            className="nav-cta nav-cta--toolbar"
            href="/add-listing"
            onClick={() => setMenuOpen(false)}
          >
            + İlan ver
          </Link>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg
                className="nav-toggle__svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7A1 1 0 1 0 5.7 7.1L10.6 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z"
                />
              </svg>
            ) : (
              <svg
                className="nav-toggle__svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            )}
          </button>
        </div>

        {menuOpen ? (
          <button
            type="button"
            className="nav-backdrop"
            tabIndex={-1}
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
        ) : null}
      </div>
    </header>
  );
}
