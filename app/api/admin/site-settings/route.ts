import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  hasAdminPower,
  verifyModerationStaff
} from "@/lib/admin-auth";
import { BROADCAST_NOTIFICATION_MAX_LEN } from "@/lib/broadcast-notification";
import {
  HOMEPAGE_THEME_DEFAULT,
  HOMEPAGE_THEMES,
  isHomepageTheme,
  normalizeListingDurationDays,
  type HomepageTheme
} from "@/lib/site-settings";

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

  const { data, error } = await adminSb
    .from("site_settings")
    .select(
      "homepage_theme, listing_duration_days, broadcast_notification_body, broadcast_notification_updated_at"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rawTheme = (data as { homepage_theme?: string } | null)?.homepage_theme;
  const theme: HomepageTheme = isHomepageTheme(rawTheme)
    ? rawTheme
    : HOMEPAGE_THEME_DEFAULT;

  const durationDays = normalizeListingDurationDays(
    (data as { listing_duration_days?: number | null } | null)
      ?.listing_duration_days
  );

  const row = data as {
    broadcast_notification_body?: string | null;
    broadcast_notification_updated_at?: string | null;
  } | null;

  return Response.json({
    homepage_theme: theme,
    listing_duration_days: durationDays,
    broadcast_notification_body:
      typeof row?.broadcast_notification_body === "string"
        ? row.broadcast_notification_body
        : "",
    broadcast_notification_updated_at:
      row?.broadcast_notification_updated_at != null
        ? String(row.broadcast_notification_updated_at)
        : null
  });
}

export async function PATCH(request: Request) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  let body: {
    homepage_theme?: string;
    listing_duration_days?: number;
    broadcast_notification_body?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Geçersiz gövde." }, { status: 400 });
  }

  let themeUpdate: HomepageTheme | undefined;
  if (body.homepage_theme !== undefined) {
    if (!hasAdminPower(v)) {
      return Response.json(
        { error: "Anasayfa temasını yalnızca tam yönetici değiştirebilir." },
        { status: 403 }
      );
    }
    if (!isHomepageTheme(body.homepage_theme)) {
      return Response.json(
        {
          error: `homepage_theme şunlardan biri olmalı: ${HOMEPAGE_THEMES.join(", ")}.`
        },
        { status: 400 }
      );
    }
    themeUpdate = body.homepage_theme;
  }

  let durationUpdate: number | undefined;
  if (body.listing_duration_days !== undefined) {
    durationUpdate = normalizeListingDurationDays(body.listing_duration_days);
  }

  let broadcastBody: string | undefined;
  if (body.broadcast_notification_body !== undefined) {
    if (!hasAdminPower(v)) {
      return Response.json(
        { error: "Site bildirimi metnini yalnızca tam yönetici değiştirebilir." },
        { status: 403 }
      );
    }
    broadcastBody =
      typeof body.broadcast_notification_body === "string"
        ? body.broadcast_notification_body.trim()
        : "";
    if (broadcastBody.length > BROADCAST_NOTIFICATION_MAX_LEN) {
      return Response.json(
        {
          error: `Duyuru metni en fazla ${BROADCAST_NOTIFICATION_MAX_LEN} karakter olabilir.`
        },
        { status: 400 }
      );
    }
  }

  if (
    themeUpdate === undefined &&
    durationUpdate === undefined &&
    broadcastBody === undefined
  ) {
    return Response.json(
      {
        error:
          "Güncellenecek alan yok (homepage_theme, listing_duration_days veya broadcast_notification_body)."
      },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };
  if (themeUpdate !== undefined) patch.homepage_theme = themeUpdate;
  if (durationUpdate !== undefined) patch.listing_duration_days = durationUpdate;
  if (broadcastBody !== undefined) {
    patch.broadcast_notification_body = broadcastBody;
    patch.broadcast_notification_updated_at = broadcastBody.length
      ? new Date().toISOString()
      : null;
  }

  const { error } = await adminSb
    .from("site_settings")
    .update(patch)
    .eq("id", 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data: row } = await adminSb
    .from("site_settings")
    .select(
      "homepage_theme, listing_duration_days, broadcast_notification_body, broadcast_notification_updated_at"
    )
    .eq("id", 1)
    .maybeSingle();

  const rawTheme = (row as { homepage_theme?: string } | null)?.homepage_theme;
  const themeOut: HomepageTheme = isHomepageTheme(rawTheme)
    ? rawTheme
    : HOMEPAGE_THEME_DEFAULT;

  const durationOut = normalizeListingDurationDays(
    (row as { listing_duration_days?: number | null } | null)?.listing_duration_days
  );

  const br = row as {
    broadcast_notification_body?: string | null;
    broadcast_notification_updated_at?: string | null;
  } | null;

  return Response.json({
    ok: true,
    homepage_theme: themeOut,
    listing_duration_days: durationOut,
    broadcast_notification_body:
      typeof br?.broadcast_notification_body === "string"
        ? br.broadcast_notification_body
        : "",
    broadcast_notification_updated_at:
      br?.broadcast_notification_updated_at != null
        ? String(br.broadcast_notification_updated_at)
        : null
  });
}
