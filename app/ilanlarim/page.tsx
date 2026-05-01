"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { listings } from "@/lib/mock-data";
import { hasSupabaseConfig } from "@/lib/supabase";

export default function MyListingsPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb || !hasSupabaseConfig) {
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

  return (
    <main className="container">
      <h1 className="section-title">İlanlarım</h1>
      <p className="meta" style={{ marginBottom: 14 }}>
        MVP: örnek ilanlar. Gerçek veri bağlanınca yalnızca senin ilanların listelenecek.
      </p>
      <section className="cards">
        {listings.slice(0, 2).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </section>
      <p className="footer">
        <Link href="/add-listing">Yeni ilan ver</Link>
      </p>
    </main>
  );
}
