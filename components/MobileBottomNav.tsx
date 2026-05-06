"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useFavorites } from "@/components/FavoritesProvider";
import { openHomeCategoryDrawer } from "@/lib/open-home-category-drawer";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function isProfileArea(pathname: string): boolean {
  return (
    pathname === "/profile" ||
    pathname.startsWith("/ilanlarim") ||
    pathname.startsWith("/mesajlar") ||
    pathname === "/login" ||
    pathname === "/register"
  );
}

function IconHome({ active }: { active: boolean }) {
  const c = active ? "#ea580c" : "#475569";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 11.6L11.47 5.3a1 1 0 011.06 0L20 11.6V19a2 2 0 01-2 2h-3.75a1 1 0 01-1-1v-5h-4.5v5a1 1 0 01-1 1H6a2 2 0 01-2-2v-7.4z"
        stroke={c}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch({ active }: { active: boolean }) {
  const c = active ? "#ea580c" : "#475569";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke={c} strokeWidth={2} />
      <path
        d="M16 16l5 5"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHeart({ active }: { active: boolean }) {
  const c = active ? "#ea580c" : "#475569";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20.57l-.48-.43C7.62 16.73 5 14.41 5 11.54 5 9.2 6.8 7.4 9.05 7.4c1.74 0 3.43 1 4.06 2.47A4.62 4.62 0 0117 7.4c2.05 0 3.76 1.59 4 3.61.04.35.05.71.03 1.07-.18 3.54-5.62 8.54-9.03 11.49z"
        stroke={c}
        strokeWidth={2}
        strokeLinejoin="round"
        fill={active ? "rgba(234,88,12,0.08)" : "none"}
      />
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  const c = active ? "#ea580c" : "#475569";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="4" stroke={c} strokeWidth={2} />
      <path
        d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

type ItemProps = {
  href?: string;
  onClick?: () => void;
  label: string;
  active?: boolean;
  icon: ReactNode;
  badge?: number;
};

function TapItem({
  href,
  onClick,
  label,
  active,
  icon,
  badge
}: ItemProps) {
  const cn = active
    ? "mobile-bottom-nav__item mobile-bottom-nav__item--active"
    : "mobile-bottom-nav__item";
  const content = (
    <>
      <span className="mobile-bottom-nav__icon-wrap">
        {icon}
        {badge !== undefined && badge > 0 ? (
          <span className="mobile-bottom-nav__badge">{badge}</span>
        ) : null}
      </span>
      <span className="mobile-bottom-nav__label">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn}
      aria-current={active ? "page" : undefined}
      aria-pressed={active}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname() ?? "";
  const fav = useFavorites();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      setLoggedIn(false);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session?.user));
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!pathname) return null;

  const accountHref = loggedIn ? "/profile" : "/login";
  const favCount =
    fav?.ready === true ? Math.min(99, fav.ids.size ?? 0) : undefined;

  return (
    <nav className="mobile-bottom-nav" aria-label="Ana gezinme">
      <div className="mobile-bottom-nav__bar">
        <TapItem
          href="/"
          label="Vitrin"
          active={pathname === "/"}
          icon={<IconHome active={pathname === "/"} />}
        />

        <TapItem
          label="Arama"
          active={pathname.startsWith("/listings")}
          icon={<IconSearch active={pathname.startsWith("/listings")} />}
          onClick={() => openHomeCategoryDrawer()}
        />

        <div className="mobile-bottom-nav__fab-slot">
          <Link
            href="/add-listing"
            className={`mobile-bottom-nav__fab-link${pathname.startsWith("/add-listing") ? " mobile-bottom-nav__fab-link--active" : ""}`}
          >
            <span
              className={`mobile-bottom-nav__fab${pathname.startsWith("/add-listing") ? " mobile-bottom-nav__fab--active" : ""}`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="#fff"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="mobile-bottom-nav__fab-label">İlan ver</span>
          </Link>
        </div>

        <TapItem
          href="/favoriler"
          label="Favoriler"
          active={pathname.startsWith("/favoriler")}
          badge={favCount}
          icon={<IconHeart active={pathname.startsWith("/favoriler")} />}
        />

        <TapItem
          href={accountHref}
          label="Hesabım"
          active={isProfileArea(pathname)}
          icon={<IconUser active={isProfileArea(pathname)} />}
        />
      </div>
    </nav>
  );
}
