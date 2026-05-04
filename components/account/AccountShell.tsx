"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { AccountNavIcon } from "@/components/account/AccountNavIcons";
import {
  accountNavItemActive,
  mergeAccountNavItems
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

export default function AccountShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setReady(true);
      setIsAdmin(false);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setReady(true);
      setIsAdmin(false);
      return;
    }
    const {
      data: { session }
    } = await sb.auth.getSession();
    const uid = session?.user?.id ?? null;
    const em = session?.user?.email ?? null;
    setEmail(em);
    const token = session?.access_token;
    if (token) {
      try {
        const r = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const j = (await r.json()) as { admin?: boolean };
        setIsAdmin(Boolean(j.admin));
      } catch {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
    if (!uid) {
      setDisplayName("");
      setReady(true);
      return;
    }
    const { data: prof } = await sb
      .from("profiles")
      .select("full_name")
      .eq("id", uid)
      .maybeSingle();
    const fn = (prof?.full_name as string | undefined)?.trim() ?? "";
    const meta = session?.user?.user_metadata as
      | { full_name?: string }
      | undefined;
    const metaName = meta?.full_name?.trim() ?? "";
    const name = fn || metaName || (em ? em.split("@")[0] : "");
    setDisplayName(name || "Üye");
    setReady(true);
  }, []);

  const navItems = useMemo(() => mergeAccountNavItems(isAdmin), [isAdmin]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange(() => {
      void refreshUser();
    });
    return () => subscription.unsubscribe();
  }, [refreshUser]);

  const handleSignOut = useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    router.push("/");
    router.refresh();
  }, [router]);

  const greeting = useMemo(() => {
    if (!displayName && !email) return "Üye";
    return displayName || email?.split("@")[0] || "Üye";
  }, [displayName, email]);

  const initials = useMemo(
    () => userInitials(ready ? greeting : "", email),
    [ready, greeting, email]
  );

  return (
    <main className="account-shell">
      <div className="account-shell__container">
        <p className="account-shell__crumb">
          <span className="account-shell__crumb-dot" aria-hidden />
          Üye paneli
        </p>

        <div className="account-shell__grid">
          <div className="account-shell__main">{children}</div>

          <aside
            className="account-shell__rail"
            aria-label="Hesap menüsü (masaüstü)"
          >
            <div className="account-shell__identity">
              <div className="account-shell__avatar" aria-hidden>
                {initials}
              </div>
              <div className="account-shell__identity-text">
                <p className="account-shell__identity-name">
                  {ready ? greeting : "…"}
                </p>
                <p className="account-shell__identity-badge">
                  {isAdmin ? "Yönetici" : "Bireysel hesap"}
                </p>
                {email ? (
                  <p className="account-shell__identity-email">{email}</p>
                ) : null}
              </div>
            </div>

            <nav className="account-shell__rail-nav">
              <ul className="account-shell__rail-list">
                {navItems.map((item) => {
                  const active = accountNavItemActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={
                          active
                            ? "account-shell__rail-link account-shell__rail-link--active"
                            : "account-shell__rail-link"
                        }
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="account-shell__rail-link-icon">
                          <AccountNavIcon name={item.icon} />
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {hasSupabaseConfig && (
              <button
                type="button"
                className="account-shell__signout"
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
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
