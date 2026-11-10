import { describe, it, expect } from "vitest";
import { nilaiSkor, subtotal, skorMaksimum, persen } from "./scoring";

describe("lib/scoring (AC-Q2)", () => {
  describe("nilaiSkor", () => {
    it("menghitung skor 4 × bobot 3 = 12", () => {
      expect(nilaiSkor(4, 3)).toBe(12);
    });

    it("menghitung skor auditor 3 × bobot 3 = 9", () => {
      expect(nilaiSkor(3, 3)).toBe(9);
    });

    it("mengembalikan null jika skor null atau undefined", () => {
      expect(nilaiSkor(null, 3)).toBe(null);
      expect(nilaiSkor(undefined, 3)).toBe(null);
    });
  });

  describe("subtotal", () => {
    it("mengembalikan 0 untuk daftar nilai kosong", () => {
      expect(subtotal([])).toBe(0);
      expect(subtotal([null, null, undefined])).toBe(0);
    });

    it("menghitung benar untuk daftar terisi sebagian", () => {
      expect(subtotal([12, null, 9, undefined, 15])).toBe(36);
    });

    it("menangani bobot yang berbeda-beda", () => {
      expect(subtotal([1, 2, 3, 4, 5])).toBe(15);
    });
  });

  describe("skorMaksimum", () => {
    it("menghitung 5 × total bobot", () => {
      expect(skorMaksimum([3, 3, 4])).toBe(50);
      // 162 total bobot BMH -> 810
      expect(skorMaksimum([162])).toBe(810);
    });
  });

  describe("persen", () => {
    it("menghitung total 13 dari maks 810 -> 1,60", () => {
      expect(persen(13, 810)).toBe(1.6);
    });

    it("menghitung pembulatan batas (mis. 1 / 800 -> 0,13)", () => {
      // 1 * 10000 / 800 = 12.5 -> Math.round -> 13 / 100 = 0.13
      expect(persen(1, 800)).toBe(0.13);
    });

    it("mengembalikan 0 bila nilai maks = 0 atau negatif", () => {
      expect(persen(10, 0)).toBe(0);
      expect(persen(10, -50)).toBe(0);
      expect(persen(0, 810)).toBe(0);
    });

    it("menghitung nilai 100% saat total = maks", () => {
      expect(persen(810, 810)).toBe(100);
    });
  });
});
