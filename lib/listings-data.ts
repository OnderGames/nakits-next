import type { SupabaseClient } from "@supabase/supabase-js";
import { sqlCategorySlugToKey } from "@/lib/categories";
import type { Listing } from "@/lib/types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=80";

export function formatRelativeTimeTr(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  if (Number.isNaN(d.getTime()) || diffMs < 0) return d.toLocaleDateString("tr-TR");
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return d.toLocaleDateString("tr-TR");
}

type CategoryEmbed = { slug: string } | null;
type ProfileEmbed = {
  full_name: string | null;
  phone: string | null;
  public_code: string | null;
} | null;
type ImageRow = { image_url: string; sort_order: number };

type ListingRow = {
  id: string;
  seller_id?: string;
  title: string;
  city: string;
  price: number | string;
  created_at: string;
  status?: string;
  description?: string | null;
  show_phone_on_listing?: boolean;
  categories: CategoryEmbed;
  profiles: ProfileEmbed;
  listing_images: ImageRow[] | null;
};

/** PostgREST bazen tek kaydı dizi olarak döndürür */
function embedOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function normalizeListingRow(raw: unknown): ListingRow {
  const r = raw as Record<string, unknown>;
  const categories = embedOne(
    r.categories as { slug: string } | { slug: string }[] | null | undefined
  ) as CategoryEmbed;
  const profiles = embedOne(
    r.profiles as ProfileEmbed | ProfileEmbed[] | null | undefined
  ) as ProfileEmbed;
  const li = r.listing_images;
  const listing_images = Array.isArray(li)
    ? (li as ImageRow[])
    : li
      ? [li as ImageRow]
      : null;

  return {
    id: String(r.id),
    seller_id: r.seller_id != null ? String(r.seller_id) : undefined,
    title: String(r.title),
    city: String(r.city),
    price: r.price as number | string,
    created_at: String(r.created_at),
    status: r.status as string | undefined,
    description: (r.description as string | null | undefined) ?? null,
    show_phone_on_listing: r.show_phone_on_listing as boolean | undefined,
    categories,
    profiles,
    listing_images
  };
}

