/** Giriş yapan kullanıcıda site duyurusunun okundu sayılması (tarayıcı). */
const LS_KEY = "nakits_broadcast_seen_at";
const LS_DISMISSED_KEY = "nakits_broadcast_dismissed_at";

/** API ve yönetim formu ile aynı üst sınır */
export const BROADCAST_NOTIFICATION_MAX_LEN = 2000;

export function getBroadcastNotificationSeenAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(LS_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function setBroadcastNotificationSeenAt(updatedAtIso: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, updatedAtIso);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getBroadcastNotificationDismissedAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(LS_DISMISSED_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function setBroadcastNotificationDismissedAt(updatedAtIso: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_DISMISSED_KEY, updatedAtIso);
  } catch {
    /* ignore quota / private mode */
  }
}

export function isBroadcastNotificationDismissed(
  updatedAt: string | null | undefined
): boolean {
  const t = typeof updatedAt === "string" ? updatedAt.trim() : "";
  if (!t) return false;
  const dismissed = getBroadcastNotificationDismissedAt();
  if (!dismissed) return false;
  return dismissed >= t;
}

export function isBroadcastNotificationUnread(
  body: string,
  updatedAt: string | null | undefined
): boolean {
  const t = typeof updatedAt === "string" ? updatedAt.trim() : "";
  const b = typeof body === "string" ? body.trim() : "";
  if (!b || !t) return false;
  const seen = getBroadcastNotificationSeenAt();
  if (!seen) return true;
  return seen < t;
}

export const BROADCAST_NOTIFICATION_ID_PREFIX = "broadcast:";

export function isSyntheticBroadcastNotificationId(id: string): boolean {
  return id.startsWith(BROADCAST_NOTIFICATION_ID_PREFIX);
}

export function parseBroadcastNotificationTimestamp(id: string): string | null {
  if (!isSyntheticBroadcastNotificationId(id)) return null;
  return id.slice(BROADCAST_NOTIFICATION_ID_PREFIX.length) || null;
}
