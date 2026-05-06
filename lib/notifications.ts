import type { SupabaseClient } from "@supabase/supabase-js";

export type AppNotificationRow = {
  id: string;
  body: string;
  listingId: string | null;
  readAt: string | null;
  createdAt: string;
  type: string;
};

/** İstemci bildirim listesinin yenilenmesini tetiklemek için */
export function notifyNotificationsRefresh(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nakits-notifications"));
  }
}

export async function fetchMyNotifications(
  sb: SupabaseClient,
  profileId: string,
  limit = 40
): Promise<AppNotificationRow[]> {
  const { data, error } = await sb
    .from("notifications")
    .select("id, body, listing_id, read_at, created_at, type")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    body: String(r.body),
    listingId:
      r.listing_id != null ? String(r.listing_id) : null,
    readAt: r.read_at != null ? String(r.read_at) : null,
    createdAt: String(r.created_at),
    type: String(r.type ?? "")
  }));
}

export async function countMyUnreadNotifications(
  sb: SupabaseClient,
  profileId: string
): Promise<number> {
  const { count, error } = await sb
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .is("read_at", null);

  if (error) return 0;
  return typeof count === "number" ? count : 0;
}

export async function markNotificationRead(
  sb: SupabaseClient,
  notificationId: string
): Promise<{ error?: string }> {
  const iso = new Date().toISOString();
  const { error } = await sb
    .from("notifications")
    .update({ read_at: iso })
    .eq("id", notificationId)
    .is("read_at", null);

  if (error) return { error: error.message };
  return {};
}

export async function markAllMyNotificationsRead(
  sb: SupabaseClient,
  profileId: string
): Promise<{ error?: string }> {
  const iso = new Date().toISOString();
  const { error } = await sb
    .from("notifications")
    .update({ read_at: iso })
    .eq("profile_id", profileId)
    .is("read_at", null);

  if (error) return { error: error.message };
  return {};
}

export async function deleteMyNotification(
  sb: SupabaseClient,
  profileId: string,
  notificationId: string
): Promise<{ error?: string }> {
  const { error } = await sb
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("profile_id", profileId);

  if (error) return { error: error.message };
  return {};
}
