"use client";

import Link from "next/link";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey,
  KONUT_LISTING_KINDS,
  KONUT_PROPERTY_TYPES,
  konutLeafCategorySubSlug,
  leafRowsForCategoryGroup,
  getOtomobilModelsForBrand,
  OTOMOBIL_MARKALARI,
  parseCategoryKey
} from "@/lib/categories";
import {
  formatListingCountTr,
  sumListingCountsWhere
} from "@/lib/category-counts";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type Props = {
  /** Her alt kategori için bileşik anahtar → yayındaki ilan sayısı */
  counts: Record<string, number>;
  /** Seçili alt kategori (URL category=...) — satır vurgusu + grup açık */
  selectedCategoryKey?: string | null;
  /** Kategori linklerinde korunacak parametreler (ilanlar sayfası: q, city, district) */
  preserveParams?: Partial<
    Record<"q" | "city" | "district", string>
  > | null;
};

function buildCategoryHref(
  catKey: string,
  preserve: Props["preserveParams"]
): string {
  const sp = new URLSearchParams();
  sp.set("category", catKey);
  if (preserve) {
    const q = preserve.q?.trim();
    if (q) sp.set("q", q);
    if (preserve.city) sp.set("city", preserve.city);
    if (preserve.district) sp.set("district", preserve.district);
  }
  const qs = sp.toString();
  return qs ? `/listings?${qs}` : "/listings";
}

const GM = "gayrimenkul";

function displayOtomobilModelLabel(name: string): string {
  const i = name.lastIndexOf("›");
  return i === -1 ? name : name.slice(i + 1).trim();
}

type OtomobilSeriesGroup = {
  seriesLabel: string;
  seriesSlug: string | null;
  models: Array<{ slug: string; label: string }>;
};

function groupOtomobilModelsBySeries(
  models: readonly { slug: string; name: string }[]
): OtomobilSeriesGroup[] {
  const groups = new Map<string, OtomobilSeriesGroup>();
  for (const mod of models) {
    const parts = mod.name.split("›").map((x) => x.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const seriesLabel = parts[0];
      const modelLabel = parts.slice(1).join(" › ");
      const current = groups.get(seriesLabel);
      if (current) {
        current.models.push({ slug: mod.slug, label: modelLabel });
      } else {
        groups.set(seriesLabel, {
          seriesLabel,
          seriesSlug: null,
          models: [{ slug: mod.slug, label: modelLabel }]
        });
      }
      continue;
    }
    const seriesLabel = displayOtomobilModelLabel(mod.name);
    const current = groups.get(seriesLabel);
    if (current) {
      current.seriesSlug = mod.slug;
    } else {
      groups.set(seriesLabel, { seriesLabel, seriesSlug: mod.slug, models: [] });
    }
  }
  return [...groups.values()];
}

function gayrimenkulSubFromKey(key: string | null | undefined): string | null {
  if (!key?.trim()) return null;
  const t = key.trim();
  if (!t.startsWith(`${GM}.`)) return null;
  return t.slice(GM.length + 1);
}

