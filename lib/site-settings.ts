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

const THEME_SET = new Set<string>(HOMEPAGE_THEMES);

export function isHomepageTheme(value: unknown): value is HomepageTheme {
  return typeof value === "string" && THEME_SET.has(value);
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
