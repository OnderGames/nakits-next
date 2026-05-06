import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  hasAdminPower,
  verifyModerationStaff
} from "@/lib/admin-auth";
import { LEGAL_PAGE_LABELS, isLegalPageSlug, type LegalPageSlug } from "@/lib/legal-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 160_000;
const MAX_TITLE = 320;
const MAX_META = 600;

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const { slug: raw } = await context.params;
  if (!isLegalPageSlug(raw)) {
    return Response.json({ error: "Geçersiz sayfa." }, { status: 400 });
  }
  const slug = raw as LegalPageSlug;

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const { data: row, error } = await adminSb
    .from("site_legal_pages")
    .select("slug,page_title,meta_description,body_html,updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    slug,
    label: LEGAL_PAGE_LABELS[slug],
    page_title: typeof row?.page_title === "string" ? row.page_title : "",
    meta_description:
      typeof row?.meta_description === "string" ? row.meta_description : "",
    body_html: typeof row?.body_html === "string" ? row.body_html : "",
    updated_at: row?.updated_at ?? null,
    uses_app_default: !String(row?.body_html ?? "").trim()
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }
  if (!hasAdminPower(v)) {
    return Response.json(
      { error: "Metin sayfalarını yalnızca tam yönetici güncelleyebilir." },
      { status: 403 }
    );
  }

  const { slug: raw } = await context.params;
  if (!isLegalPageSlug(raw)) {
    return Response.json({ error: "Geçersiz sayfa." }, { status: 400 });
  }
  const slug = raw as LegalPageSlug;

  let body: {
    page_title?: string;
    meta_description?: string;
    body_html?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Geçersiz gövde." }, { status: 400 });
  }

  const page_title =
    typeof body.page_title === "string" ? body.page_title.trim() : "";
  const meta_description =
    typeof body.meta_description === "string" ? body.meta_description.trim() : "";
  const body_html =
    typeof body.body_html === "string" ? body.body_html : "";

  if (body_html.length > MAX_BODY) {
    return Response.json(
      { error: `Metin çok uzun (en fazla ${MAX_BODY} karakter).` },
      { status: 400 }
    );
  }
  if (page_title.length > MAX_TITLE) {
    return Response.json({ error: "Sayfa başlığı çok uzun." }, { status: 400 });
  }
  if (meta_description.length > MAX_META) {
    return Response.json({ error: "Meta açıklama çok uzun." }, { status: 400 });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const trimmedHtml = body_html.trim();

  if (!trimmedHtml) {
    const { error: delErr } = await adminSb
      .from("site_legal_pages")
      .delete()
      .eq("slug", slug);
    if (delErr) {
      return Response.json({ error: delErr.message }, { status: 500 });
    }
    return Response.json({
      ok: true,
      slug,
      uses_app_default: true,
      page_title: "",
      meta_description: "",
      body_html: "",
      updated_at: null
    });
  }

  if (!page_title.length) {
    return Response.json(
      { error: "Özelleştirilmiş içerik için sayfa başlığı (tarayıcı sekmesi) zorunludur." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { error: upErr } = await adminSb.from("site_legal_pages").upsert(
    {
      slug,
      page_title,
      meta_description,
      body_html: trimmedHtml,
      updated_at: now
    },
    { onConflict: "slug" }
  );

  if (upErr) {
    return Response.json({ error: upErr.message }, { status: 500 });
  }

  const { data: row } = await adminSb
    .from("site_legal_pages")
    .select("slug,page_title,meta_description,body_html,updated_at")
    .eq("slug", slug)
    .maybeSingle();

  return Response.json({
    ok: true,
    slug,
    uses_app_default: false,
    page_title: row?.page_title ?? page_title,
    meta_description: row?.meta_description ?? meta_description,
    body_html: row?.body_html ?? trimmedHtml,
    updated_at: row?.updated_at ?? now
  });
}
