"use client";

import { CATEGORY_GROUPS } from "@/lib/categories";

type Props = {
  disabled?: boolean;
  onSelectMain: (groupSlug: string) => void;
};

export default function AddListingMainCategoryGrid({
  disabled,
  onSelectMain
}: Props) {
  return (
    <section className="add-listing-main-cat" aria-label="Ana kategori seçimi">
      <p className="add-listing-main-cat__lead">
        Önce ana grubu seç; ardından alt türü (örneğin Vasıta → Otomobil → marka /
        model) adım adım netleştireceğiz.
      </p>
      <ul className="add-listing-main-cat__grid">
        {CATEGORY_GROUPS.map((g) => (
          <li key={g.slug} className="add-listing-main-cat__cell">
            <button
              type="button"
              className="add-listing-main-cat__tile"
              disabled={disabled}
              onClick={() => onSelectMain(g.slug)}
            >
              <span className="add-listing-main-cat__emoji" aria-hidden>
                {g.emoji}
              </span>
              <span className="add-listing-main-cat__name">{g.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
