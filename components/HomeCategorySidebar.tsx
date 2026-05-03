import Link from "next/link";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey
} from "@/lib/categories";

/** Satariz tarzı sol sütun: grup başlıkları + alt kategori linkleri */
export default function HomeCategorySidebar() {
  return (
    <aside className="home-category-sidebar" aria-labelledby="home-cat-sidebar-title">
      <h2 id="home-cat-sidebar-title" className="home-category-sidebar__title">
        Kategoriler
      </h2>
      <ul className="home-category-sidebar__list">
        {CATEGORY_GROUPS.map((group, idx) => (
          <li key={group.slug}>
            <details
              className="home-category-sidebar__details"
              open={idx === 0}
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
                {group.subs.map((sub) => (
                  <li key={sub.slug}>
                    <Link
                      className="home-category-sidebar__sub-link"
                      href={`/listings?category=${encodeURIComponent(
                        compositeCategoryKey(group.slug, sub.slug)
                      )}`}
                    >
                      <span className="home-category-sidebar__sub-name">
                        {sub.name}
                      </span>
                      <span className="home-category-sidebar__arrow" aria-hidden>
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </aside>
  );
}
