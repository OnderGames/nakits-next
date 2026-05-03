"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

type NavItem = {
  href: string;
  label: string;
  icon: "grid" | "listings" | "heart" | "messages" | "user";
};

const NAV: NavItem[] = [
  { href: "/ilanlarim", label: "İlan yönetimi", icon: "listings" },
  { href: "/favoriler", label: "Favoriler", icon: "heart" },
  { href: "/mesajlar", label: "Mesajlarım", icon: "messages" },
  { href: "/profile", label: "Profil yönetimi", icon: "user" }
];

function navActive(pathname: string, href: string): boolean {
  if (href === "/profile") return pathname === "/profile";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ name }: { name: NavItem["icon"] }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    "aria-hidden": true as const
  };
  switch (name) {
    case "grid":
      return (
        <svg {...common} fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "listings":
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common} fill="none">
          <path
            d="M12 21s-6.716-4.432-9-8.5C.89 9.732 2.14 6 6 6c2.352 0 3.638 1.352 4 2 .362-.648 1.648-2 4-2 3.86 0 5.11 3.732 3 6.5C16.716 16.568 12 21 12 21z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "messages":
      return (
        <svg {...common}>
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
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

  const refreshUser = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setReady(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setReady(true);
      return;
    }
    const {
      data: { session }
    } = await sb.auth.getSession();
    const uid = session?.user?.id ?? null;
    const em = session?.user?.email ?? null;
    setEmail(em);
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

  return (
    <main className="account-shell">
      <div className="account-shell__container">
        <p className="account-shell__crumb">
          <span className="account-shell__crumb-icon" aria-hidden>
            <NavIcon name="grid" />
          </span>
          Üye paneli
        </p>

        <div className="account-shell__grid">
          <nav className="account-shell__sidebar" aria-label="Üye menüsü">
            <ul className="account-shell__nav-list">
              {NAV.map((item) => {
                const active = navActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={
                        active
                          ? "account-shell__nav-link account-shell__nav-link--active"
                          : "account-shell__nav-link"
                      }
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="account-shell__nav-icon" aria-hidden>
                        <NavIcon name={item.icon} />
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="account-shell__main">{children}</div>

          <aside className="account-shell__card" aria-label="Hesap özeti">
            <div className="account-shell__card-head">
              <p className="account-shell__card-name">
                {ready ? greeting : "…"}
              </p>
              <p className="account-shell__card-type">Bireysel hesap</p>
            </div>
            <ul className="account-shell__card-nav">
              {NAV.map((item) => {
                const active = navActive(pathname, item.href);
                return (
                  <li key={`aside-${item.href}`}>
                    <Link
                      href={item.href}
                      className={
                        active
                          ? "account-shell__card-link account-shell__card-link--active"
                          : "account-shell__card-link"
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {hasSupabaseConfig && (
              <button
                type="button"
                className="account-shell__signout"
                onClick={() => void handleSignOut()}
              >
                Güvenli çıkış
              </button>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
