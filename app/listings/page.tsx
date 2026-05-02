"use client";

import { useEffect, useMemo, useState } from "react";
import ListingCard from "@/components/ListingCard";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey
} from "@/lib/categories";
import { fetchPublicListings } from "@/lib/listings-data";
import { listings as mockListings } from "@/lib/mock-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { TURKEY_PROVINCES } from "@/lib/turkish-provinces";

export default function ListingsPage() {
  const [data, setData] = useState<Listing[]>([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setData(mockListings);
      setReady(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setReady(true);
      return;
    }
    void fetchPublicListings(sb)
      .then(setData)
      .finally(() => setReady(true));
  }, []);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchQ = item.title.toLowerCase().includes(q.toLowerCase());
      const matchCity = !city || item.city === city;
      const matchCategory = !category || item.categoryKey === category;
      return matchQ && matchCity && matchCategory;
    });
  }, [q, city, category, data]);

  if (!ready) {
    return (
      <main className="container">
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="section-title">Tüm İlanlar</h1>
      <section className="panel">
        <div className="search-grid">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Arama..."
          />
          <select value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="">Tüm şehirler</option>
            {TURKEY_PROVINCES.map((il) => (
              <option key={il} value={il}>
                {il}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Tüm kategoriler</option>
            {CATEGORY_GROUPS.map((group) => (
              <optgroup key={group.slug} label={`${group.emoji} ${group.name}`}>
                {group.subs.map((sub) => (
                  <option
                    key={sub.slug}
                    value={compositeCategoryKey(group.slug, sub.slug)}
                  >
                    {sub.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => undefined}>
            Filtrele
          </button>
        </div>
      </section>

      {filtered.length === 0 && (
        <p className="meta" style={{ marginTop: 14 }}>
          {hasSupabaseConfig
            ? "Henüz yayındaki ilan yok veya filtreye uygun ilan bulunamadı."
            : "Filtreye uygun ilan yok."}
        </p>
      )}

      <section className="cards" style={{ marginTop: 14 }}>
        {filtered.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </section>
      <p className="footer">Nakits MVP — Listeleme ekranı</p>
    </main>
  );
}
