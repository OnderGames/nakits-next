import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  verifyAdminFromRequest
} from "@/lib/admin-auth";
import { sqlCategorySlugToKey } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUS = new Set([
  "all",
  "pending",
  "active",
  "sold",
  "rejected"
]);

const select = `
  id,
  listing_code,
  title,
  description,
  city,
  district,
  price,
  created_at,
  expires_at,
  status,
  categories ( slug ),
  profiles!seller_id ( full_name, email ),
  listing_images ( image_url, sort_order )
`;

export async function GET(request: Request) {
  const v = await verifyAdminFromRequest(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("status") ?? "all";
  const statusFilter = ALLOWED_STATUS.has(raw) ? raw : "all";

  let q = adminSb
    .from("listings")
    .select(select)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    q = q.eq("status", statusFilter);
  }

  const { data, error } = await q;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((row: Record<string, unknown>) => {
    const slug = (row.categories as { slug?: string } | null)?.slug ?? "";
    const categoryKey = slug
      ? sqlCategorySlugToKey(slug) ?? slug
      : "";
    const imgs = [
      ...((row.listing_images as { image_url: string; sort_order: number }[]) ??
        [])
    ].sort((a, b) => a.sort_order - b.sort_order);
    const imageUrls = imgs
      .map((x) => x.image_url?.trim())
      .filter((u): u is string => Boolean(u));
    const profiles = row.profiles as {
      full_name: string | null;
      email: string | null;
    } | null;
    const rawPrice = row.price as number | string;
    const price =
      typeof rawPrice === "string" ? parseFloat(rawPrice) : rawPrice;
    return {
      id: row.id as string,
      listingCode: (row.listing_code as string | null)?.trim() ?? "",
      title: row.title as string,
      description: row.description as string | null,
      city: row.city as string,
      district:
        row.district != null && String(row.district).trim()
          ? String(row.district).trim()
          : null,
      price: Number.isFinite(price) ? price : 0,
      created_at: row.created_at as string,
      expires_at:
        row.expires_at != null ? String(row.expires_at) : null,
      status: row.status as string,
      categoryKey,
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
      sellerName: profiles?.full_name?.trim() || "Satıcı",
      sellerEmail: profiles?.email ?? ""
    };
  });

  return Response.json({ listings: rows });
}
