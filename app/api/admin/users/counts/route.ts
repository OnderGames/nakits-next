import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  verifyModerationStaff
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const sb = adminSb;

  const [totalR, blockedR, panelR] = await Promise.all([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb
      .from("profile_staff")
      .select("*", { count: "exact", head: true })
      .eq("is_blocked", true),
    sb
      .from("profile_staff")
      .select("*", { count: "exact", head: true })
      .in("app_role", ["moderator", "admin"])
  ]);

  if (totalR.error || blockedR.error || panelR.error) {
    return Response.json({ error: "Üye sayıları okunamadı." }, { status: 500 });
  }

  const total = typeof totalR.count === "number" ? totalR.count : 0;
  const blocked = typeof blockedR.count === "number" ? blockedR.count : 0;
  const panelAccess = typeof panelR.count === "number" ? panelR.count : 0;

  return Response.json({
    total,
    blocked,
    panel_access: panelAccess,
    /** Toplam − engelli (bilgi amaçlı; çift kayıt edge-case’inde negatif olmaz). */
    active_members: Math.max(0, total - blocked)
  });
}
