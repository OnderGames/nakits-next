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
import HeaderAccountMenu from "@/components/HeaderAccountMenu";
import HeaderNotificationsBell from "@/components/HeaderNotificationsBell";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

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

  const loggedIn = Boolean(user);

  return (
    <header className="topbar">
      <div className="container nav">
        <div className="nav__leading">
          <Link className="brand-mark" href="/" aria-label="Nakits.com — ana sayfa">
            <span className="brand-mark__text">
              <span className="brand-mark__nakits">Nakits</span>
              <span className="brand-mark__domain">.com</span>
            </span>
          </Link>

          <div className="nav-mobile-bar">
            <Link
              className="nav-cta nav-cta--orange nav-cta--toolbar"
              href="/add-listing"
              onClick={() => setMenuOpen(false)}
            >
              İlan Ver
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

          {!ready ? (
            <span className="meta menu__loading">…</span>
          ) : loggedIn ? (
            <>
              {user ? (
                <div className="nav-user-cluster">
                  <HeaderNotificationsBell
                    userId={user.id}
                    onCloseDrawer={() => setMenuOpen(false)}
                  />
                  <HeaderAccountMenu
                    user={user}
                    onCloseDrawer={() => setMenuOpen(false)}
                  />
                </div>
              ) : null}
              <Link
                className="nav-cta nav-cta--orange"
                href="/add-listing"
                onClick={() => setMenuOpen(false)}
              >
                İlan Ver
              </Link>
            </>
          ) : (
            <>
              <Link
                className="nav-pill nav-pill--login"
                href="/login"
                onClick={() => setMenuOpen(false)}
              >
                Giriş Yap
              </Link>
              <Link
                className="nav-pill nav-pill--join"
                href="/register"
                onClick={() => setMenuOpen(false)}
              >
                Üye Ol
              </Link>
              <Link
                className="nav-cta nav-cta--orange"
                href="/add-listing"
                onClick={() => setMenuOpen(false)}
              >
                İlan Ver
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
