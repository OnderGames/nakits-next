"use client";

import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SVGProps
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import HomeCategorySidebar from "@/components/HomeCategorySidebar";
import ListingsFilterDrawer from "@/components/ListingsFilterDrawer";
import ListingCard from "@/components/ListingCard";
import { buildListingCountsByCategoryKey } from "@/lib/category-counts";
import {
  buildGayrimenkulEmlakKindListingsCategoryKey,
  buildGayrimenkulKonutListingsCategoryKey,
  buildOtomobilListingsCategoryKey,
  canonicalListingsCategorySelectValue,
  CATEGORY_GROUPS,
  categoryKeyMatchesListingSearch,
  gayrimenkulListingsFilterRows,
  getSortedFlatOtomobilModelsForListingsFilter,
  KONUT_LISTING_KINDS,
  KONUT_PROPERTY_TYPES,
  leafRowsForCategoryGroup,
  listingsCategoryFilterMatches,
  listingsOtomobilBmwSeriesRows,
  listingsOtomobilBmwVariantsForSeries,
  listingsOtomobilParseBmwModelRest,
  parseGayrimenkulEmlakKindListingsDrilldown,
  parseGayrimenkulKonutListingsParts,
  parseOtomobilListingsDrilldown,
  tasitlarFilterOptgroups
} from "@/lib/categories";
import { listingPlaceMatchesFreeTextQuery } from "@/lib/listing-place-search";
import { isListingCodeQuery } from "@/lib/listing-code";
import {
  isListingsSortKey,
  LISTINGS_SORT_LABELS,
  type ListingsSortKey,
  sortListingsFiltered
} from "@/lib/listings-sort";
import { fetchPublicListings } from "@/lib/listings-data";
import { listings as mockListings } from "@/lib/mock-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { getDistrictsForProvince } from "@/lib/turkish-districts";
import { TURKEY_PROVINCES } from "@/lib/turkish-provinces";

type UrlParts = {
  q: string;
  city: string;
  district: string;
  category: string;
  sort?: ListingsSortKey | null;
};

function buildListingsHref(parts: UrlParts): string {
  const sp = new URLSearchParams();
  const qt = parts.q.trim();
  if (qt) sp.set("q", qt);
  if (parts.city) sp.set("city", parts.city);
  if (parts.district) sp.set("district", parts.district);
  if (parts.category) sp.set("category", parts.category);
  if (parts.sort) sp.set("sort", parts.sort);
  const qs = sp.toString();
  return qs ? `/listings?${qs}` : "/listings";
}

