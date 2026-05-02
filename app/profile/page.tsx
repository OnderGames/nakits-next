"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { fetchSellerActiveListings } from "@/lib/listings-data";
import { listings as mockListings } from "@/lib/mock-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setReady(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setReady(true);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      setUserId(data.session?.user?.id ?? null);
      setReady(true);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) {
      if (!userId) setActiveListings([]);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) return;
    void fetchSellerActiveListings(sb, userId, 2).then(setActiveListings);
  }, [userId]);

  if (!ready) {
    return (
      <main className="container">
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  if (hasSupabaseConfig && !email) {
    return (
      <main className="container">
        <h1 className="section-title">Profilim</h1>
        <section className="panel auth-wall">
          <p>Profilini görmek için giriş yap.</p>
          <Link
            className="btn btn-primary"
            style={{ display: "inline-block", marginTop: 14 }}
            href="/login?next=/profile"
          >
            Giriş yap
          </Link>
        </section>
      </main>
    );
  }

  const shown =
    hasSupabaseConfig && userId
      ? activeListings
      : mockListings.slice(0, 2);

  return (
    <main className="container">
      <h1 className="section-title">Profilim</h1>
      <section className="panel">
        <h3>{email ?? "Üye"}</h3>
        <p className="meta">Nakits hesabın</p>
      </section>

      <h2 className="section-title">Yayındaki ilanlarım</h2>
      {hasSupabaseConfig && shown.length === 0 && (
        <p className="meta">Henüz yayındaki ilanın yok (onay bekleyenler dahil değil).</p>
      )}
      <section className="cards">
        {shown.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </section>
      <p className="footer">
        <Link href="/ilanlarim">Tüm ilanlarım</Link>
      </p>
      <p className="footer">Nakits MVP — Profil</p>
    </main>
  );
}
