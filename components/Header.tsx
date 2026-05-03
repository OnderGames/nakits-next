"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useState
} from "react";
import { fetchTotalUnreadMessages } from "@/lib/conversations";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

function HeaderSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (pathname === "/listings") {
      setValue(searchParams.get("q") ?? "");
    } else {
      setValue("");
    }
  }, [pathname, searchParams]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/listings?q=${encodeURIComponent(q)}` : "/listings");
  }

  return (
    <form
      className="nav-header-search"
      onSubmit={submit}
      role="search"
      aria-label="İlan ara"
    >
      <label htmlFor="header-search-q" className="nav-header-search__label">
        Kelime, ilan no veya satıcı / mağaza adı ile ara
      </label>
      <input
        id="header-search-q"
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Kelime, ilan no veya mağaza adı ile ara…"
        autoComplete="off"
        enterKeyHint="search"
        maxLength={120}
        className="nav-header-search__input"
      />
      <button type="submit" className="nav-header-search__submit" aria-label="Ara">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M16 16l5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </form>
  );
}

function HeaderSearchFallback() {
  return (
    <div
      className="nav-header-search nav-header-search--fallback"
      aria-hidden
    />
  );
}

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
        <div className="nav__leading">
          <Link className="brand-mark" href="/" aria-label="Nakits.com — ana sayfa">
            <span className="brand-mark__text">
              <span className="brand-mark__nakit">Nakit</span>
              <span className="brand-mark__accent">s</span>
              <span className="brand-mark__domain">.com</span>
            </span>
          </Link>

          <div className="nav-mobile-bar">
            <Link
              className="nav-cta nav-cta--orange nav-cta--toolbar"
              href="/add-listing"
              onClick={() => setMenuOpen(false)}
            >
              İlan ver
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
        </div>

        <Suspense fallback={<HeaderSearchFallback />}>
          <HeaderSearchBar />
        </Suspense>

        <Link
          href={
            !hasSupabaseConfig
              ? "/listings"
              : loggedIn
                ? "/favoriler"
                : "/login?next=/favoriler"
          }
          className="nav-fav"
          title={hasSupabaseConfig ? "Favorilerim" : "İlanlar"}
          aria-label={hasSupabaseConfig ? "Favorilerim" : "İlanlar"}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M12 21s-6.716-4.432-9-8.5C.89 9.732 2.14 6 6 6c2.352 0 3.638 1.352 4 2 .362-.648 1.648-2 4-2 3.86 0 5.11 3.732 3 6.5C16.716 16.568 12 21 12 21z"
              stroke="currentColor"
              strokeWidth="1.75"
              fill="none"
            />
          </svg>
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
          {hasSupabaseConfig && (
            <Link
              className="nav-pill"
              href={loggedIn ? "/favoriler" : "/login?next=/favoriler"}
              onClick={() => setMenuOpen(false)}
            >
              Favorilerim
            </Link>
          )}
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
          <Link className="nav-cta nav-cta--orange" href="/add-listing">
            İlan ver
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
