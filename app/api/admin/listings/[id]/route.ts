import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  verifyAdminFromRequest
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  status?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const v = await verifyAdminFromRequest(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const { id } = await context.params;
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const status = body.status;
  if (status !== "active" && status !== "rejected") {
    return Response.json(
      { error: "status yalnızca active veya rejected olabilir." },
      { status: 400 }
    );
  }

  const { data, error } = await adminSb
    .from("listings")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "İlan bulunamadı." }, { status: 404 });
  }

  return Response.json({ ok: true, id: data.id });
}
