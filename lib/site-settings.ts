import type { SupabaseClient } from "@supabase/supabase-js";

/** Anasayfa üst bölümü: moderasyon / site_settings üzerinden seçilir */
export const HOMEPAGE_THEMES = [
  "v2",
  "classic",
  "aurora",
  "sunrise",
  "minimal",
  "slate"
] as const;

export type HomepageTheme = (typeof HOMEPAGE_THEMES)[number];

export const HOMEPAGE_THEME_LABEL: Record<HomepageTheme, string> = {
  v2: "Modern · koyu (amber vurgu)",
  classic: "Klasik · yeşil spotlight",
  aurora: "Aurora · mor–turkuaz gece",
  sunrise: "Gün doğumu · sıcak krem & mercan",
  minimal: "Minimal · beyaz & tipografi",
  slate: "Profesyonel · lacivert & mavi"
};

export const HOMEPAGE_THEME_DEFAULT: HomepageTheme = "v2";

const DEFAULT_THEME = HOMEPAGE_THEME_DEFAULT;

/** Yeni ilan / onay sonrası bitiş: site_settings (7–365 gün) */
export const LISTING_DURATION_MIN_DAYS = 7;
export const LISTING_DURATION_MAX_DAYS = 365;
export const LISTING_DURATION_DEFAULT_DAYS = 30;

const THEME_SET = new Set<string>(HOMEPAGE_THEMES);

export function isHomepageTheme(value: unknown): value is HomepageTheme {
  return typeof value === "string" && THEME_SET.has(value);
}

export function normalizeListingDurationDays(raw: unknown): number {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : Number.NaN;
  if (!Number.isFinite(n)) return LISTING_DURATION_DEFAULT_DAYS;
  return Math.min(
    LISTING_DURATION_MAX_DAYS,
    Math.max(LISTING_DURATION_MIN_DAYS, Math.round(n))
  );
}

type SiteSettingsDurationRow = {
  listing_duration_days?: number | null;
};

/** Anon oturum / vitrin: ilan süresi metni ve expires_at hesabı */
export async function fetchListingDurationDaysPublic(
  sb: SupabaseClient
): Promise<number> {
  const { data, error } = await sb
    .from("site_settings")
    .select("listing_duration_days")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return LISTING_DURATION_DEFAULT_DAYS;
  }
  return normalizeListingDurationDays(
    (data as SiteSettingsDurationRow).listing_duration_days
  );
}

export async function fetchBroadcastNotificationPublic(
  sb: SupabaseClient
): Promise<{ body: string; updatedAt: string | null }> {
  const { data, error } = await sb
    .from("site_settings")
    .select("broadcast_notification_body, broadcast_notification_updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return { body: "", updatedAt: null };
  }
  const row = data as {
    broadcast_notification_body?: string | null;
    broadcast_notification_updated_at?: string | null;
  };
  const body =
    typeof row.broadcast_notification_body === "string"
      ? row.broadcast_notification_body
      : "";
  const u = row.broadcast_notification_updated_at;
  const updatedAt =
    u != null && String(u).trim() ? String(u).trim() : null;
  return { body, updatedAt };
}

export async function getHomepageTheme(
  sb: SupabaseClient
): Promise<HomepageTheme> {
  const { data, error } = await sb
    .from("site_settings")
    .select("homepage_theme")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_THEME;
  }
  const raw = (data as { homepage_theme?: string }).homepage_theme;
  return isHomepageTheme(raw) ? raw : DEFAULT_THEME;
}
