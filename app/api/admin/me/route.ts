import { verifyAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const v = await verifyAdminFromRequest(request);
  return Response.json({ admin: v.ok });
}
