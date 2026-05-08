"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useFavorites } from "@/components/FavoritesProvider";
import { openHomeCategoryDrawer } from "@/lib/open-home-category-drawer";

function isProfileArea(pathname: string): boolean {
  return (
    pathname === "/profile" ||
    pathname.startsWith("/ilanlarim") ||
    pathname.startsWith("/mesajlar") ||
    pathname === "/login" ||
    pathname === "/register"
  );
}

const NI_ON = "#c2410c";
const NI_OFF = "#5c6578";

/** Vitrin: vitrin camı / raflar — genel “ev” ikonundan farklı */
function IconShowcase({ active }: { active: boolean }) {
  const c = active ? NI_ON : NI_OFF;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5h14a2 2 0 012 2V17a2 2 0 01-2 2H5a2 2 0 01-2-2V8.5a2 2 0 012-2z"
        stroke={c}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <path
        d="M7 10.5h10M7 14h7"
        stroke={c}
        strokeWidth={1.75}
        strokeLinecap="round"
        opacity={0.85}
      />
      <circle cx="17.5" cy="15" r="1.35" fill={c} opacity={active ? 1 : 0.45} />
    </svg>
  );
}

/** Kategori çekmecesi: katmanlar + keşif imi */
function IconLayersSearch({ active }: { active: boolean }) {
  const c = active ? NI_ON : NI_OFF;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7.5h10a1.5 1.5 0 001.5-1.5v0A1.5 1.5 0 0014 4.5H4"
        stroke={c}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <path
        d="M4 12h7a2 2 0 002-2v0a2 2 0 00-2-2H4"
        stroke={c}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <path
        d="M4 16.5h5"
        stroke={c}
        strokeWidth={1.75}
        strokeLinecap="round"
        opacity={0.65}
      />
      <circle cx="17.5" cy="16.5" r="3.25" stroke={c} strokeWidth={1.75} />
      <path
        d="M19.8 18.8l2.45 2.45"
        stroke={c}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Kayıtlı ilanlar: yer imi — kalp yerine daha “liste” hissi */
function IconBookmarkStack({ active }: { active: boolean }) {
  const c = active ? NI_ON : NI_OFF;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4.5h12v15l-6-3.6-6 3.6V4.5z"
        stroke={c}
        strokeWidth={1.75}
        strokeLinejoin="round"
        fill={active ? "rgba(194,65,12,0.09)" : "none"}
      />
      <path
        d="M9 9h6M9 12.5h4.5"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.75}
      />
    </svg>
  );
}

/** Hesap: kimlik kartı silüeti — düz kullanıcı çemberinden farklı */
function IconMemberCard({ active }: { active: boolean }) {
  const c = active ? NI_ON : NI_OFF;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2z"
        stroke={c}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <circle cx="10" cy="11" r="2.25" stroke={c} strokeWidth={1.75} />
      <path
        d="M6.5 17.5c.8-1.6 2.2-2.5 3.9-2.5h.2c1.7 0 3.1.9 3.9 2.5"
        stroke={c}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <path
        d="M15.5 9h3M15.5 12h3"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.65}
      />
    </svg>
  );
}

/** İlan ver: ilan kağıdı + artı rozeti */
function IconListingPlus() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3.5h10l3 3v11a2 2 0 01-2 2H7a2 2 0 01-2-2v-12a2 2 0 012-2z"
        stroke="#fff"
        strokeWidth={1.65}
        strokeLinejoin="round"
        fill="rgba(255,255,255,0.12)"
      />
      <path
        d="M9 10h6M12 7v6"
        stroke="#fff"
        strokeWidth={1.85}
        strokeLinecap="round"
      />
      <circle cx="17.5" cy="6.5" r="3.6" fill="#fff" />
      <path
        d="M17.5 4.9v3.2M15.9 6.5h3.2"
        stroke="#0f766e"
        strokeWidth={1.5}
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

  if (!pathname) return null;

  /** Hesabım: her zaman profil merkezi; oturum yoksa auth-wall + Nakits «Giriş yap» pill */
  const accountHref = "/profile";
  const favCount =
    fav?.ready === true ? Math.min(99, fav.ids.size ?? 0) : undefined;

  return (
    <nav className="mobile-bottom-nav" aria-label="Ana gezinme">
      <div className="mobile-bottom-nav__bar">
        <TapItem
          href="/"
          label="Vitrin"
          active={pathname === "/"}
          icon={<IconShowcase active={pathname === "/"} />}
        />

        <TapItem
          label="Arama"
          active={pathname.startsWith("/listings")}
          icon={<IconLayersSearch active={pathname.startsWith("/listings")} />}
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
              <IconListingPlus />
            </span>
            <span className="mobile-bottom-nav__fab-label">İlan ver</span>
          </Link>
        </div>

        <TapItem
          href="/favoriler"
          label="Favoriler"
          active={pathname.startsWith("/favoriler")}
          badge={favCount}
          icon={<IconBookmarkStack active={pathname.startsWith("/favoriler")} />}
        />

        <TapItem
          href={accountHref}
          label="Hesabım"
          active={isProfileArea(pathname)}
          icon={<IconMemberCard active={isProfileArea(pathname)} />}
        />
      </div>
    </nav>
  );
}
