import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  verifyModerationStaff
} from "@/lib/admin-auth";
import { listingExpiresAtIsoFromNow } from "@/lib/listing-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  status?: string;
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

  const status = body.status;
  if (status !== "active" && status !== "rejected") {
    return Response.json(
      { error: "status yalnızca active veya rejected olabilir." },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = { status };
  if (status === "active") {
    patch.expires_at = listingExpiresAtIsoFromNow();
  }

  const { data, error } = await adminSb
    .from("listings")
    .update(patch)
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

/** Yönetici: ilanı ve depodaki görselleri siler (listing_images CASCADE, storage elle). */
export async function DELETE(
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

  const { data: listing, error: fetchErr } = await adminSb
    .from("listings")
    .select("id, seller_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return Response.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!listing?.id) {
    return Response.json({ error: "İlan bulunamadı." }, { status: 404 });
  }

  const sellerId = listing.seller_id as string;
  const folder = `${sellerId}/${id}`;
  const { data: files, error: listErr } = await adminSb.storage
    .from("listing-images")
    .list(folder);

  if (!listErr && files?.length) {
    const paths = files.map((f) => `${folder}/${f.name}`);
    await adminSb.storage.from("listing-images").remove(paths);
  }

  const { error: delErr } = await adminSb.from("listings").delete().eq("id", id);

  if (delErr) {
    return Response.json({ error: delErr.message }, { status: 500 });
  }

  return Response.json({ ok: true, id });
}
