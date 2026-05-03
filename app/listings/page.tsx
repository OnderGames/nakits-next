"use client";

import { useEffect, useMemo, useState } from "react";
import ListingCard from "@/components/ListingCard";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey
} from "@/lib/categories";
import { isListingCodeQuery } from "@/lib/listing-code";
import { fetchPublicListings } from "@/lib/listings-data";
import { listings as mockListings } from "@/lib/mock-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { getDistrictsForProvince } from "@/lib/turkish-districts";
import { TURKEY_PROVINCES } from "@/lib/turkish-provinces";

export default function ListingsPage() {
  const [data, setData] = useState<Listing[]>([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
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
    const qTrim = q.trim();
    const qLower = qTrim.toLowerCase();
    const codeExact =
      qTrim.length > 0 && isListingCodeQuery(qTrim)
        ? qTrim
        : null;

    return data.filter((item) => {
      const matchQ = codeExact
        ? item.listingCode === codeExact
        : !qLower || item.title.toLowerCase().includes(qLower);
      const matchCity = !city || item.city === city;
      const matchDistrict =
        !district ||
        (item.district != null &&
          String(item.district).trim() === district);
      const matchCategory = !category || item.categoryKey === category;
      return matchQ && matchCity && matchDistrict && matchCategory;
    });
  }, [q, city, district, category, data]);

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
        <p className="meta" style={{ margin: "0 0 12px" }}>
          Önce <strong>il</strong> seçin; ardından <strong>ilçe</strong> menüsü
          dolar. Arama kutusuna <strong>6–9 haneli ilan numarasını</strong>{" "}
          yazarak giriş yapmadan ilanı bulabilirsiniz. Filtreler bu sayfada
          geçerlidir.
        </p>
        <div className="listings-filter-grid">
          <div className="filter-field">
            <label htmlFor="listings-q">Arama</label>
            <input
              id="listings-q"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Başlık veya ilan no (6–9 hane)…"
            />
          </div>
          <div className="filter-field">
            <label htmlFor="listings-city">İl</label>
            <select
              id="listings-city"
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setDistrict("");
              }}
            >
              <option value="">Tüm iller</option>
              {TURKEY_PROVINCES.map((il) => (
                <option key={il} value={il}>
                  {il}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="listings-district">İlçe</label>
            <select
              id="listings-district"
              value={district}
              disabled={!city}
              onChange={(event) => setDistrict(event.target.value)}
              title={!city ? "Önce il seçin" : "İlçe"}
            >
              <option value="">
                {!city ? "Önce il seçin" : "Tüm ilçeler"}
              </option>
              {city
                ? getDistrictsForProvince(city).map((ilce) => (
                    <option key={ilce} value={ilce}>
                      {ilce}
                    </option>
                  ))
                : null}
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="listings-cat">Kategori</label>
            <select
              id="listings-cat"
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
          </div>
          <div className="filter-field filter-field--action">
            <button type="button" className="btn btn-primary">
              Filtrele
            </button>
          </div>
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
    </main>
  );
}
