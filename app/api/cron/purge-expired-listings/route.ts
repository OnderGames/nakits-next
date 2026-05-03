import {
  getServiceRoleClient,
  getServiceRoleMissingMessage
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Süresi dolmuş pending/active ilanları ve depo klasörünü siler (satıldı / reddedilen hariç). */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const nowIso = new Date().toISOString();

  const { data: rows, error: qErr } = await adminSb
    .from("listings")
    .select("id, seller_id")
    .in("status", ["pending", "active"])
    .lt("expires_at", nowIso);

  if (qErr) {
    return Response.json({ error: qErr.message }, { status: 500 });
  }

  const targets = rows ?? [];
  let deleted = 0;
  for (const row of targets) {
    const id = row.id as string;
    const sellerId = row.seller_id as string;
    const folder = `${sellerId}/${id}`;
    const { data: files } = await adminSb.storage
      .from("listing-images")
      .list(folder);
    if (files?.length) {
      const paths = files.map((f) => `${folder}/${f.name}`);
      await adminSb.storage.from("listing-images").remove(paths);
    }
    const { error: delErr } = await adminSb.from("listings").delete().eq("id", id);
    if (!delErr) deleted += 1;
  }

  return Response.json({
    ok: true,
    scanned: targets.length,
    deleted
  });
}
