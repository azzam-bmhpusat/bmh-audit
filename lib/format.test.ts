import { describe, it, expect } from "vitest";
import { formatAngka, formatPersen, formatRasio } from "./format";

describe("lib/format", () => {
  describe("formatAngka", () => {
    it("memformat angka bulat", () => {
      expect(formatAngka(1000)).toBe("1.000");
      expect(formatAngka(810)).toBe("810");
      expect(formatAngka(0)).toBe("0");
    });

    it("mengembalikan em-dash untuk null / undefined", () => {
      expect(formatAngka(null)).toBe("—");
      expect(formatAngka(undefined)).toBe("—");
    });
  });

  describe("formatPersen", () => {
    it("memformat persentase 2 desimal dengan koma", () => {
      expect(formatPersen(1.6)).toBe("1,60%");
      expect(formatPersen(0.13)).toBe("0,13%");
      expect(formatPersen(100)).toBe("100,00%");
      expect(formatPersen(0)).toBe("0,00%");
    });

    it("menangani null atau undefined", () => {
      expect(formatPersen(null)).toBe("0,00%");
      expect(formatPersen(undefined)).toBe("0,00%");
    });
  });

  describe("formatRasio", () => {
    it("memformat rasio dengan persen otomatis", () => {
      expect(formatRasio(13, 810)).toBe("13 / 810 (1,60%)");
      expect(formatRasio(810, 810)).toBe("810 / 810 (100,00%)");
      expect(formatRasio(0, 810)).toBe("0 / 810 (0,00%)");
    });

    it("menerima persen eksplisit bila disediakan", () => {
      expect(formatRasio(13, 810, 1.6)).toBe("13 / 810 (1,60%)");
    });
  });
});
