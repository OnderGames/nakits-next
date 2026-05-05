import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LISTING_DURATION_DEFAULT_DAYS,
  normalizeListingDurationDays
} from "@/lib/site-settings";

/** service_role ile site ayarı (API route) */
export async function fetchListingDurationDaysForService(
  adminSb: SupabaseClient
): Promise<number> {
  const { data, error } = await adminSb
    .from("site_settings")
    .select("listing_duration_days")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return LISTING_DURATION_DEFAULT_DAYS;
  }
  const raw = (data as { listing_duration_days?: number | null })
    .listing_duration_days;
  return normalizeListingDurationDays(raw);
}
