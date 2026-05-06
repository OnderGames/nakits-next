import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  verifyModerationStaff
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["pending", "active", "sold", "rejected"] as const;

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

  async function countStatus(status: string | null): Promise<number> {
    let q = sb.from("listings").select("*", {
      count: "exact",
      head: true
    });
    if (status !== null) {
      q = q.eq("status", status);
    }
    const { count, error } = await q;
    if (error) return -1;
    return typeof count === "number" ? count : 0;
  }

  const [total, ...byStatus] = await Promise.all([
    countStatus(null),
    ...STATUSES.map((s) => countStatus(s))
  ]);

  if (total < 0 || byStatus.some((n) => n < 0)) {
    return Response.json({ error: "İlan sayıları okunamadı." }, { status: 500 });
  }

  return Response.json({
    total,
    pending: byStatus[0] ?? 0,
    active: byStatus[1] ?? 0,
    sold: byStatus[2] ?? 0,
    rejected: byStatus[3] ?? 0
  });
}
