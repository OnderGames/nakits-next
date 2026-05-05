import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  verifyModerationStaff
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  status?: "reviewed" | "dismissed";
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const v = await verifyModerationStaff(request);
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

  const nextStatus = body.status;
  if (nextStatus !== "reviewed" && nextStatus !== "dismissed") {
    return Response.json(
      { error: "status yalnızca reviewed veya dismissed olabilir." },
      { status: 400 }
    );
  }

  const patch = {
    status: nextStatus,
    reviewed_at: new Date().toISOString()
  };

  const { data, error } = await adminSb
    .from("listing_reports")
    .update(patch)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data?.id) {
    return Response.json({ error: "Şikayet bulunamadı." }, { status: 404 });
  }

  return Response.json({ ok: true, id: data.id });
}
