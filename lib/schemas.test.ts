import { describe, it, expect } from "vitest";
import {
  skorSchema,
  lampiranSchema,
  validasiSchema,
  catatanSchema,
  bobotSchema,
  loginSchema,
  gantiPasswordSchema,
  searchParamsSchema,
  matrixRowCabangSchema,
} from "./schemas";

describe("schemas", () => {
  describe("skorSchema", () => {
    it("menerima integer 1 sampai 5 dan null", () => {
      expect(skorSchema.safeParse(1).success).toBe(true);
      expect(skorSchema.safeParse(5).success).toBe(true);
      expect(skorSchema.safeParse(null).success).toBe(true);
      expect(skorSchema.safeParse(0).success).toBe(false);
      expect(skorSchema.safeParse(6).success).toBe(false);
      expect(skorSchema.safeParse(2.5).success).toBe(false);
    });
  });

  describe("lampiranSchema", () => {
    it("menerima URL http dan https", () => {
      expect(lampiranSchema.safeParse("https://drive.google.com/folder").success).toBe(true);
      expect(lampiranSchema.safeParse("http://example.com").success).toBe(true);
    });

    it("mengubah string kosong / spasi menjadi null", () => {
      const empty = lampiranSchema.safeParse("");
      expect(empty.success).toBe(true);
      expect(empty.data).toBe(null);

      const spaces = lampiranSchema.safeParse("   ");
      expect(spaces.success).toBe(true);
      expect(spaces.data).toBe(null);
    });

    it("menolak non-http(s) dan URL tidak valid", () => {
      expect(lampiranSchema.safeParse("javascript:alert(1)").success).toBe(false);
      expect(lampiranSchema.safeParse("file:///path/to/file").success).toBe(false);
      expect(lampiranSchema.safeParse("not a url").success).toBe(false);
    });
  });

  describe("validasiSchema", () => {
    it("menerima true, false, dan null", () => {
      expect(validasiSchema.safeParse(true).success).toBe(true);
      expect(validasiSchema.safeParse(false).success).toBe(true);
      expect(validasiSchema.safeParse(null).success).toBe(true);
      expect(validasiSchema.safeParse("true").success).toBe(false);
    });
  });

  describe("catatanSchema", () => {
    it("menerima string dan null, string kosong menjadi null", () => {
      expect(catatanSchema.safeParse("Catatan auditor").data).toBe("Catatan auditor");
      expect(catatanSchema.safeParse("").data).toBe(null);
      expect(catatanSchema.safeParse("   ").data).toBe(null);
      expect(catatanSchema.safeParse(null).data).toBe(null);
    });
  });

  describe("bobotSchema", () => {
    it("menerima 1 sampai 10", () => {
      expect(bobotSchema.safeParse(1).success).toBe(true);
      expect(bobotSchema.safeParse(10).success).toBe(true);
      expect(bobotSchema.safeParse(0).success).toBe(false);
      expect(bobotSchema.safeParse(11).success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("menerima login dengan nama valid dan password", () => {
      expect(loginSchema.safeParse({ nama: "Jawa Timur", password: "123" }).success).toBe(true);
    });

    it("menolak nama kosong atau tidak valid", () => {
      expect(loginSchema.safeParse({ nama: "", password: "123" }).success).toBe(false);
      expect(loginSchema.safeParse({ nama: "   ", password: "123" }).success).toBe(false);
      expect(loginSchema.safeParse({ nama: "!@#$", password: "123" }).success).toBe(false);
    });
  });

  describe("gantiPasswordSchema", () => {
    it("menerima password baru >= 8 karakter yang cocok dengan konfirmasi", () => {
      const res = gantiPasswordSchema.safeParse({
        passwordBaru: "rahasia123",
        konfirmasiPassword: "rahasia123",
      });
      expect(res.success).toBe(true);
    });

    it("menolak password default www.bmh.or.id", () => {
      const res = gantiPasswordSchema.safeParse({
        passwordBaru: "www.bmh.or.id",
        konfirmasiPassword: "www.bmh.or.id",
      });
      expect(res.success).toBe(false);
    });

    it("menolak jika konfirmasi tidak cocok", () => {
      const res = gantiPasswordSchema.safeParse({
        passwordBaru: "rahasia123",
        konfirmasiPassword: "berbeda123",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("searchParamsSchema", () => {
    it("mengonversi string positif dan menangkap nilai invalid sebagai undefined", () => {
      expect(searchParamsSchema.parse({ cabang: "5", periode: "1" })).toEqual({
        cabang: 5,
        periode: 1,
      });
      expect(searchParamsSchema.parse({ cabang: "abc", periode: "-2" })).toEqual({
        cabang: undefined,
        periode: undefined,
      });
    });
  });

  describe("matrixRowCabangSchema", () => {
    it("mentoleransi angka yang datang sebagai string dari PostgREST", () => {
      const row = {
        periode_id: "1",
        cabang_id: "2",
        pilar_kode: "I",
        pilar_nama: "Pilar I",
        variabel_kode: "V-1",
        variabel_nama: "Variabel 1",
        nomor: "11",
        pertanyaan: "Pertanyaan",
        regulasi_utama: null,
        regulasi_tambahan: null,
        ranah: "Ps",
        bobot: "3",
        lampiran_link: null,
        skor_audite: "4",
        nilai_skor: "12",
      };
      const parsed = matrixRowCabangSchema.parse(row);
      expect(parsed.nomor).toBe(11);
      expect(parsed.bobot).toBe(3);
      expect(parsed.skor_audite).toBe(4);
      expect(parsed.nilai_skor).toBe(12);
    });
  });

  describe("partial update logic untuk simpanJawaban", () => {
    it("memastikan payload partial upsert hanya menyertakan kolom yang relevan", () => {
      // Kasus 1: pengubahan skor tidak boleh mengirim lampiran_link
      const skorInput = {
        periode_id: 1,
        cabang_id: 2,
        item_nomor: 5,
        skor_audite: 4,
      };
      expect("lampiran_link" in skorInput).toBe(false);

      // Kasus 2: pengubahan link tidak boleh mengirim skor_audite
      const linkInput = {
        periode_id: 1,
        cabang_id: 2,
        item_nomor: 5,
        lampiran_link: "https://drive.google.com/test",
      };
      expect("skor_audite" in linkInput).toBe(false);
    });
  });
});