function IconFilter(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M6 4h14M6 10h14M12 22V8M17 22v-5M11 22h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSortArrows(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M8 15l4 4 4-4M8 9l4-4 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type FilterFieldsProps = {
  suffix: "-d" | "-m";
  q: string;
  city: string;
  district: string;
  category: string;
  /** Arama yazısı: anında güncellenir */
  setQ: (v: string) => void;
  onQControlledChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  /** Masaüstü: doğrudan uygulanır */
  syncUrlFromSelectsNow: (
    overrides: Partial<Pick<UrlParts, "q" | "city" | "district" | "category">>
  ) => void;
  onDesktopFilterClick: () => void;
};

function ListingsFilterFields({
  suffix,
  q,
  city,
  district,
  category,
  setQ,
  onQControlledChange,
  onCityChange,
  onDistrictChange,
  onCategoryChange,
  syncUrlFromSelectsNow,
  onDesktopFilterClick
}: FilterFieldsProps) {
  const idQ = `listings-q${suffix}`;
  const idCity = `listings-city${suffix}`;
  const idDistrict = `listings-district${suffix}`;
  const idCat = `listings-cat${suffix}`;
  const idOtoSeri = `listings-oto-seri${suffix}`;
  const idOtoModel = `listings-oto-model${suffix}`;
  const idGmKonutTxn = `listings-gm-konut-txn${suffix}`;
  const idGmKonutProp = `listings-gm-konut-prop${suffix}`;
  const idGmEmlakTxn = `listings-gm-emlak-txn${suffix}`;

  const otomobilDrilldown = parseOtomobilListingsDrilldown(category);
  const konutFilterParts = parseGayrimenkulKonutListingsParts(category);
  const emlakKindFilterParts =
    parseGayrimenkulEmlakKindListingsDrilldown(category);
  /** Katalogda `›` kullanan tek marka BMW; gelecek markalar için parsing genişletilebilir */
  const hierarchicalSplit = otomobilDrilldown?.hierarchical
    ? listingsOtomobilParseBmwModelRest(otomobilDrilldown.modelRest)
    : null;
  const hierarchicalVariants =
    hierarchicalSplit?.seriesSlug
      ? listingsOtomobilBmwVariantsForSeries(hierarchicalSplit.seriesSlug)
      : [];
  const flatOtomobilModels =
    otomobilDrilldown &&
    !otomobilDrilldown.hierarchical &&
    otomobilDrilldown.brandSlug
      ? getSortedFlatOtomobilModelsForListingsFilter(
          otomobilDrilldown.brandSlug
        )
      : [];

  return (
    <div className="listings-filter-grid">
      <div className="filter-field">
        <label htmlFor={idQ}>Arama</label>
        <input
          id={idQ}
          value={q}
          onChange={(event) => {
            const v = event.target.value;
            setQ(v);
            onQControlledChange(v);
          }}
          placeholder="Başlık, satıcı adı veya ilan no (6–9 hane)…"
        />
      </div>
      <div className="filter-field">
        <label htmlFor={idCity}>İl</label>
        <select
          id={idCity}
          value={city}
          onChange={(event) => {
            const v = event.target.value;
            onCityChange(v);
            syncUrlFromSelectsNow({ city: v, district: "" });
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
        <label htmlFor={idDistrict}>İlçe</label>
        <select
          id={idDistrict}
          value={district}
          disabled={!city}
          onChange={(event) => {
            const v = event.target.value;
            onDistrictChange(v);
            syncUrlFromSelectsNow({ district: v });
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
        <label htmlFor={idCat}>Kategori</label>
        <select
          id={idCat}
          value={canonicalListingsCategorySelectValue(category)}
          onChange={(event) => {
            const v = event.target.value;
            onCategoryChange(v);
            syncUrlFromSelectsNow({ category: v });
          }}
        >
          <option value="">Tüm kategoriler</option>
          {CATEGORY_GROUPS.map((group) =>
            group.slug === "tasitlar" ? (
              <Fragment key={group.slug}>
                {(() => {
                  const { otomobil, diger } = tasitlarFilterOptgroups();
                  return (
                    <>
                      <optgroup
                        label={`${group.emoji} ${group.name} · Otomobil`}
                      >
                        {otomobil.map((row) => (
                          <option key={row.reactKey} value={row.compositeKey}>
                            {row.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup
                        label={`${group.emoji} ${group.name} · Diğer`}
                      >
                        {diger.map((row) => (
                          <option key={row.reactKey} value={row.compositeKey}>
                            {row.label}
                          </option>
                        ))}
                      </optgroup>
                    </>
                  );
                })()}
              </Fragment>
            ) : group.slug === "gayrimenkul" ? (
              <optgroup key={group.slug} label={`${group.emoji} ${group.name}`}>
                {gayrimenkulListingsFilterRows().map((row) => (
                  <option key={row.reactKey} value={row.compositeKey}>
                    {row.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              <optgroup key={group.slug} label={`${group.emoji} ${group.name}`}>
                {leafRowsForCategoryGroup(group).map((row) => (
                  <option key={row.reactKey} value={row.compositeKey}>
                    {row.label}
                  </option>
                ))}
              </optgroup>
            )
          )}
        </select>
      </div>
      {otomobilDrilldown != null ? (
        <div
          className={
            otomobilDrilldown.hierarchical
              ? "listings-filter-otomobil-extra"
              : "listings-filter-otomobil-extra listings-filter-otomobil-extra--flat"
          }
          aria-live="polite"
        >
          {otomobilDrilldown.hierarchical && hierarchicalSplit != null ? (
            <>
              <div className="filter-field">
                <label htmlFor={idOtoSeri}>Seri</label>
                <select
                  id={idOtoSeri}
                  value={hierarchicalSplit.seriesSlug}
                  onChange={(event) => {
                    const serie = event.target.value;
                    const cat = buildOtomobilListingsCategoryKey(
                      otomobilDrilldown.brandSlug,
                      serie
                    );
                    onCategoryChange(cat);
                    syncUrlFromSelectsNow({ category: cat });
                  }}
                >
                  <option value="">Tüm {otomobilDrilldown.brandName}</option>
                  {listingsOtomobilBmwSeriesRows().map((seri) => (
                    <option key={seri.slug} value={seri.slug}>
                      {seri.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor={idOtoModel}>Model</label>
                <select
                  id={idOtoModel}
                  value={
                    hierarchicalSplit.seriesSlug
                      ? hierarchicalSplit.variantSlugFull
                      : ""
                  }
                  disabled={!hierarchicalSplit.seriesSlug}
                  title={
                    !hierarchicalSplit.seriesSlug ? "Önce seri seçin" : undefined
                  }
                  onChange={(event) => {
                    const vf = event.target.value;
                    const cat = buildOtomobilListingsCategoryKey(
                      otomobilDrilldown.brandSlug,
                      vf ||
                        hierarchicalSplit.seriesSlug ||
                        ""
                    );
                    onCategoryChange(cat);
                    syncUrlFromSelectsNow({ category: cat });
                  }}
                >
                  <option value="">
                    {!hierarchicalSplit.seriesSlug
                      ? "Önce seri seçin"
                      : (listingsOtomobilBmwSeriesRows().find(
                          (s) => s.slug === hierarchicalSplit.seriesSlug
                        )?.name ?? "Bu seri") + " · tüm modeller"}
                  </option>
                  {hierarchicalVariants.map((variant) => (
                    <option key={variant.slugFull} value={variant.slugFull}>
                      {variant.label}
                    </option>
                  ))}
                  {hierarchicalSplit.seriesSlug &&
                  hierarchicalSplit.variantSlugFull &&
                  !hierarchicalVariants.some(
                    (o) => o.slugFull === hierarchicalSplit.variantSlugFull
                  ) ? (
                    <option value={hierarchicalSplit.variantSlugFull}>
                      {hierarchicalSplit.variantSlugFull.replace(/-/g, " ")}
                    </option>
                  ) : null}
                </select>
              </div>
            </>
          ) : (
            <div className="filter-field">
              <label htmlFor={idOtoModel}>Model ({otomobilDrilldown.brandName})</label>
              <select
                id={idOtoModel}
                value={otomobilDrilldown.modelRest}
                onChange={(event) => {
                  const slug = event.target.value;
                  const cat = buildOtomobilListingsCategoryKey(
                    otomobilDrilldown.brandSlug,
                    slug
                  );
                  onCategoryChange(cat);
                  syncUrlFromSelectsNow({ category: cat });
                }}
              >
                <option value="">Tüm {otomobilDrilldown.brandName}</option>
                {flatOtomobilModels.map((model) => (
                  <option key={model.slug} value={model.slug}>
                    {model.label}
                  </option>
                ))}
                {otomobilDrilldown.modelRest &&
                !flatOtomobilModels.some(
                  (m) => m.slug === otomobilDrilldown.modelRest
                ) ? (
                  <option value={otomobilDrilldown.modelRest}>
                    {otomobilDrilldown.modelRest.replace(/-/g, " ")}
                  </option>
                ) : null}
              </select>
            </div>
          )}
        </div>
      ) : null}
      {konutFilterParts != null ? (
        <div className="listings-filter-otomobil-extra" aria-live="polite">
          <div className="filter-field">
            <label htmlFor={idGmKonutTxn}>İşlem</label>
            <select
              id={idGmKonutTxn}
              value={konutFilterParts.txn}
              onChange={(event) => {
                const txn = event.target.value as typeof konutFilterParts.txn;
                const cat = buildGayrimenkulKonutListingsCategoryKey(txn, "");
                onCategoryChange(cat);
                syncUrlFromSelectsNow({ category: cat });
              }}
            >
              <option value="">Tüm konut</option>
              {KONUT_LISTING_KINDS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor={idGmKonutProp}>Yapı tipi</label>
            <select
              id={idGmKonutProp}
              value={konutFilterParts.txn ? konutFilterParts.prop : ""}
              disabled={!konutFilterParts.txn}
              title={!konutFilterParts.txn ? "Önce işlem seçin" : undefined}
              onChange={(event) => {
                const prop = event.target.value as typeof konutFilterParts.prop;
                const cat = buildGayrimenkulKonutListingsCategoryKey(
                  konutFilterParts.txn,
                  prop
                );
                onCategoryChange(cat);
                syncUrlFromSelectsNow({ category: cat });
              }}
            >
              <option value="">
                {!konutFilterParts.txn
                  ? "Önce işlem seçin"
                  : `${
                      KONUT_LISTING_KINDS.find(
                        (x) => x.slug === konutFilterParts.txn
                      )?.name ?? ""
                    } · tüm tipler`}
              </option>
              {KONUT_PROPERTY_TYPES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      {emlakKindFilterParts != null ? (
        <div
          className="listings-filter-otomobil-extra listings-filter-otomobil-extra--flat"
          aria-live="polite"
        >
          <div className="filter-field">
            <label htmlFor={idGmEmlakTxn}>
              İşlem ({emlakKindFilterParts.baseLabel})
            </label>
            <select
              id={idGmEmlakTxn}
              value={emlakKindFilterParts.txn}
              onChange={(event) => {
                const txn = event.target.value as typeof emlakKindFilterParts.txn;
                const cat = buildGayrimenkulEmlakKindListingsCategoryKey(
                  emlakKindFilterParts.baseSlug,
                  txn
                );
                onCategoryChange(cat);
                syncUrlFromSelectsNow({ category: cat });
              }}
            >
              <option value="">Tümü</option>
              {KONUT_LISTING_KINDS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      <div className="filter-field filter-field--action">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onDesktopFilterClick}
        >
          Filtrele
        </button>
      </div>
    </div>
  );
}

const SORT_ENTRIES = Object.entries(LISTINGS_SORT_LABELS) as Array<
  [ListingsSortKey, string]
>;

function ListingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortDetailsRef = useRef<HTMLDetailsElement>(null);
  const [data, setData] = useState<Listing[]>([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");
  const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);

  const filtersRef = useRef({ q, city, district, category });
  filtersRef.current = { q, city, district, category };

  const qDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setCity(searchParams.get("city") ?? "");
    setDistrict(searchParams.get("district") ?? "");
    setCategory(searchParams.get("category") ?? "");
  }, [searchParams]);

  const sortKey = useMemo((): ListingsSortKey | null => {
    const s = searchParams.get("sort")?.trim();
    return isListingsSortKey(s) ? s : null;
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
      qTrim.length > 0 && isListingCodeQuery(qTrim) ? qTrim : null;

    return data.filter((item) => {
      const titleHit =
        !qLower || item.title.toLowerCase().includes(qLower);
      const sellerHit =
        !qLower || item.seller.toLowerCase().includes(qLower);
      const descHit =
        !qLower ||
        (item.description != null &&
          item.description.toLowerCase().includes(qLower));
      const categoryLabelHit =
        !qLower ||
        categoryKeyMatchesListingSearch(item.categoryKey, qLower);
      const placeFromQHit =
        !qTrim ||
        listingPlaceMatchesFreeTextQuery(
          item.city,
          item.district,
          qTrim
        );
      const matchQ = codeExact
        ? item.listingCode === codeExact
        : titleHit ||
            sellerHit ||
            descHit ||
            categoryLabelHit ||
            placeFromQHit;
      const matchCity = !city || item.city === city;
      const matchDistrict =
        !district ||
        (item.district != null &&
          String(item.district).trim() === district);
      const matchCategory = listingsCategoryFilterMatches(
        item.categoryKey,
        category
      );
      return matchQ && matchCity && matchDistrict && matchCategory;
    });
  }, [q, city, district, category, data]);

  const displayedListings = useMemo(
    () => sortListingsFiltered(filtered, sortKey),
    [filtered, sortKey]
  );

  const categoryCounts = useMemo(
    () => buildListingCountsByCategoryKey(data),
    [data]
  );

  const navigateToListings = useCallback(
    (overrides: Partial<UrlParts> = {}) => {
      const f = filtersRef.current;
      const merged: UrlParts = {
        q: overrides.q !== undefined ? overrides.q : f.q,
        city: overrides.city !== undefined ? overrides.city : f.city,
        district:
          overrides.district !== undefined ? overrides.district : f.district,
        category:
          overrides.category !== undefined ? overrides.category : f.category,
        sort:
          overrides.sort !== undefined
            ? overrides.sort
            : (() => {
                const s = searchParams.get("sort")?.trim();
                return isListingsSortKey(s) ? s : null;
              })()
      };
      router.replace(buildListingsHref(merged), { scroll: false });
    },
    [router, searchParams]
  );

  function scheduleSearchUrl(text: string) {
    if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    qDebounceRef.current = window.setTimeout(() => {
      qDebounceRef.current = null;
      const f = filtersRef.current;
      navigateToListings({
        q: text,
        city: f.city,
        district: f.district,
        category: f.category
      });
    }, 380);
  }

  /** Masaüstü filtre kutusuyla aynı: mevcut alanları URL’ye yazar */
  function syncUrlFromSelectsNow(
    overrides: Partial<
      Pick<UrlParts, "q" | "city" | "district" | "category">
    > = {},
    opts: { flushQDebounce?: boolean } = {}
  ) {
    if (opts.flushQDebounce && qDebounceRef.current) {
      window.clearTimeout(qDebounceRef.current);
      qDebounceRef.current = null;
    }
    const f = filtersRef.current;
    navigateToListings({
      q: overrides.q ?? f.q,
      city: overrides.city ?? f.city,
      district: overrides.district ?? f.district,
      category: overrides.category ?? f.category
    });
  }

  function applyDesktopFilterClick() {
    if (qDebounceRef.current) {
      window.clearTimeout(qDebounceRef.current);
      qDebounceRef.current = null;
    }
    const f = filtersRef.current;
    navigateToListings({
      q: f.q,
      city: f.city,
      district: f.district,
      category: f.category
    });
  }

  function applyMobileDrawerAndClose() {
    syncUrlFromSelectsNow(undefined, { flushQDebounce: true });
    setMobileFilterDrawerOpen(false);
  }

  function chooseSort(sort: ListingsSortKey) {
    navigateToListings({ sort });
    if (sortDetailsRef.current) sortDetailsRef.current.open = false;
  }

  if (!ready) {
    return (
      <main className="container">
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  const filterFieldsDesktop = (
    <ListingsFilterFields
      suffix="-d"
      q={q}
      city={city}
      district={district}
      category={category}
      setQ={setQ}
      onQControlledChange={(v) => scheduleSearchUrl(v)}
      onCityChange={(v) => {
        setCity(v);
        setDistrict("");
      }}
      onDistrictChange={setDistrict}
      onCategoryChange={setCategory}
      syncUrlFromSelectsNow={(o) => syncUrlFromSelectsNow(o)}
      onDesktopFilterClick={applyDesktopFilterClick}
    />
  );

  const filterFieldsMobile = (
    <ListingsFilterFields
      suffix="-m"
      q={q}
      city={city}
      district={district}
      category={category}
      setQ={setQ}
      onQControlledChange={(v) => scheduleSearchUrl(v)}
      onCityChange={(v) => {
        setCity(v);
        setDistrict("");
      }}
      onDistrictChange={setDistrict}
      onCategoryChange={setCategory}
      syncUrlFromSelectsNow={(o) => syncUrlFromSelectsNow(o)}
      onDesktopFilterClick={applyDesktopFilterClick}
    />
  );

  return (
    <main className="container">
      <ListingsFilterDrawer
        open={mobileFilterDrawerOpen}
        onClose={() => setMobileFilterDrawerOpen(false)}
        title="Filtrele"
        footer={
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={applyMobileDrawerAndClose}
          >
            Uygula
          </button>
        }
      >
        {filterFieldsMobile}
      </ListingsFilterDrawer>

      <div className="home-satariz-layout">
        <div className="home-category-sidebar-wrap">
          <HomeCategorySidebar
            counts={categoryCounts}
            selectedCategoryKey={category || null}
            preserveParams={{ q, city, district }}
          />
        </div>
        <div className="home-satariz-main">
          <h1 className="section-title">Tüm İlanlar</h1>

          <div className="listings-mobile-toolbar-wrap">
            <button
              type="button"
              className="listings-mobile-toolbar__btn"
              onClick={() => setMobileFilterDrawerOpen(true)}
              aria-expanded={mobileFilterDrawerOpen}
            >
              <IconFilter aria-hidden />
              Filtrele
            </button>

            <details ref={sortDetailsRef} className="listings-sort-details">
              <summary>
                <IconSortArrows aria-hidden />
                Sırala
              </summary>
              <div className="listings-sort-dropdown">
                <p className="listings-sort-dropdown__heading">
                  Gelişmiş sıralama
                </p>
                {SORT_ENTRIES.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`listings-sort-option${sortKey === key ? " listings-sort-option--current" : ""}`}
                    onClick={() => chooseSort(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </details>
          </div>

          <section className="panel listings-desktop-filters-panel">
            <p className="meta" style={{ margin: "0 0 12px" }}>
              Filtreler adres çubuğuna yazılır; sayfa bağlantısını kopyalayarak aynı
              aramayı paylaşabilirsiniz. Arama kutusunda başlık,{" "}
              <strong>açıklama</strong>, <strong>kategori adı</strong>,{" "}
              <strong>şehir ve ilçe adı</strong> (örn. «Kadıköy»),{" "}
              <strong>satıcı adı</strong> veya <strong>6–9 haneli ilan no</strong>{" "}
              kullanabilirsiniz. İsterseniz önce <strong>il</strong> seçin;
              ardından <strong>ilçe</strong> menüsü dolar (bu alanlar çıkan listeyi daraltır).
            </p>
            {filterFieldsDesktop}
          </section>

          {displayedListings.length === 0 && (
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
            {displayedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                presentation="vitrin"
              />
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
