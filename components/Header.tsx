"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

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
          <Link className="nav-cta" href="/add-listing">
            + İlan ver
          </Link>

          {!ready ? (
            <span className="meta">…</span>
          ) : showAuth ? (
            loggedIn ? (
              <>
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
