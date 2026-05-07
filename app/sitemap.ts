import type { MetadataRoute } from "next";
import {
  fetchPublicActiveListingIdsForSitemap
} from "@/lib/listings-data";
import { getSiteOrigin } from "@/lib/site-url";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteOrigin();
  const lastmod = new Date();

  const staticPaths: MetadataRoute.Sitemap = [
    "",
    "/listings",
    "/add-listing",
    "/login",
    "/register",
    "/yasakli-urunler",
    "/gizlilik-politikasi",
    "/uyelik-sozlesmesi",
    "/privacy-policy",
    "/terms-of-service"
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: lastmod,
    changeFrequency: path === "" || path === "/listings" ? "hourly" : "weekly",
    priority: path === "" ? 1 : path === "/listings" ? 0.9 : 0.5
  }));

  if (!hasSupabaseConfig || !supabase) return staticPaths;

  const rows = await fetchPublicActiveListingIdsForSitemap(supabase);
  const listingUrls: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${base}/listings/${row.id}`,
    lastModified: new Date(row.lastModified),
    changeFrequency: "daily",
    priority: 0.7
  }));

  return [...staticPaths, ...listingUrls];
}
