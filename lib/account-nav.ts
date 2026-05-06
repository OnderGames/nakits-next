export type AccountNavIconName =
  | "moderation"
  | "listings"
  | "heart"
  | "messages"
  | "user";

export type AccountNavItemDef = {
  href: string;
  label: string;
  icon: AccountNavIconName;
};

/** Yönetim paneli (/admin/moderasyon) + üye bağlantıları */
export const ADMIN_ACCOUNT_NAV_ITEMS: AccountNavItemDef[] = [
  { href: "/admin/moderasyon", label: "Yönetim paneli", icon: "moderation" }
];

export const MEMBER_ACCOUNT_NAV_ITEMS: AccountNavItemDef[] = [
  { href: "/ilanlarim", label: "İlan yönetimi", icon: "listings" },
  { href: "/favoriler", label: "Favoriler", icon: "heart" },
  { href: "/mesajlar", label: "Mesajlarım", icon: "messages" },
  { href: "/profile", label: "Profil yönetimi", icon: "user" }
];

export function mergeAccountNavItems(
  hasModerationAccess: boolean
): AccountNavItemDef[] {
  return hasModerationAccess
    ? [...ADMIN_ACCOUNT_NAV_ITEMS, ...MEMBER_ACCOUNT_NAV_ITEMS]
    : [...MEMBER_ACCOUNT_NAV_ITEMS];
}

export function accountNavItemActive(pathname: string, href: string): boolean {
  if (href === "/profile") return pathname === "/profile";
  if (href.startsWith("/admin")) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
