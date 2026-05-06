import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  hasAdminPower,
  verifyModerationStaff
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** DB + ilan formlarıyla uyum: küçük harf, rakam, alt çizgi, tire; 2–128 karakter */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9_-]){1,127}$/;

function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

export async function GET(request: Request) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const { data: cats, error: catErr } = await adminSb
    .from("categories")
    .select("id, slug, name, created_at")
    .order("name", { ascending: true });

  if (catErr) {
    return Response.json({ error: catErr.message }, { status: 500 });
  }

  const { data: listingRows, error: listErr } = await adminSb
    .from("listings")
    .select("category_id");

  if (listErr) {
    return Response.json({ error: listErr.message }, { status: 500 });
  }

  const countMap = new Map<string, number>();
  for (const row of listingRows ?? []) {
    const cid = row.category_id as string;
    countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
  }

  const categories = (cats ?? []).map((c) => ({
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
    createdAt: c.created_at as string,
    listingCount: countMap.get(c.id as string) ?? 0
  }));

  return Response.json({ categories });
}

export async function POST(request: Request) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }
  if (!hasAdminPower(v)) {
    return Response.json(
      { error: "Kategori eklemek için tam yönetici yetkisi gerekir." },
      { status: 403 }
    );
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  let body: { slug?: string; name?: string };
  try {
    body = (await request.json()) as { slug?: string; name?: string };
  } catch {
    return Response.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = normalizeSlug(typeof body.slug === "string" ? body.slug : "");

  if (!name.length || name.length > 500) {
    return Response.json(
      { error: "İsim 1–500 karakter olmalıdır." },
      { status: 400 }
    );
  }
  if (!slug.length || !SLUG_RE.test(slug)) {
    return Response.json(
      {
        error:
          "Slug 2–128 karakter olmalı; yalnızca küçük harf, rakam, _ ve - kullanın (örn. elektronik_telefon)."
      },
      { status: 400 }
    );
  }

  const { data, error } = await adminSb
    .from("categories")
    .insert({ slug, name })
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

  return Response.json({
    category: data
      ? {
          id: data.id as string,
          slug: data.slug as string,
          name: data.name as string,
          createdAt: data.created_at as string,
          listingCount: 0
        }
      : null
  });
}
