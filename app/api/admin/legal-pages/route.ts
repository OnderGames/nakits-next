import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  verifyModerationStaff
} from "@/lib/admin-auth";
import {
  LEGAL_PAGE_LABELS,
  LEGAL_PAGE_SLUGS,
  type LegalPageSlug
} from "@/lib/legal-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const { data: rows, error } = await adminSb
    .from("site_legal_pages")
    .select(
      "slug,page_title,meta_description,body_html,updated_at"
    );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const bySlug = new Map<string, Record<string, unknown>>();
  for (const r of rows ?? []) {
    bySlug.set(r.slug as string, r as Record<string, unknown>);
  }

  const pages = LEGAL_PAGE_SLUGS.map((slug: LegalPageSlug) => {
    const row = bySlug.get(slug);
    const body_html =
      typeof row?.body_html === "string" ? row.body_html : "";
    const hasCustom = Boolean(body_html.trim());
    return {
      slug,
      label: LEGAL_PAGE_LABELS[slug],
      page_title: typeof row?.page_title === "string" ? row.page_title : "",
      meta_description:
        typeof row?.meta_description === "string" ? row.meta_description : "",
      body_html,
      updated_at: (row?.updated_at as string | undefined) ?? null,
      uses_app_default: !hasCustom
    };
  });

  return Response.json({ pages });
}
