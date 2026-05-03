"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { fetchPublicListingsByIds } from "@/lib/listings-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

export default function FavorilerPage() {
  const [phase, setPhase] = useState<"loading" | "need-login" | "ready">(
    "loading"
  );
  const [listings, setListings] = useState<Listing[]>([]);

  const load = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setPhase("need-login");
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setPhase("need-login");
      return;
    }
    const {
      data: { session }
    } = await sb.auth.getSession();
    if (!session?.user) {
      setPhase("need-login");
      setListings([]);
      return;
    }
    const { data: favRows, error } = await sb
      .from("favorites")
      .select("listing_id, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setListings([]);
      setPhase("ready");
      return;
    }
    const ids = (favRows ?? []).map((r) =>
      String((r as { listing_id: string }).listing_id)
    );
    const rows = await fetchPublicListingsByIds(sb, ids);
    setListings(rows);
    setPhase("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!hasSupabaseConfig) {
    return (
      <div className="account-page">
        <h1 className="section-title">Favorilerim</h1>
        <p className="notice">
          Supabase yapılandırması yok; favoriler kullanılamıyor.
        </p>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="account-page">
        <h1 className="section-title">Favorilerim</h1>
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  if (phase === "need-login") {
    return (
      <div className="account-page">
        <h1 className="section-title">Favorilerim</h1>
        <p className="meta" style={{ marginBottom: 16 }}>
          Favori ilanlarını görmek için giriş yapmalısın.
        </p>
        <Link className="btn btn-primary" href="/login?next=/favoriler">
          Giriş yap
        </Link>
      </div>
    );
  }

  return (
    <div className="account-page">
      <h1 className="section-title">Favorilerim</h1>
      {listings.length === 0 ? (
        <p className="meta">
          Henüz favori ilanın yok. İlan kartlarındaki kalbe tıklayarak
          ekleyebilirsin.
        </p>
      ) : (
        <section className="cards cards--browse" style={{ marginTop: 14 }}>
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </div>
  );
}
