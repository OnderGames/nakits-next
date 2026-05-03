import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { sqlCategorySlugToKey } from "@/lib/categories";
import type { Listing } from "@/lib/types";
import { MAX_LISTINGS_PER_USER } from "@/lib/listing-policy";

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
  public_code: string | null;
} | null;
type ImageRow = { image_url: string; sort_order: number };

type ListingRow = {
  id: string;
  listing_code?: string;
  seller_id?: string;
  title: string;
  city: string;
  district?: string | null;
  price: number | string;
  created_at: string;
  expires_at?: string;
  status?: string;
  description?: string | null;
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
    listing_code:
      r.listing_code != null ? String(r.listing_code).trim() : undefined,
    seller_id: r.seller_id != null ? String(r.seller_id) : undefined,
    title: String(r.title),
    city: String(r.city),
    district:
      r.district != null && String(r.district).trim()
        ? String(r.district).trim()
        : null,
    price: r.price as number | string,
    created_at: String(r.created_at),
    expires_at:
      r.expires_at != null ? String(r.expires_at) : undefined,
    status: r.status as string | undefined,
    description: (r.description as string | null | undefined) ?? null,
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
  const urls = images
    .map((x) => x.image_url?.trim())
    .filter((u): u is string => Boolean(u));
  const image = urls[0] ?? FALLBACK_IMAGE;
  const price =
    typeof row.price === "string" ? parseFloat(row.price) : row.price;
  const status = row.status as Listing["status"] | undefined;
  return {
    id: row.id,
    listingCode: row.listing_code?.trim() || undefined,
    title: row.title,
    categoryKey,
    city: row.city,
    district: row.district ?? null,
    price: Number.isFinite(price) ? price : 0,
    image,
    imageUrls: urls.length > 0 ? urls : undefined,
    seller: row.profiles?.full_name?.trim() || "Satıcı",
    createdAt: formatRelativeTimeTr(row.created_at),
    status,
    description: row.description ?? undefined,
    sellerId: row.seller_id,
    sellerPublicCode: row.profiles?.public_code?.trim() || undefined,
    expiresAt: row.expires_at ?? undefined
  };
}

/** Eski veritabanlarında district yoksa ilk select hata verir; district'siz tekrarlanır */
const listSelectNoDistrict = `
  id,
  listing_code,
  seller_id,
  title,
  city,
  price,
  created_at,
  expires_at,
  status,
  description,
  categories ( slug ),
  profiles!seller_id ( full_name, public_code ),
  listing_images ( image_url, sort_order )
`;

const listSelect = `
  id,
  listing_code,
  seller_id,
  title,
  city,
  district,
  price,
  created_at,
  expires_at,
  status,
  description,
  categories ( slug ),
  profiles!seller_id ( full_name, public_code ),
  listing_images ( image_url, sort_order )
`;

function isMissingDistrictColumnError(error: PostgrestError | null): boolean {
  if (!error?.message) return false;
  const m =
    `${error.message} ${(error as { details?: string }).details ?? ""} ${(error as { hint?: string }).hint ?? ""}`.toLowerCase();
  /* PostgREST: schema cache / unknown column — metin sürüme göre değişir; "district" yeterli sinyal */
  return m.includes("district");
}

async function withListingSelectFallback<T>(
  run: (
    selectStr: string
  ) => PromiseLike<{ data: T; error: PostgrestError | null }>
): Promise<{ data: T; error: PostgrestError | null }> {
  const first = await run(listSelect);
  if (!first.error) return first;
  if (!isMissingDistrictColumnError(first.error)) return first;
  return run(listSelectNoDistrict);
}

const listingEditSelect = `
      id,
      listing_code,
      seller_id,
      title,
      description,
      price,
      city,
      district,
      condition,
      status,
      expires_at,
      categories ( slug ),
      listing_images ( id, image_url, sort_order )
    `;

const listingEditSelectNoDistrict = `
      id,
      listing_code,
      seller_id,
      title,
      description,
      price,
      city,
      condition,
      status,
      expires_at,
      categories ( slug ),
      listing_images ( id, image_url, sort_order )
    `;

async function withEditListingSelectFallback<T>(
  run: (
    selectStr: string
  ) => PromiseLike<{ data: T; error: PostgrestError | null }>
): Promise<{ data: T; error: PostgrestError | null }> {
  const first = await run(listingEditSelect);
  if (!first.error) return first;
  if (!isMissingDistrictColumnError(first.error)) return first;
  return run(listingEditSelectNoDistrict);
}

export async function fetchPublicListings(
  sb: SupabaseClient
): Promise<Listing[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await withListingSelectFallback((sel) =>
    sb
      .from("listings")
      .select(sel)
      .eq("status", "active")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
  );

  if (error || !data) return [];
  return data.map((raw) => {
    const item = mapRowToListing(normalizeListingRow(raw));
    const { status, ...rest } = item;
    void status;
    return rest;
  });
}

/** Favoriler sırasına göre id listesi — yalnızca yayındaki ve süresi dolmamış ilanlar döner */
export async function fetchPublicListingsByIds(
  sb: SupabaseClient,
  idsOrdered: string[]
): Promise<Listing[]> {
  if (idsOrdered.length === 0) return [];
  const nowIso = new Date().toISOString();
  const { data, error } = await withListingSelectFallback((sel) =>
    sb
      .from("listings")
      .select(sel)
      .in("id", idsOrdered)
      .eq("status", "active")
      .gt("expires_at", nowIso)
  );

  if (error || !data) return [];
  const order = new Map(idsOrdered.map((id, i) => [id, i]));
  const rows = data.map((raw) => {
    const item = mapRowToListing(normalizeListingRow(raw));
    const { status, ...rest } = item;
    void status;
    return rest;
  });
  rows.sort(
    (a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999)
  );
  return rows;
}

