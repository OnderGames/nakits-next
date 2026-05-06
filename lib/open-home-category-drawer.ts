export const HOME_CATEGORY_DRAWER_OPEN_EVENT =
  "nakits-open-home-category-drawer";

/** Ana sayfadaki kategori çekmecesini açar (`HomeCategoryDrawer`). */
export function openHomeCategoryDrawer() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HOME_CATEGORY_DRAWER_OPEN_EVENT));
}
