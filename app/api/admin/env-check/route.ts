import {
  getServiceRoleKey,
  verifyAdminFromRequest
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Yönetici: Vercel'de service_role env gerçekten geliyor mu (değer gösterilmez). */
export async function GET(request: Request) {
  const v = await verifyAdminFromRequest(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }
  const key = getServiceRoleKey();
  return Response.json({
    hasServiceRoleKey: Boolean(key),
    hasPublicSupabaseUrl: Boolean(
      process.env["NEXT_PUBLIC_SUPABASE_URL"]?.trim()
    )
  });
}
