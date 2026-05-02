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
  title,
  description,
  city,
  price,
  created_at,
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
    const profiles = row.profiles as {
      full_name: string | null;
      email: string | null;
    } | null;
    const rawPrice = row.price as number | string;
    const price =
      typeof rawPrice === "string" ? parseFloat(rawPrice) : rawPrice;
    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      city: row.city as string,
      price: Number.isFinite(price) ? price : 0,
      created_at: row.created_at as string,
      status: row.status as string,
      categoryKey,
      imageUrl: imgs[0]?.image_url ?? null,
      sellerName: profiles?.full_name?.trim() || "Satıcı",
      sellerEmail: profiles?.email ?? ""
    };
  });

  return Response.json({ listings: rows });
}