/** Satariz tarzı sol sütun: grup başlıkları + alt kategori linkleri + sayılar */
export default function HomeCategorySidebar({
  counts,
  selectedCategoryKey = null,
  preserveParams = null
}: Props) {
  const groupSlugFromSelection = useMemo(() => {
    if (!selectedCategoryKey?.trim()) return null;
    const parsed = parseCategoryKey(selectedCategoryKey.trim());
    return parsed?.group.slug ?? null;
  }, [selectedCategoryKey]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() =>
    groupSlugFromSelection ? new Set([groupSlugFromSelection]) : new Set()
  );

  useEffect(() => {
    if (groupSlugFromSelection) {
      setOpenGroups((prev) => {
        const n = new Set(prev);
        n.add(groupSlugFromSelection);
        return n;
      });
    }
  }, [groupSlugFromSelection]);

  const handleToggle = useCallback((groupSlug: string, nowOpen: boolean) => {
    setOpenGroups((prev) => {
      const n = new Set(prev);
      if (nowOpen) n.add(groupSlug);
      else n.delete(groupSlug);
      return n;
    });
  }, []);

  /** Ana grup başlığı: o gruba ait tüm ilanlar */
  const groupTotals = useMemo(() => {
    const m: Record<string, number> = {};
    for (const g of CATEGORY_GROUPS) {
      m[g.slug] = sumListingCountsWhere(counts, (k) =>
        k.startsWith(`${g.slug}.`)
      );
    }
    return m;
  }, [counts]);

  const gmTotals = useMemo(
    () => ({
      konut: sumListingCountsWhere(
        counts,
        (k) =>
          k === `${GM}.konut` ||
          k.startsWith(`${GM}.konut-`)
      ),
      konutSatilik: sumListingCountsWhere(counts, (k) =>
        k.startsWith(`${GM}.konut-satilik-`)
      ),
      konutKiralik: sumListingCountsWhere(counts, (k) =>
        k.startsWith(`${GM}.konut-kiralik-`)
      ),
      isyeri: sumListingCountsWhere(counts, (k) =>
        k.startsWith(`${GM}.isyeri-ofis-`)
      ),
      arsa: sumListingCountsWhere(counts, (k) =>
        k.startsWith(`${GM}.arsa-`)
      ),
      toprak: sumListingCountsWhere(counts, (k) =>
        k.startsWith(`${GM}.toprak-`)
      ),
      depo: sumListingCountsWhere(counts, (k) =>
        k.startsWith(`${GM}.depo-garaj-`)
      )
    }),
    [counts]
  );

  const tasitlarTotals = useMemo(
    () => ({
      otomobil: sumListingCountsWhere(
        counts,
        (k) =>
          k === "tasitlar.otomobil" || k.startsWith("tasitlar.otomobil-")
      )
    }),
    [counts]
  );

  const SummaryCount = ({ n }: { n: number }) => (
    <span className="home-category-sidebar__summary-count">
      ({formatListingCountTr(n)})
    </span>
  );

  const konutRef = useRef<HTMLDetailsElement>(null);
  const konutSatRef = useRef<HTMLDetailsElement>(null);
  const konutKirRef = useRef<HTMLDetailsElement>(null);
  const isyeriRef = useRef<HTMLDetailsElement>(null);
  const arsaRef = useRef<HTMLDetailsElement>(null);
  const toprakRef = useRef<HTMLDetailsElement>(null);
  const depoRef = useRef<HTMLDetailsElement>(null);
  const otomobilTasitRef = useRef<HTMLDetailsElement>(null);
  const otomobilBrandDetailRefs = useRef<
    Record<string, HTMLDetailsElement | null>
  >({});

  useEffect(() => {
    const sub = gayrimenkulSubFromKey(selectedCategoryKey);
    const setOpen = (el: HTMLDetailsElement | null, v: boolean) => {
      if (el) el.open = v;
    };
    if (!sub) return;

    setOpen(
      konutRef.current,
      sub === "konut" || sub.startsWith("konut-")
    );
    setOpen(konutSatRef.current, sub.startsWith("konut-satilik-"));
    setOpen(konutKirRef.current, sub.startsWith("konut-kiralik-"));

    setOpen(
      isyeriRef.current,
      sub === "isyeri-ofis" || sub.startsWith("isyeri-ofis-")
    );
    setOpen(arsaRef.current, sub === "arsa" || sub.startsWith("arsa-"));
    setOpen(toprakRef.current, sub === "toprak" || sub.startsWith("toprak-"));
    setOpen(
      depoRef.current,
      sub === "depo-garaj" || sub.startsWith("depo-garaj-")
    );
  }, [selectedCategoryKey]);

  useEffect(() => {
    const key = selectedCategoryKey?.trim();
    if (!key?.startsWith("tasitlar.")) return;
    const rest = key.slice("tasitlar.".length);
    if (otomobilTasitRef.current) {
      otomobilTasitRef.current.open =
        rest === "otomobil" || rest.startsWith("otomobil-");
    }
    for (const m of OTOMOBIL_MARKALARI) {
      const models = getOtomobilModelsForBrand(m.slug);
      if (!models?.length) continue;
      const el = otomobilBrandDetailRefs.current[m.slug];
      if (el) {
        el.open = rest.startsWith(`otomobil-${m.slug}`);
      }
    }
  }, [selectedCategoryKey]);

  const renderSubLink = (compositeKey: string, label: string) => {
    const n = counts[compositeKey] ?? 0;
    const active = selectedCategoryKey === compositeKey;
    return (
      <Link
        className={
          active
            ? "home-category-sidebar__sub-link home-category-sidebar__sub-link--active"
            : "home-category-sidebar__sub-link"
        }
        href={buildCategoryHref(compositeKey, preserveParams)}
        aria-current={active ? "page" : undefined}
      >
        <span className="home-category-sidebar__sub-name">{label}</span>
        <span className="home-category-sidebar__count">
          ({formatListingCountTr(n)})
        </span>
        <span className="home-category-sidebar__arrow" aria-hidden>
          ›
        </span>
      </Link>
    );
  };

  const renderGayrimenkulNested = () => (
    <ul className="home-category-sidebar__subs home-category-sidebar__subs--nest-root">
      <li>
        <details
          ref={konutRef}
          className="home-category-sidebar__nest-details"
        >
          <summary className="home-category-sidebar__nest-summary">
            <span className="home-category-sidebar__nest-summary-label">
              Konut
            </span>
            <SummaryCount n={gmTotals.konut} />
          </summary>
          <ul className="home-category-sidebar__nest-list">
            {KONUT_LISTING_KINDS.map((txn) => {
              const innerRef =
                txn.slug === "satilik" ? konutSatRef : konutKirRef;
              return (
                <li key={txn.slug}>
                  <details
                    ref={innerRef}
                    className="home-category-sidebar__nest-details"
                  >
                    <summary className="home-category-sidebar__nest-summary">
                      <span className="home-category-sidebar__nest-summary-label">
                        {txn.name}
                      </span>
                      <SummaryCount
                        n={
                          txn.slug === "satilik"
                            ? gmTotals.konutSatilik
                            : gmTotals.konutKiralik
                        }
                      />
                    </summary>
                    <ul className="home-category-sidebar__nest-list home-category-sidebar__nest-list--leaves">
                      {KONUT_PROPERTY_TYPES.map((prop) => {
                        const subSlug = konutLeafCategorySubSlug(
                          txn.slug,
                          prop.slug
                        );
                        const compositeKey = compositeCategoryKey(GM, subSlug);
                        return (
                          <li key={subSlug}>{renderSubLink(compositeKey, prop.name)}</li>
                        );
                      })}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </details>
      </li>
      <li>
        <details
          ref={isyeriRef}
          className="home-category-sidebar__nest-details"
        >
          <summary className="home-category-sidebar__nest-summary">
            <span className="home-category-sidebar__nest-summary-label">
              İş yeri
            </span>
            <SummaryCount n={gmTotals.isyeri} />
          </summary>
          <ul className="home-category-sidebar__nest-list home-category-sidebar__nest-list--leaves">
            {KONUT_LISTING_KINDS.map((txn) => {
              const subSlug = `isyeri-ofis-${txn.slug}`;
              const compositeKey = compositeCategoryKey(GM, subSlug);
              return (
                <li key={subSlug}>{renderSubLink(compositeKey, txn.name)}</li>
              );
            })}
          </ul>
        </details>
      </li>
      <li>
        <details ref={arsaRef} className="home-category-sidebar__nest-details">
          <summary className="home-category-sidebar__nest-summary">
            <span className="home-category-sidebar__nest-summary-label">
              Arsa
            </span>
            <SummaryCount n={gmTotals.arsa} />
          </summary>
          <ul className="home-category-sidebar__nest-list home-category-sidebar__nest-list--leaves">
            {KONUT_LISTING_KINDS.map((txn) => {
              const subSlug = `arsa-${txn.slug}`;
              const compositeKey = compositeCategoryKey(GM, subSlug);
              return (
                <li key={subSlug}>{renderSubLink(compositeKey, txn.name)}</li>
              );
            })}
          </ul>
        </details>
      </li>
      <li>
        <details
          ref={toprakRef}
          className="home-category-sidebar__nest-details"
        >
          <summary className="home-category-sidebar__nest-summary">
            <span className="home-category-sidebar__nest-summary-label">
              Toprak & tarla
            </span>
            <SummaryCount n={gmTotals.toprak} />
          </summary>
          <ul className="home-category-sidebar__nest-list home-category-sidebar__nest-list--leaves">
            {KONUT_LISTING_KINDS.map((txn) => {
              const subSlug = `toprak-${txn.slug}`;
              const compositeKey = compositeCategoryKey(GM, subSlug);
              return (
                <li key={subSlug}>{renderSubLink(compositeKey, txn.name)}</li>
              );
            })}
          </ul>
        </details>
      </li>
      <li>
        <details ref={depoRef} className="home-category-sidebar__nest-details">
          <summary className="home-category-sidebar__nest-summary">
            <span className="home-category-sidebar__nest-summary-label">
              Depo & garaj
            </span>
            <SummaryCount n={gmTotals.depo} />
          </summary>
          <ul className="home-category-sidebar__nest-list home-category-sidebar__nest-list--leaves">
            {KONUT_LISTING_KINDS.map((txn) => {
              const subSlug = `depo-garaj-${txn.slug}`;
              const compositeKey = compositeCategoryKey(GM, subSlug);
              return (
                <li key={subSlug}>{renderSubLink(compositeKey, txn.name)}</li>
              );
            })}
          </ul>
        </details>
      </li>
    </ul>
  );

  const renderTasitlarNested = () => {
    const g = CATEGORY_GROUPS.find((x) => x.slug === "tasitlar")!;
    const digerSubs = g.subs.filter((s) => s.slug !== "otomobil");
    return (
      <ul className="home-category-sidebar__subs home-category-sidebar__subs--nest-root">
        <li>
          <details
            ref={otomobilTasitRef}
            className="home-category-sidebar__nest-details"
          >
            <summary className="home-category-sidebar__nest-summary">
              <span className="home-category-sidebar__nest-summary-label">
                Otomobil
              </span>
              <SummaryCount n={tasitlarTotals.otomobil} />
            </summary>
            <ul className="home-category-sidebar__nest-list">
              {OTOMOBIL_MARKALARI.map((m) => {
                const models = getOtomobilModelsForBrand(m.slug);
                if (models?.length) {
                  const brandTotal = sumListingCountsWhere(
                    counts,
                    (k) =>
                      k === `tasitlar.otomobil-${m.slug}` ||
                      k.startsWith(`tasitlar.otomobil-${m.slug}-`)
                  );
                  return (
                    <li key={m.slug}>
                      <details
                        ref={(el) => {
                          otomobilBrandDetailRefs.current[m.slug] = el;
                        }}
                        className="home-category-sidebar__nest-details"
                      >
                        <summary className="home-category-sidebar__nest-summary">
                          <span className="home-category-sidebar__nest-summary-label">
                            {m.name}
                          </span>
                          <SummaryCount n={brandTotal} />
                        </summary>
                        <ul className="home-category-sidebar__nest-list home-category-sidebar__nest-list--leaves">
                          {groupOtomobilModelsBySeries(models).map((series) => {
                            const seriesCompositeKey = series.seriesSlug
                              ? compositeCategoryKey(
                                  "tasitlar",
                                  `otomobil-${m.slug}-${series.seriesSlug}`
                                )
                              : null;
                            const seriesCount = sumListingCountsWhere(
                              counts,
                              (k) => {
                                if (seriesCompositeKey && k === seriesCompositeKey) return true;
                                if (!series.seriesSlug) return false;
                                return k.startsWith(
                                  `tasitlar.otomobil-${m.slug}-${series.seriesSlug}-`
                                );
                              }
                            );
                            return (
                              <li key={series.seriesLabel}>
                                <details className="home-category-sidebar__nest-details">
                                  <summary className="home-category-sidebar__nest-summary">
                                    {seriesCompositeKey ? (
                                      <span className="home-category-sidebar__nest-summary-label">
                                        {series.seriesLabel}
                                      </span>
                                    ) : (
                                      <span className="home-category-sidebar__nest-summary-label">
                                        {series.seriesLabel}
                                      </span>
                                    )}
                                    <SummaryCount n={seriesCount} />
                                  </summary>
                                  <ul className="home-category-sidebar__nest-list home-category-sidebar__nest-list--leaves">
                                    {series.models.map((mod) => {
                                      const compositeKey = compositeCategoryKey(
                                        "tasitlar",
                                        `otomobil-${m.slug}-${mod.slug}`
                                      );
                                      return (
                                        <li key={mod.slug}>
                                          {renderSubLink(compositeKey, mod.label)}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </details>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    </li>
                  );
                }
                const compositeKey = compositeCategoryKey(
                  "tasitlar",
                  `otomobil-${m.slug}`
                );
                return (
                  <li key={m.slug}>{renderSubLink(compositeKey, m.name)}</li>
                );
              })}
            </ul>
          </details>
        </li>
        {digerSubs.map((sub) => (
          <li key={sub.slug}>
            {renderSubLink(
              compositeCategoryKey("tasitlar", sub.slug),
              sub.name
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <aside
      className="home-category-sidebar"
      aria-labelledby="home-cat-sidebar-title"
    >
      <h2 id="home-cat-sidebar-title" className="home-category-sidebar__title">
        Kategoriler
      </h2>
      <ul className="home-category-sidebar__list">
        {CATEGORY_GROUPS.map((group) => (
          <li key={group.slug}>
            <details
              className="home-category-sidebar__details"
              open={openGroups.has(group.slug)}
              onToggle={(e) => {
                handleToggle(group.slug, e.currentTarget.open);
              }}
            >
              <summary className="home-category-sidebar__summary">
                <span className="home-category-sidebar__emoji" aria-hidden>
                  {group.emoji}
                </span>
                <span className="home-category-sidebar__group-name">
                  {group.name}
                </span>
                <SummaryCount n={groupTotals[group.slug] ?? 0} />
              </summary>
              {group.slug === "gayrimenkul" ? (
                renderGayrimenkulNested()
              ) : group.slug === "tasitlar" ? (
                renderTasitlarNested()
              ) : (
                <ul className="home-category-sidebar__subs">
                  {leafRowsForCategoryGroup(group).map((row) => {
                    const n = counts[row.compositeKey] ?? 0;
                    const active = selectedCategoryKey === row.compositeKey;
                    return (
                      <li key={row.reactKey}>
                        <Link
                          className={
                            active
                              ? "home-category-sidebar__sub-link home-category-sidebar__sub-link--active"
                              : "home-category-sidebar__sub-link"
                          }
                          href={buildCategoryHref(
                            row.compositeKey,
                            preserveParams
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <span className="home-category-sidebar__sub-name">
                            {row.label}
                          </span>
                          <span className="home-category-sidebar__count">
                            ({formatListingCountTr(n)})
                          </span>
                          <span
                            className="home-category-sidebar__arrow"
                            aria-hidden
                          >
                            ›
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </details>
          </li>
        ))}
      </ul>
    </aside>
  );
}
