"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import HomeCategorySidebar from "@/components/HomeCategorySidebar";
import ListingCard from "@/components/ListingCard";
import { buildListingCountsByCategoryKey } from "@/lib/category-counts";
import {
  CATEGORY_GROUPS,
  categoryKeyMatchesListingSearch,
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

function buildListingsSearch(
  p: Record<"q" | "city" | "district" | "category", string>
): string {
  const sp = new URLSearchParams();
  const qt = p.q.trim();
  if (qt) sp.set("q", qt);
  if (p.city) sp.set("city", p.city);
  if (p.district) sp.set("district", p.district);
  if (p.category) sp.set("category", p.category);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function ListingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<Listing[]>([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");

  const filtersRef = useRef({ q, city, district, category });
  filtersRef.current = { q, city, district, category };

  const qDebounceRef = useRef<number | null>(null);

  const replaceListingsUrl = useCallback(
    (next: Record<"q" | "city" | "district" | "category", string>) => {
      const search = buildListingsSearch(next);
      const path = search ? `/listings${search}` : "/listings";
      router.replace(path, { scroll: false });
    },
    [router]
  );

  /** URL ↔ state (geri/ileri ve üst menü araması dahil) */
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setCity(searchParams.get("city") ?? "");
    setDistrict(searchParams.get("district") ?? "");
    setCategory(searchParams.get("category") ?? "");
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    };
  }, []);

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
      const titleHit =
        !qLower || item.title.toLowerCase().includes(qLower);
      const sellerHit =
        !qLower ||
        item.seller.toLowerCase().includes(qLower);
      const descHit =
        !qLower ||
        (item.description != null &&
          item.description.toLowerCase().includes(qLower));
      const categoryLabelHit =
        !qLower || categoryKeyMatchesListingSearch(item.categoryKey, qLower);
      const matchQ = codeExact
        ? item.listingCode === codeExact
        : titleHit ||
            sellerHit ||
            descHit ||
            categoryLabelHit;
      const matchCity = !city || item.city === city;
      const matchDistrict =
        !district ||
        (item.district != null &&
          String(item.district).trim() === district);
      const matchCategory = !category || item.categoryKey === category;
      return matchQ && matchCity && matchDistrict && matchCategory;
    });
  }, [q, city, district, category, data]);

  const categoryCounts = useMemo(
    () => buildListingCountsByCategoryKey(data),
    [data]
  );

  function scheduleSearchUrl(text: string) {
    if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    qDebounceRef.current = window.setTimeout(() => {
      qDebounceRef.current = null;
      const f = filtersRef.current;
      replaceListingsUrl({
        q: text,
        city: f.city,
        district: f.district,
        category: f.category
      });
    }, 380);
  }

  function applyFiltersNow() {
    if (qDebounceRef.current) {
      window.clearTimeout(qDebounceRef.current);
      qDebounceRef.current = null;
    }
    const f = filtersRef.current;
    replaceListingsUrl({
      q: f.q,
      city: f.city,
      district: f.district,
      category: f.category
    });
  }

  if (!ready) {
    return (
      <main className="container">
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="home-satariz-layout">
        <HomeCategorySidebar
          counts={categoryCounts}
          selectedCategoryKey={category || null}
          preserveParams={{ q, city, district }}
        />
        <div className="home-satariz-main">
      <h1 className="section-title">Tüm İlanlar</h1>
      <section className="panel">
        <p className="meta" style={{ margin: "0 0 12px" }}>
          Filtreler adres çubuğuna yazılır; sayfa bağlantısını kopyalayarak aynı
          aramayı paylaşabilirsiniz.           Arama: başlık, <strong>açıklama</strong>, <strong>kategori adı</strong>,{" "}
          <strong>satıcı adı</strong> veya{" "}
          <strong>6–9 haneli ilan no</strong>. Önce <strong>il</strong> seçin;
          ardından <strong>ilçe</strong> menüsü dolar.
        </p>
        <div className="listings-filter-grid">
          <div className="filter-field">
            <label htmlFor="listings-q">Arama</label>
            <input
              id="listings-q"
              value={q}
              onChange={(event) => {
                const v = event.target.value;
                setQ(v);
                scheduleSearchUrl(v);
              }}
              placeholder="Başlık, satıcı adı veya ilan no (6–9 hane)…"
            />
          </div>
          <div className="filter-field">
            <label htmlFor="listings-city">İl</label>
            <select
              id="listings-city"
              value={city}
              onChange={(event) => {
                const v = event.target.value;
                setCity(v);
                setDistrict("");
                replaceListingsUrl({
                  q,
                  city: v,
                  district: "",
                  category
                });
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
              onChange={(event) => {
                const v = event.target.value;
                setDistrict(v);
                replaceListingsUrl({
                  q,
                  city,
                  district: v,
                  category
                });
              }}
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
              onChange={(event) => {
                const v = event.target.value;
                setCategory(v);
                replaceListingsUrl({
                  q,
                  city,
                  district,
                  category: v
                });
              }}
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
            <button
              type="button"
              className="btn btn-primary"
              onClick={applyFiltersNow}
            >
              Filtrele
            </button>
          </div>
        </div>
      </section>

      {filtered.length === 0 && (
        <section className="panel account-empty-panel" style={{ marginTop: 14 }}>
          <p className="account-empty-panel__text">
            {hasSupabaseConfig
              ? "Henüz yayındaki ilan yok veya filtreye uygun ilan bulunamadı."
              : "Filtreye uygun ilan yok."}
          </p>
          <Link className="btn btn-outline account-empty-panel__cta" href="/add-listing">
            İlan ver
          </Link>
        </section>
      )}

      <section className="cards cards--vitrin" style={{ marginTop: 14 }}>
        {filtered.map((listing) => (
          <ListingCard key={listing.id} listing={listing} presentation="vitrin" />
        ))}
      </section>
        </div>
      </div>
    </main>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <p className="meta">Yükleniyor…</p>
        </main>
      }
    >
      <ListingsPageInner />
    </Suspense>
  );
}
