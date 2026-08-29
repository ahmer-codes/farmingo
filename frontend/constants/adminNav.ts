export interface AdminNavItem {
  to: string;
  label: string;
  title: string;
  icon?: string;
  /** Show in compact mobile bottom bar */
  mobilePrimary?: boolean;
  badgeKey?: "unreadChats";
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: "/admin",
    label: "Dashboard",
    title: "Analytics dashboard",
    icon: "dashboard",
    mobilePrimary: true,
  },
  {
    to: "/admin/users",
    label: "Users",
    title: "Users",
    icon: "profile",
    mobilePrimary: true,
  },
  {
    to: "/admin/chats",
    label: "Support",
    title: "Support inbox",
    icon: "bell",
    mobilePrimary: true,
    badgeKey: "unreadChats",
  },
  {
    to: "/admin/settings",
    label: "Settings",
    title: "Admin settings",
    icon: "settings",
  },
];

export function resolveAdminPageTitle(path: string): string {
  if (path.startsWith("/admin/users/") && path !== "/admin/users")
    return "User profile";
  if (path.startsWith("/admin/chats")) return "Support inbox";

  const exact = ADMIN_NAV_ITEMS.find((item) => item.to === path);
  if (exact) return exact.title;

  const nested = ADMIN_NAV_ITEMS.find(
    (item) => item.to !== "/admin" && path.startsWith(`${item.to}/`),
  );
  return nested?.title || "Administration";
}

export function isAdminNavActive(path: string, currentPath: string): boolean {
  if (path === "/admin") return currentPath === "/admin";
  return currentPath === path || currentPath.startsWith(`${path}/`);
}
