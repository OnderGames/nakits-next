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
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  /** null: henüz ölçülmedi (SSR / ilk boyama ile uyum için menüde küme) */
  const [isMobileNav, setIsMobileNav] = useState<boolean | null>(null);

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
    const mq = window.matchMedia("(max-width: 959px)");
    const sync = () => setIsMobileNav(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const loggedIn = Boolean(user);
  /** Mobil + giriş: tek küme üst çubukta; çift bildirim/h hesap mount önlenir */
  const authMobileToolbar =
    Boolean(user) && ready && isMobileNav === true;
  const showUserClusterToolbar = authMobileToolbar;
  const showUserClusterMenu = Boolean(user) && ready && !authMobileToolbar;
  /** Mobil: giriş yokken çekmece yerine üst bardaki Giriş / Üye Ol */
  const guestMobileInline = ready && !user;

  return (
    <header className="topbar">
      <div
        className={`container nav${authMobileToolbar ? " nav--auth-mobile-tray" : ""}${guestMobileInline ? " nav-mobile-inline-guest" : ""}`}
      >
        <div className="nav__leading">
          <Link className="brand-mark" href="/" aria-label="Nakits.com — ana sayfa">
            <span className="brand-mark__text">
              <span className="brand-mark__nakits">Nakits</span>
              <span className="brand-mark__domain">.com</span>
            </span>
          </Link>

          <div
            className={`nav-mobile-bar${authMobileToolbar ? " nav-mobile-bar--auth" : ""}`}
          >
            {guestMobileInline ? (
              <>
                <Link
                  className="nav-pill nav-pill--login nav-mobile-bar__guest-pill"
                  href="/login"
                >
                  Giriş Yap
                </Link>
                <Link
                  className="nav-pill nav-pill--join nav-mobile-bar__guest-pill"
                  href="/register"
                >
                  Üye Ol
                </Link>
              </>
            ) : null}
            {showUserClusterToolbar && user ? (
              <div className="nav-user-cluster nav-user-cluster--toolbar-mobile">
                <HeaderNotificationsBell userId={user.id} />
                <HeaderAccountMenu user={user} />
              </div>
            ) : null}
            <Link className="nav-cta nav-cta--orange nav-cta--toolbar" href="/add-listing">
              İlan Ver
            </Link>
          </div>
        </div>

        <Suspense fallback={<HeaderSearchFallback />}>
          <HeaderSearchBar />
        </Suspense>

        <nav id="site-menu" className="menu" aria-label="Site menüsü">
          {!ready ? (
            <span className="meta menu__loading">…</span>
          ) : loggedIn ? (
            <>
              {showUserClusterMenu && user ? (
                <div className="nav-user-cluster nav-user-cluster--desktop-only">
                  <HeaderNotificationsBell userId={user.id} />
                  <HeaderAccountMenu user={user} />
                </div>
              ) : null}
              <Link className="nav-cta nav-cta--orange" href="/add-listing">
                İlan Ver
              </Link>
            </>
          ) : (
            <>
              <Link className="nav-pill nav-pill--login" href="/login">
                Giriş Yap
              </Link>
              <Link className="nav-pill nav-pill--join" href="/register">
                Üye Ol
              </Link>
              <Link className="nav-cta nav-cta--orange" href="/add-listing">
                İlan Ver
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
