"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { fetchMyListings } from "@/lib/listings-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

export default function MyListingsPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb || !hasSupabaseConfig) {
      setLoggedIn(false);
      setLoaded(true);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setLoggedIn(Boolean(uid));
      setUserId(uid);
      if (!uid) setLoaded(true);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      setLoggedIn(Boolean(uid));
      setUserId(uid);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setLoaded(false);
    void fetchMyListings(sb, userId)
      .then(setItems)
      .finally(() => setLoaded(true));
  }, [userId]);

  if (loggedIn === null) {
    return (
      <main className="container">
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <main className="container">
        <h1 className="section-title">İlanlarım</h1>
        <p className="notice">Supabase yapılandırması yok; oturum özelliği devre dışı.</p>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="container">
        <h1 className="section-title">İlanlarım</h1>
        <section className="panel">
          <p>İlanlarını görmek için giriş yapmalısın.</p>
          <Link className="btn btn-primary" style={{ display: "inline-block", marginTop: 12 }} href="/login?next=/ilanlarim">
            Giriş yap
          </Link>
        </section>
      </main>
    );
  }

  if (!loaded) {
    return (
      <main className="container">
        <h1 className="section-title">İlanlarım</h1>
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="section-title">İlanlarım</h1>
      <p className="meta" style={{ marginBottom: 14 }}>
        Onay bekleyen ilanlar yayına alınınca herkes tarafından görülebilir.
      </p>
      {items.length === 0 ? (
        <section className="panel">
          <p>Henüz ilan vermedin.</p>
          <Link className="btn btn-primary" style={{ display: "inline-block", marginTop: 12 }} href="/add-listing">
            İlan ver
          </Link>
        </section>
      ) : (
        <section className="cards">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}
      <p className="footer">
        <Link href="/add-listing">Yeni ilan ver</Link>
      </p>
    </main>
  );
}