export async function fetchListingById(
  sb: SupabaseClient,
  id: string
): Promise<Listing | null> {
  const { data, error } = await withListingSelectFallback((sel) =>
    sb.from("listings").select(sel).eq("id", id).maybeSingle()
  );

  if (error || !data) return null;
  return mapRowToListing(normalizeListingRow(data));
}

export async function fetchListingByCode(
  sb: SupabaseClient,
  code: string
): Promise<Listing | null> {
  const normalized = code.trim();
  if (!/^[0-9]{6,9}$/.test(normalized)) return null;
  const { data, error } = await withListingSelectFallback((sel) =>
    sb
      .from("listings")
      .select(sel)
      .eq("listing_code", normalized)
      .maybeSingle()
  );

  if (error || !data) return null;
  return mapRowToListing(normalizeListingRow(data));
}

export async function fetchMyListings(
  sb: SupabaseClient,
  sellerId: string
): Promise<Listing[]> {
  const { data, error } = await withListingSelectFallback((sel) =>
    sb
      .from("listings")
      .select(sel)
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
  );

  if (error || !data) return [];
  return data.map((raw) => mapRowToListing(normalizeListingRow(raw)));
}

/** Onay bekleyen + yayındaki ilan sayısı (kota için) */
export async function countSellerOpenListings(
  sb: SupabaseClient,
  sellerId: string
): Promise<number> {
  const { count, error } = await sb
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .in("status", ["pending", "active"]);
  if (error) return MAX_LISTINGS_PER_USER;
  return typeof count === "number" ? count : 0;
}

export async function fetchSellerActiveListings(
  sb: SupabaseClient,
  sellerId: string,
  limit: number
): Promise<Listing[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await withListingSelectFallback((sel) =>
    sb
      .from("listings")
      .select(sel)
      .eq("seller_id", sellerId)
      .eq("status", "active")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(limit)
  );

  if (error || !data) return [];
  return data.map((raw) => mapRowToListing(normalizeListingRow(raw)));
}

/** Herkese açık üye sayfası: yayındaki ilanlar */
export async function fetchPublicActiveListingsForSeller(
  sb: SupabaseClient,
  sellerId: string
): Promise<Listing[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await withListingSelectFallback((sel) =>
    sb
      .from("listings")
      .select(sel)
      .eq("seller_id", sellerId)
      .eq("status", "active")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
  );

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
  listingCode: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  city: string;
  district: string | null;
  condition: "new" | "used";
  categoryKey: string;
  coverImageUrl: string;
  /** Sıralı galeri (kapak = ilk öğe) */
  galleryImages: { id: string; imageUrl: string }[];
  status?: Listing["status"];
  expiresAt?: string;
};

type ListingEditRowRaw = {
  id: string;
  listing_code?: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number | string;
  city: string;
  district?: string | null;
  condition: string;
  status?: string;
  categories: { slug: string } | { slug: string }[] | null;
  listing_images:
    | { id: string; image_url: string; sort_order: number }[]
    | null;
  expires_at?: string;
};

export async function fetchListingForEdit(
  sb: SupabaseClient,
  listingId: string
): Promise<ListingForEdit | null> {
  const { data, error } = await withEditListingSelectFallback((sel) =>
    sb.from("listings").select(sel).eq("id", listingId).maybeSingle()
  );

  if (error || !data) return null;

  const row = data as unknown as ListingEditRowRaw;
  const cat = embedOne(row.categories);
  const slug = cat?.slug ?? "";
  const categoryKey = sqlCategorySlugToKey(slug) ?? slug.replace(/_/g, ".");
  const images = [...(row.listing_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const galleryImages = images.map((im) => ({
    id: im.id,
    imageUrl: im.image_url
  }));
  const priceRaw = row.price;
  const price =
    typeof priceRaw === "string" ? parseFloat(priceRaw) : priceRaw;

  return {
    id: row.id,
    listingCode: String(row.listing_code ?? "").trim() || "—",
    sellerId: row.seller_id,
    title: row.title,
    description: row.description ?? "",
    price: Number.isFinite(price) ? price : 0,
    city: row.city,
    district:
      row.district != null && String(row.district).trim()
        ? String(row.district).trim()
        : null,
    condition: row.condition === "new" ? "new" : "used",
    categoryKey,
    coverImageUrl: images[0]?.image_url ?? FALLBACK_IMAGE,
    galleryImages,
    status: row.status as Listing["status"] | undefined,
    expiresAt: row.expires_at ?? undefined
  };
}

/** İlan silinirken depodaki fotoğraf klasörünü boşaltır (best-effort). */
export async function removeListingImagesFolderFromStorage(
  sb: SupabaseClient,
  userId: string,
  listingId: string
): Promise<void> {
  const folder = `${userId}/${listingId}`;
  const { data: files, error: listErr } = await sb.storage
    .from("listing-images")
    .list(folder);
  if (listErr || !files?.length) return;
  const paths = files.map((f) => `${folder}/${f.name}`);
  await sb.storage.from("listing-images").remove(paths);
}
