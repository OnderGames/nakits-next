"use client";

import {
  CATEGORY_GROUPS,
  compositeCategoryKey,
  type CategoryGroupDef
} from "@/lib/categories";

export type CategoryMillerPickerProps = {
  groupSlug: string;
  /** Bileşik anahtar `grup.alt` veya boş */
  detailCategoryKey: string;
  onGroupChange: (slug: string) => void;
  onCategoryKeyChange: (key: string) => void;
  disabled?: boolean;
};

function breadcrumbTrail(
  group: CategoryGroupDef | undefined,
  detailCategoryKey: string
): string {
  if (!group) return "Kategori seçin";
  const prefix = `${group.slug}.`;
  if (!detailCategoryKey.startsWith(prefix)) {
    return `${group.name}`;
  }
  const subSlug = detailCategoryKey.slice(prefix.length);
  const sub = group.subs.find((s) => s.slug === subSlug);
  if (!sub) return group.name;
  return `${group.name} › ${sub.name}`;
}

export default function CategoryMillerPicker({
  groupSlug,
  detailCategoryKey,
  onGroupChange,
  onCategoryKeyChange,
  disabled = false
}: CategoryMillerPickerProps) {
  const selectedGroup = CATEGORY_GROUPS.find((g) => g.slug === groupSlug);
  const col2Active = Boolean(groupSlug && !detailCategoryKey);

  return (
    <div className="category-miller">
      <div className="category-miller__head">
        <h2 className="category-miller__title">Adım adım kategori seç</h2>
        <p className="category-miller__crumb" aria-live="polite">
          {breadcrumbTrail(selectedGroup, detailCategoryKey)}
        </p>
      </div>
      <div
        className="category-miller__columns"
        role="group"
        aria-label="Kategori sütunları"
      >
        <div className="category-miller__col">
          <ul className="category-miller__list" role="listbox" aria-label="Ana kategoriler">
            {CATEGORY_GROUPS.map((group) => {
              const sel = groupSlug === group.slug;
              return (
                <li key={group.slug} className="category-miller__item">
                  <button
                    type="button"
                    disabled={disabled}
                    role="option"
                    aria-selected={sel}
                    className={
                      sel
                        ? "category-miller__row category-miller__row--selected"
                        : "category-miller__row"
                    }
                    onClick={() => {
                      onGroupChange(group.slug);
                      onCategoryKeyChange("");
                    }}
                  >
                    <span className="category-miller__row-label">
                      <span aria-hidden>{group.emoji}</span>{" "}
                      <span>{group.name}</span>
                    </span>
                    {sel && (
                      <span className="category-miller__chevron" aria-hidden>
                        ›
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className={
            col2Active
              ? "category-miller__col category-miller__col--active"
              : "category-miller__col"
          }
        >
          {!groupSlug ? (
            <p className="category-miller__placeholder">
              Önce soldan ana kategori seçin.
            </p>
          ) : (
            <ul
              className="category-miller__list"
              role="listbox"
              aria-label={`${selectedGroup?.name ?? ""} alt kategorileri`}
            >
              {(selectedGroup?.subs ?? []).map((sub) => {
                const key = compositeCategoryKey(selectedGroup!.slug, sub.slug);
                const sel = detailCategoryKey === key;
                return (
                  <li key={sub.slug} className="category-miller__item">
                    <button
                      type="button"
                      disabled={disabled}
                      role="option"
                      aria-selected={sel}
                      className={
                        sel
                          ? "category-miller__row category-miller__row--selected"
                          : "category-miller__row"
                      }
                      onClick={() => onCategoryKeyChange(key)}
                    >
                      <span className="category-miller__row-label">{sub.name}</span>
                      {sel && (
                        <span className="category-miller__ok" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <p className="category-miller__hint meta">
        Soldan ana kategoriyi seçin; sağdan alt kategoriyi seçtiğinizde tamamlanır.
      </p>
    </div>
  );
}
