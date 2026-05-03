import type { SupabaseClient } from "@supabase/supabase-js";

export type HomepageTheme = "classic" | "v2";

const DEFAULT_THEME: HomepageTheme = "v2";

/** Anasayfa üst bölümü: moderasyon / site_settings üzerinden seçilir */
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
  return raw === "classic" || raw === "v2" ? raw : DEFAULT_THEME;
}
