import { hasAdminPower, verifyModerationStaff } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({
      moderation: false,
      power: false,
      role: null as string | null,
      envAdmin: false,
      admin: false
    });
  }
  const power = hasAdminPower(v);
  return Response.json({
    moderation: true,
    power,
    role: v.profileRole,
    envAdmin: v.envAdmin,
    /** @deprecated Yerine moderation + power kullanın */
    admin: power
  });
}
