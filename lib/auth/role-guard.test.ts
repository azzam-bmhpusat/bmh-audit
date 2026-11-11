import { describe, it, expect } from "vitest";
import {
  getRoleHome,
  canAccessRoute,
  getNavItemsForRole,
  getNavGroupsForRole,
} from "./role-guard";

describe("role-guard", () => {
  describe("getRoleHome", () => {
    it("mengarahkan role admin ke /dashboard/admin", () => {
      expect(getRoleHome("admin")).toBe("/dashboard/admin");
    });

    it("mengarahkan role user ke /dashboard/user", () => {
      expect(getRoleHome("user")).toBe("/dashboard/user");
    });
  });

  describe("canAccessRoute", () => {
    it("mengizinkan admin mengakses rute-rute admin", () => {
      expect(canAccessRoute("admin", "/dashboard/admin")).toBe(true);
      expect(canAccessRoute("admin", "/admin/penilaian")).toBe(true);
      expect(canAccessRoute("admin", "/admin/penilaian/1")).toBe(true);
      expect(canAccessRoute("admin", "/nilai-audit")).toBe(true);
      expect(canAccessRoute("admin", "/nilai-audit?cabang=1")).toBe(true);
      expect(canAccessRoute("admin", "/ringkasan")).toBe(true);
      expect(canAccessRoute("admin", "/manajemen-user")).toBe(true);
      expect(canAccessRoute("admin", "/manajemen-perwakilan")).toBe(true);
      expect(canAccessRoute("admin", "/pengaturan")).toBe(true);
      expect(canAccessRoute("admin", "/dashboard")).toBe(true);
    });

    it("menolak admin mengakses rute-rute khusus user", () => {
      expect(canAccessRoute("admin", "/dashboard/user")).toBe(false);
      expect(canAccessRoute("admin", "/audit")).toBe(false);
      expect(canAccessRoute("admin", "/penilaian")).toBe(false);
    });

    it("mengizinkan user mengakses rute-rute user", () => {
      expect(canAccessRoute("user", "/dashboard/user")).toBe(true);
      expect(canAccessRoute("user", "/audit")).toBe(true);
      expect(canAccessRoute("user", "/penilaian")).toBe(true);
      expect(canAccessRoute("user", "/dashboard")).toBe(true);
    });

    it("menolak user mengakses rute-rute khusus admin", () => {
      expect(canAccessRoute("user", "/admin/penilaian")).toBe(false);
      expect(canAccessRoute("user", "/admin/penilaian/1")).toBe(false);
      expect(canAccessRoute("user", "/dashboard/admin")).toBe(false);
      expect(canAccessRoute("user", "/nilai-audit")).toBe(false);
      expect(canAccessRoute("user", "/ringkasan")).toBe(false);
      expect(canAccessRoute("user", "/manajemen-user")).toBe(false);
      expect(canAccessRoute("user", "/manajemen-perwakilan")).toBe(false);
      expect(canAccessRoute("user", "/pengaturan")).toBe(false);
    });
  });

  describe("getNavItemsForRole", () => {
    it("memberikan menu khusus admin dengan url yang tepat", () => {
      const items = getNavItemsForRole("admin");
      expect(items).toHaveLength(7);
      expect(items.map((i) => i.url)).toEqual([
        "/dashboard/admin",
        "/admin/penilaian",
        "/nilai-audit",
        "/ringkasan",
        "/manajemen-perwakilan",
        "/manajemen-user",
        "/pengaturan",
      ]);
    });

    it("memberikan menu khusus user dengan url yang tepat", () => {
      const items = getNavItemsForRole("user");
      expect(items).toHaveLength(3);
      expect(items.map((i) => i.url)).toEqual([
        "/dashboard/user",
        "/audit",
        "/penilaian",
      ]);
    });
  });

  describe("getNavGroupsForRole", () => {
    it("memisahkan menu utama dan manajemen/pengaturan untuk admin", () => {
      const groups = getNavGroupsForRole("admin");
      expect(groups).toHaveLength(2);

      const mainGroup = groups[0];
      expect(mainGroup.label).toBe("Menu Utama");
      expect(mainGroup.items.map((i) => i.url)).toEqual([
        "/dashboard/admin",
        "/admin/penilaian",
        "/nilai-audit",
        "/ringkasan",
      ]);

      const managementGroup = groups[1];
      expect(managementGroup.label).toBe("Manajemen & Pengaturan");
      expect(managementGroup.items.map((i) => i.url)).toEqual([
        "/manajemen-perwakilan",
        "/manajemen-user",
        "/pengaturan",
      ]);
    });

    it("menampilkan satu grup menu utama untuk user", () => {
      const groups = getNavGroupsForRole("user");
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe("Menu Utama");
      expect(groups[0].items.map((i) => i.url)).toEqual([
        "/dashboard/user",
        "/audit",
        "/penilaian",
      ]);
    });
  });
});
