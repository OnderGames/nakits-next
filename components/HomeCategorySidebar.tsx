"use client";

import Link from "next/link";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey,
  parseCategoryKey
} from "@/lib/categories";
import { formatListingCountTr } from "@/lib/category-counts";
import {
  useCallback,
  useEffect,
  useMemo,
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
              </summary>
              <ul className="home-category-sidebar__subs">
                {group.subs.map((sub) => {
                  const catKey = compositeCategoryKey(group.slug, sub.slug);
                  const n = counts[catKey] ?? 0;
                  const active = selectedCategoryKey === catKey;
                  return (
                    <li key={sub.slug}>
                      <Link
                        className={
                          active
                            ? "home-category-sidebar__sub-link home-category-sidebar__sub-link--active"
                            : "home-category-sidebar__sub-link"
                        }
                        href={buildCategoryHref(catKey, preserveParams)}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="home-category-sidebar__sub-label">
                          <span className="home-category-sidebar__sub-name">
                            {sub.name}
                          </span>{" "}
                          <span className="home-category-sidebar__count">
                            ({formatListingCountTr(n)})
                          </span>
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
            </details>
          </li>
        ))}
      </ul>
    </aside>
  );
}
