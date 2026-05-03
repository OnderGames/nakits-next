import { createClient } from "@supabase/supabase-js";
import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  verifyAdminFromRequest
} from "@/lib/admin-auth";
import {
  HOMEPAGE_THEME_DEFAULT,
  HOMEPAGE_THEMES,
  isHomepageTheme,
  type HomepageTheme
} from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const v = await verifyAdminFromRequest(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return Response.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 }
    );
  }

  const sb = createClient(url, anon);
  const { data, error } = await sb
    .from("site_settings")
    .select("homepage_theme")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const raw = (data as { homepage_theme?: string } | null)?.homepage_theme;
  const theme: HomepageTheme = isHomepageTheme(raw)
    ? raw
    : HOMEPAGE_THEME_DEFAULT;

  return Response.json({ homepage_theme: theme });
}

export async function PATCH(request: Request) {
  const v = await verifyAdminFromRequest(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  let body: { homepage_theme?: string };
  try {
    body = (await request.json()) as { homepage_theme?: string };
  } catch {
    return Response.json({ error: "Geçersiz gövde." }, { status: 400 });
  }

  const t = body.homepage_theme;
  if (!isHomepageTheme(t)) {
    return Response.json(
      {
        error: `homepage_theme şunlardan biri olmalı: ${HOMEPAGE_THEMES.join(", ")}.`
      },
      { status: 400 }
    );
  }

  const { error } = await adminSb.from("site_settings").upsert(
    {
      id: 1,
      homepage_theme: t,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, homepage_theme: t });
}
