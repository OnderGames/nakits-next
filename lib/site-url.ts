/**
 * Canlı domain ile e-posta onay linklerinin localhost'a gitmesini önler.
 * Vercel'de mutlaka ayarla: NEXT_PUBLIC_SITE_URL=https://www.nakits.com
 */
export function getAuthRedirectBase(): string {
  if (typeof window === "undefined") return "";
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return window.location.origin;
}
