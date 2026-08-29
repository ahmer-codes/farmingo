import type { NavItem } from "~/types";

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const primaryNav: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: "dashboard" },
  { label: "Farm", to: "/farm", icon: "farm" },
  { label: "Crops", to: "/crops", icon: "crops" },
  {
    label: "Crop Health Assessment",
    to: "/disease-detection",
    icon: "disease",
  },
  { label: "Tasks", to: "/tasks", icon: "tasks" },
  { label: "Weather", to: "/weather", icon: "weather" },
  { label: "Yield Analytics", to: "/yield", icon: "yield" },
];

const secondaryNav: NavItem[] = [
  { label: "Notifications", to: "/notifications", icon: "bell" },
  { label: "Profile", to: "/profile", icon: "profile" },
  { label: "Settings", to: "/settings", icon: "settings" },
];

/** Compact mobile bottom bar, highest-frequency destinations */
const mobileNav: NavItem[] = [
  { label: "Home", to: "/dashboard", icon: "dashboard" },
  { label: "Crops", to: "/crops", icon: "crops" },
  { label: "Tasks", to: "/tasks", icon: "tasks" },
  { label: "Weather", to: "/weather", icon: "weather" },
  { label: "More", to: "/profile", icon: "profile" },
];

export function useNavigation() {
  return {
    primaryNav,
    secondaryNav,
    mobileNav,
    navGroups: [
      { label: "Main", items: primaryNav },
      { label: "Account", items: secondaryNav },
    ] satisfies NavGroup[],
  };
}
