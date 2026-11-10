import type { Role } from "@/types/audit";
import {
  LayoutDashboardIcon,
  ClipboardCheckIcon,
  Building2Icon,
  ClipboardListIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

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
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/nilai-audit") ||
    pathname.startsWith("/ringkasan")
  ) {
    return role === "admin";
  }

  // Rute khusus user (cabang)
  if (
    pathname.startsWith("/dashboard/user") ||
    pathname.startsWith("/audit")
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
        title: "Penilaian Cabang",
        url: "/nilai-audit",
        icon: ClipboardCheckIcon,
      },
      {
        title: "Ringkasan Nasional",
        url: "/ringkasan",
        icon: Building2Icon,
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
  ];
}
