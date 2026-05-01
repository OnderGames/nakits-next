"use client";

import { useMemo, useState } from "react";
import ListingCard from "@/components/ListingCard";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey
} from "@/lib/categories";
import { listings } from "@/lib/mock-data";
import { TURKEY_PROVINCES } from "@/lib/turkish-provinces";

export default function ListingsPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const filtered = useMemo(() => {
    return listings.filter((item) => {
      const matchQ = item.title.toLowerCase().includes(q.toLowerCase());
      const matchCity = !city || item.city === city;
      const matchCategory = !category || item.categoryKey === category;
      return matchQ && matchCity && matchCategory;
    });
  }, [q, city, category]);

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

      <section className="cards" style={{ marginTop: 14 }}>
        {filtered.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </section>
      <p className="footer">Nakits MVP — Listeleme ekranı</p>
    </main>
  );
}
