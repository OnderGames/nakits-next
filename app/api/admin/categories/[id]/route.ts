import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  hasAdminPower,
  verifyModerationStaff
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9_-]){1,127}$/;

function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }
  if (!hasAdminPower(v)) {
    return Response.json(
      { error: "Kategori düzenlemek için tam yönetici yetkisi gerekir." },
      { status: 403 }
    );
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const { id } = await context.params;

  let body: { slug?: string; name?: string };
  try {
    body = (await request.json()) as { slug?: string; name?: string };
  } catch {
    return Response.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const patch: Record<string, string> = {};
  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name.length || name.length > 500) {
      return Response.json(
        { error: "İsim 1–500 karakter olmalıdır." },
        { status: 400 }
      );
    }
    patch.name = name;
  }
  if (body.slug !== undefined) {
    const slug = normalizeSlug(typeof body.slug === "string" ? body.slug : "");
    if (!slug.length || !SLUG_RE.test(slug)) {
      return Response.json(
        {
          error:
            "Slug 2–128 karakter olmalı; yalnızca küçük harf, rakam, _ ve - kullanın."
        },
        { status: 400 }
      );
    }
    patch.slug = slug;
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  const { data, error } = await adminSb
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select("id, slug, name, created_at")
    .maybeSingle();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return Response.json(
        { error: "Bu slug veya isim zaten kullanılıyor." },
        { status: 409 }
      );
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "Kategori bulunamadı." }, { status: 404 });
  }

  return Response.json({
    category: {
      id: data.id as string,
      slug: data.slug as string,
      name: data.name as string,
      createdAt: data.created_at as string
    }
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }
  if (!hasAdminPower(v)) {
    return Response.json(
      { error: "Kategori silmek için tam yönetici yetkisi gerekir." },
      { status: 403 }
    );
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const { id } = await context.params;

  const { count, error: cntErr } = await adminSb
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (cntErr) {
    return Response.json({ error: cntErr.message }, { status: 500 });
  }
  if (typeof count === "number" && count > 0) {
    return Response.json(
      {
        error: `Bu kategoriye bağlı ${count} ilan var. Önce ilanları başka kategoriye taşıyın veya silin.`
      },
      { status: 409 }
    );
  }

  const { error: delErr } = await adminSb.from("categories").delete().eq("id", id);

  if (delErr) {
    return Response.json({ error: delErr.message }, { status: 500 });
  }

  return Response.json({ ok: true, id });
}
