import type { Listing } from "@/lib/types";

export const LISTINGS_SORT_KEYS = [
  "price_desc",
  "price_asc",
  "date_desc",
  "date_asc"
] as const;

export type ListingsSortKey = (typeof LISTINGS_SORT_KEYS)[number];

export function isListingsSortKey(s: string | null | undefined): s is ListingsSortKey {
  if (!s) return false;
  return (LISTINGS_SORT_KEYS as readonly string[]).includes(s.trim());
}

export function sortListingsFiltered(
  listings: readonly Listing[],
  sort: ListingsSortKey | null
): Listing[] {
  if (!sort) return [...listings];
  const arr = [...listings];
  const ms = (l: Listing) => new Date(l.createdAt).getTime();
  switch (sort) {
    case "price_desc":
      arr.sort((a, b) => b.price - a.price);
      break;
    case "price_asc":
      arr.sort((a, b) => a.price - b.price);
      break;
    case "date_asc":
      arr.sort((a, b) => ms(a) - ms(b));
      break;
    case "date_desc":
      arr.sort((a, b) => ms(b) - ms(a));
      break;
    default:
      break;
  }
  return arr;
}

export const LISTINGS_SORT_LABELS: Record<
  ListingsSortKey,
  string
> = {
  price_desc: "Fiyata göre (Önce en yüksek)",
  price_asc: "Fiyata göre (Önce en düşük)",
  date_desc: "Tarihe göre (Önce en yeni ilan)",
  date_asc: "Tarihe göre (Önce en eski ilan)"
};
