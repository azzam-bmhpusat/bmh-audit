import type { Role } from "@/types/audit";
import {
  LayoutDashboardIcon,
  ClipboardCheckIcon,
  Building2Icon,
  ClipboardListIcon,
  UsersIcon,
  BuildingIcon,
  AwardIcon,
  FileCheckIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const MANAGEMENT_NAV_URLS = [
  "/manajemen-perwakilan",
  "/manajemen-user",
  "/pengaturan",
] as const;

/**
 * Menentukan rute dashboard utama berdasarkan role pengguna.
 */
export function getRoleHome(role: Role): string {
  return role === "admin" ? "/dashboard/admin" : "/dashboard/user";
}

/**
 * Memeriksa apakah suatu role berhak mengakses path tertentu.
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  // Rute umum yang dapat diakses oleh kedua role
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return true;
  }

  // Rute khusus admin
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/nilai-audit") ||
    pathname.startsWith("/ringkasan") ||
    pathname.startsWith("/manajemen-user") ||
    pathname.startsWith("/manajemen-perwakilan") ||
    pathname.startsWith("/pengaturan")
  ) {
    return role === "admin";
  }

  // Rute khusus user (cabang)
  if (
    pathname.startsWith("/dashboard/user") ||
    pathname.startsWith("/audit") ||
    pathname.startsWith("/penilaian")
  ) {
    return role === "user";
  }

  return true;
}

/**
 * Mengembalikan daftar menu navigasi sidebar sesuai role pengguna.
 */
export function getNavItemsForRole(role: Role): NavItem[] {
  if (role === "admin") {
    return [
      {
        title: "Dashboard",
        url: "/dashboard/admin",
        icon: LayoutDashboardIcon,
      },
      {
        title: "Review Penilaian",
        url: "/admin/penilaian",
        icon: FileCheckIcon,
      },
      {
        title: "Penilaian Perwakilan",
        url: "/nilai-audit",
        icon: ClipboardCheckIcon,
      },
      {
        title: "Ringkasan Nasional",
        url: "/ringkasan",
        icon: Building2Icon,
      },
      {
        title: "Manajemen Perwakilan",
        url: "/manajemen-perwakilan",
        icon: BuildingIcon,
      },
      {
        title: "Manajemen User",
        url: "/manajemen-user",
        icon: UsersIcon,
      },
      {
        title: "Pengaturan",
        url: "/pengaturan",
        icon: SettingsIcon,
      },
    ];
  }

  return [
    {
      title: "Dashboard",
      url: "/dashboard/user",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Instrumen Audit",
      url: "/audit",
      icon: ClipboardListIcon,
    },
    {
      title: "Preview Penilaian",
      url: "/penilaian",
      icon: AwardIcon,
    },
  ];
}

/**
 * Mengembalikan grup menu navigasi sidebar sesuai role pengguna.
 * Memisahkan Menu Utama dari Manajemen & Pengaturan untuk role admin.
 */
export function getNavGroupsForRole(role: Role): NavGroup[] {
  const allItems = getNavItemsForRole(role);
  if (role === "admin") {
    const mainItems = allItems.filter(
      (item) => !(MANAGEMENT_NAV_URLS as readonly string[]).includes(item.url)
    );
    const managementItems = allItems.filter((item) =>
      (MANAGEMENT_NAV_URLS as readonly string[]).includes(item.url)
    );

    return [
      {
        label: "Menu Utama",
        items: mainItems,
      },
      {
        label: "Manajemen & Pengaturan",
        items: managementItems,
      },
    ];
  }

  return [
    {
      label: "Menu Utama",
      items: allItems,
    },
  ];
}