function mapRowToListing(row: ListingRow): Listing {
  const slug = row.categories?.slug ?? "";
  const categoryKey = slug ? sqlCategorySlugToKey(slug) ?? slug : "";
  const images = [...(row.listing_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const image = images[0]?.image_url ?? FALLBACK_IMAGE;
  const price =
    typeof row.price === "string" ? parseFloat(row.price) : row.price;
  const status = row.status as Listing["status"] | undefined;
  const phone = row.profiles?.phone?.trim() ?? "";
  return {
    id: row.id,
    title: row.title,
    categoryKey,
    city: row.city,
    price: Number.isFinite(price) ? price : 0,
    image,
    seller: row.profiles?.full_name?.trim() || "Satıcı",
    createdAt: formatRelativeTimeTr(row.created_at),
    status,
    description: row.description ?? undefined,
    showPhoneOnListing:
      row.show_phone_on_listing === undefined
        ? true
        : Boolean(row.show_phone_on_listing),
    sellerPhone: phone.length ? phone : null,
    sellerId: row.seller_id,
    sellerPublicCode: row.profiles?.public_code?.trim() || undefined
  };
}

const listSelect = `
  id,
  seller_id,
  title,
  city,
  price,
  created_at,
  status,
  description,
  show_phone_on_listing,
  categories ( slug ),
  profiles!seller_id ( full_name, phone, public_code ),
  listing_images ( image_url, sort_order )
`;

export async function fetchPublicListings(
  sb: SupabaseClient
): Promise<Listing[]> {
  const { data, error } = await sb
    .from("listings")
    .select(listSelect)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((raw) => {
    const item = mapRowToListing(normalizeListingRow(raw));
    const { status, ...rest } = item;
    void status;
    return rest;
  });
}

export async function fetchListingById(
  sb: SupabaseClient,
  id: string
): Promise<Listing | null> {
  const { data, error } = await sb
    .from("listings")
    .select(listSelect)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToListing(normalizeListingRow(data));
}

export async function fetchMyListings(
  sb: SupabaseClient,
  sellerId: string
): Promise<Listing[]> {
  const { data, error } = await sb
    .from("listings")
    .select(listSelect)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((raw) => mapRowToListing(normalizeListingRow(raw)));
}

export async function fetchSellerActiveListings(
  sb: SupabaseClient,
  sellerId: string,
  limit: number
): Promise<Listing[]> {
  const { data, error } = await sb
    .from("listings")
    .select(listSelect)
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((raw) => {
    const item = mapRowToListing(normalizeListingRow(raw));
    const { status, ...rest } = item;
    void status;
    return rest;
  });
}

/** Herkese açık üye sayfası: yayındaki ilanlar */
export async function fetchPublicActiveListingsForSeller(
  sb: SupabaseClient,
  sellerId: string
): Promise<Listing[]> {
  const { data, error } = await sb
    .from("listings")
    .select(listSelect)
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((raw) => {
    const item = mapRowToListing(normalizeListingRow(raw));
    const { status, ...rest } = item;
    void status;
    return rest;
  });
}

export type PublicProfileBasics = {
  id: string;
  publicCode: string;
  displayName: string;
  city: string | null;
};

/** Üye numarası (6–9 hane) ile herkese açık profil */
export async function fetchPublicProfileByPublicCode(
  sb: SupabaseClient,
  publicCode: string
): Promise<PublicProfileBasics | null> {
  const code = publicCode.trim();
  const { data, error } = await sb
    .from("profiles")
    .select("id, full_name, city, public_code")
    .eq("public_code", code)
    .maybeSingle();

  if (error || !data) return null;
  const name = (data.full_name as string | null)?.trim();
  const pc = (data.public_code as string | null)?.trim();
  if (!pc) return null;
  return {
    id: data.id as string,
    publicCode: pc,
    displayName: name && name.length > 0 ? name : "Üye",
    city: (data.city as string | null)?.trim() || null
  };
}

/** İlan düzenleme formu (satıcı paneli) */
export type ListingForEdit = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  city: string;
  condition: "new" | "used";
  showPhoneOnListing: boolean;
  categoryKey: string;
  coverImageUrl: string;
  status?: Listing["status"];
};

type ListingEditRowRaw = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number | string;
  city: string;
  condition: string;
  show_phone_on_listing?: boolean;
  status?: string;
  categories: { slug: string } | { slug: string }[] | null;
  listing_images: ImageRow[] | null;
};

export async function fetchListingForEdit(
  sb: SupabaseClient,
  listingId: string
): Promise<ListingForEdit | null> {
  const { data, error } = await sb
    .from("listings")
    .select(
      `
      id,
      seller_id,
      title,
      description,
      price,
      city,
      condition,
      show_phone_on_listing,
      status,
      categories ( slug ),
      listing_images ( image_url, sort_order )
    `
    )
    .eq("id", listingId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as ListingEditRowRaw;
  const cat = embedOne(row.categories);
  const slug = cat?.slug ?? "";
  const categoryKey = sqlCategorySlugToKey(slug) ?? slug.replace(/_/g, ".");
  const images = [...(row.listing_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const priceRaw = row.price;
  const price =
    typeof priceRaw === "string" ? parseFloat(priceRaw) : priceRaw;

  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title,
    description: row.description ?? "",
    price: Number.isFinite(price) ? price : 0,
    city: row.city,
    condition: row.condition === "new" ? "new" : "used",
    showPhoneOnListing: row.show_phone_on_listing !== false,
    categoryKey,
    coverImageUrl: images[0]?.image_url ?? FALLBACK_IMAGE,
    status: row.status as Listing["status"] | undefined
  };
}
