"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { AccountNavIcon } from "@/components/account/AccountNavIcons";
import {
  accountNavItemActive,
  mergeAccountNavItems,
  type AccountNavItemDef
} from "@/lib/account-nav";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

function userInitials(displayName: string, email: string | null): string {
  const t = displayName.trim();
  if (t) {
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0];
      const b = parts[1][0];
      if (a && b) return `${a}${b}`.toUpperCase();
    }
    return t.slice(0, 2).toUpperCase() || "Ü";
  }
  if (email && email.length >= 2) {
    return email.slice(0, 2).toUpperCase();
  }
  return "Ü";
}

function NavLinksList({
  items,
  pathname,
  onNavigate
}: {
  items: AccountNavItemDef[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <ul className="nav-account__link-list" role="menu">
      {items.map((item) => {
        const active = accountNavItemActive(pathname, item.href);
        return (
          <li key={item.href} role="none">
            <Link
              href={item.href}
              className={
                active
                  ? "nav-account__link nav-account__link--active"
                  : "nav-account__link"
              }
              role="menuitem"
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              <span className="nav-account__link-icon">
                <AccountNavIcon name={item.icon} />
              </span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  user: User;
  /** Mobil çekmece kapat */
  onCloseDrawer?: () => void;
};

export default function HeaderAccountMenu({ user, onCloseDrawer }: Props) {
  const desktopPanelId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const [desktopOpen, setDesktopOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [metaReady, setMetaReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const email = user.email ?? null;
  const uid = user.id;

  const loadMeta = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setDisplayName(email?.split("@")[0] ?? "Üye");
      setMetaReady(true);
      setIsAdmin(false);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setMetaReady(true);
      return;
    }
    const {
      data: { session }
    } = await sb.auth.getSession();
    const token = session?.access_token;
    const em = session?.user?.email ?? email;

    let admin = false;
    if (token) {
      try {
        const r = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const j = (await r.json()) as { admin?: boolean };
        admin = Boolean(j.admin);
      } catch {
        admin = false;
      }
    }
    setIsAdmin(admin);

    const meta = session?.user?.user_metadata as { full_name?: string } | undefined;
    const metaName = meta?.full_name?.trim() ?? "";

    const { data: prof } = await sb.from("profiles").select("full_name").eq("id", uid).maybeSingle();
    const fn = (prof?.full_name as string | undefined)?.trim() ?? "";
    const name = fn || metaName || (em ? em.split("@")[0] : "");
    setDisplayName(name || "Üye");
    setMetaReady(true);
  }, [uid, email]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (!desktopOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDesktopOpen(false);
    }
    function onDoc(e: MouseEvent) {
      const root = wrapRef.current;
      if (!root?.contains(e.target as Node)) setDesktopOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [desktopOpen]);

  const navItems = useMemo(() => mergeAccountNavItems(isAdmin), [isAdmin]);
  const greeting = displayName || email?.split("@")[0] || "Üye";
  const initials = userInitials(metaReady ? greeting : "", email);

  const closeDrawer = useCallback(() => {
    onCloseDrawer?.();
  }, [onCloseDrawer]);

  async function handleSignOut() {
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    setDesktopOpen(false);
    closeDrawer();
    router.refresh();
  }

  const linkAfterNav = closeDrawer;

  return (
    <div ref={wrapRef} className="nav-account">
      {/* Mobil çekmece: <details> ile aç/kapat */}
      <details className="nav-account__mobile-wrap">
        <summary className="nav-account__mobile-trigger">
          <span className="nav-account__avatar" aria-hidden>
            {initials}
          </span>
          <span className="nav-account__mobile-text">
            <span className="nav-account__name">{metaReady ? greeting : "…"}</span>
            <span className="nav-account__hint">Hesabım · dokunarak genişlet</span>
          </span>
          <span className="nav-account__chevron" aria-hidden>
            ›
          </span>
        </summary>
        <div className="nav-account__mobile-body">
          <NavLinksList
            items={navItems}
            pathname={pathname}
            onNavigate={linkAfterNav}
          />
          <button
            type="button"
            className="nav-account__signout-btn"
            onClick={() => void handleSignOut()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Güvenli çıkış
          </button>
        </div>
      </details>

      {/* Masaüstü */}
      <div className="nav-account__desktop-wrap">
        <button
          type="button"
          className={`nav-account__desk-trigger ${desktopOpen ? "nav-account__desk-trigger--open" : ""}`}
          aria-expanded={desktopOpen}
          aria-haspopup="true"
          aria-controls={desktopPanelId}
          onClick={() => setDesktopOpen((o) => !o)}
        >
          <span className="nav-account__avatar nav-account__avatar--desk">
            {initials}
          </span>
          <span className="nav-account__desk-label">
            <span className="nav-account__name-short">
              {metaReady ? greeting : "…"}
            </span>
            <svg
              className="nav-account__caret"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>

        {desktopOpen ? (
          <div
            id={desktopPanelId}
            className="nav-account__dropdown"
            role="menu"
          >
            <p className="nav-account__dropdown-meta">
              {isAdmin ? "Yönetici" : "Bireysel hesap"}
              {email ? (
                <>
                  {" · "}
                  <span className="nav-account__email-mini">{email}</span>
                </>
              ) : null}
            </p>
            <NavLinksList
              items={navItems}
              pathname={pathname}
              onNavigate={() => setDesktopOpen(false)}
            />
            <button
              type="button"
              className="nav-account__signout-btn nav-account__signout-btn--dropdown"
              role="menuitem"
              onClick={() => void handleSignOut()}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Güvenli çıkış
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
