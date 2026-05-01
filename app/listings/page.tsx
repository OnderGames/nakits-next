"use client";

import { useMemo, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { listings } from "@/lib/mock-data";

export default function ListingsPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const filtered = useMemo(() => {
    return listings.filter((item) => {
      const matchQ = item.title.toLowerCase().includes(q.toLowerCase());
      const matchCity = !city || item.city === city;
      const matchCategory = !category || item.category === category;
      return matchQ && matchCity && matchCategory;
    });
  }, [q, city, category]);

  return (
    <main className="container">
      <h1 className="section-title">Tum Ilanlar</h1>
      <section className="panel">
        <div className="search-grid">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Arama..."
          />
          <select value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="">Tum sehirler</option>
            <option value="Istanbul">Istanbul</option>
            <option value="Ankara">Ankara</option>
            <option value="Izmir">Izmir</option>
            <option value="Bursa">Bursa</option>
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Tum kategoriler</option>
            <option value="Elektronik">Elektronik</option>
            <option value="Ev ve Yasam">Ev ve Yasam</option>
            <option value="Moda">Moda</option>
            <option value="Vasita">Vasita</option>
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
      <p className="footer">Nakits MVP - Listeleme Ekrani</p>
    </main>
  );
}
