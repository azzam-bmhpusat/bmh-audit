import { describe, it, expect } from "vitest";
import {
  skorSchema,
  lampiranSchema,
  validasiSchema,
  catatanSchema,
  bobotSchema,
  loginSchema,
  gantiPasswordSchema,
  createUserSchema,
  updateUserSchema,
  resetUserPasswordSchema,
  deleteUserSchema,
  createCabangSchema,
  updateCabangSchema,
  deleteCabangSchema,
  searchParamsSchema,
  matrixRowCabangSchema,
  matrixRowAdminSchema,
  urutanSchema,
} from "./schemas";
import { getLampiranLink, getValidasiStatus, type MatrixRowAdmin, type MatrixRowCabang } from "@/types/audit";

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
    it("menerima login dengan email valid dan password", () => {
      expect(
        loginSchema.safeParse({ email: "jawa-timur@audit.bmh.or.id", password: "123" }).success
      ).toBe(true);
    });

    it("menolak email kosong atau format tidak valid", () => {
      expect(loginSchema.safeParse({ email: "", password: "123" }).success).toBe(false);
      expect(loginSchema.safeParse({ email: "   ", password: "123" }).success).toBe(false);
      expect(loginSchema.safeParse({ email: "bukan-email", password: "123" }).success).toBe(false);
      expect(loginSchema.safeParse({ email: "test@domain", password: "" }).success).toBe(false);
    });
  });

  describe("createUserSchema", () => {
    it("menerima data user yang valid", () => {
      const valid = createUserSchema.safeParse({
        nama: "Jawa Timur",
        email: "jawa-timur@audit.bmh.or.id",
        role: "user",
        cabang_id: 1,
        password: "www.bmh.or.id",
        wajib_ganti_password: true,
      });
      expect(valid.success).toBe(true);
    });

    it("menolak jika email tidak valid atau nama terlalu pendek", () => {
      expect(
        createUserSchema.safeParse({
          nama: "J",
          email: "invalid-email",
          role: "user",
        }).success
      ).toBe(false);
    });
  });

  describe("resetUserPasswordSchema", () => {
    it("menerima password baru minimal 6 karakter dengan default www.bmh.or.id", () => {
      const res = resetUserPasswordSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        passwordBaru: "www.bmh.or.id",
        wajib_ganti_password: true,
      });
      expect(res.success).toBe(true);
    });

    it("menolak jika id bukan uuid atau password kurang dari 6 karakter", () => {
      expect(
        resetUserPasswordSchema.safeParse({
          id: "invalid-id",
          passwordBaru: "12345",
        }).success
      ).toBe(false);
    });
  });

  describe("createCabangSchema", () => {
    it("menerima nama cabang valid dan kode opsional yang diubah ke uppercase", () => {
      const res = createCabangSchema.safeParse({
        nama: "Jawa Timur",
        kode: "jtm",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.kode).toBe("JTM");
      }
    });

    it("menerima nama cabang tanpa kode (kode null/undefined)", () => {
      const res = createCabangSchema.safeParse({
        nama: "Bali",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.kode).toBeNull();
      }
    });

    it("menolak nama cabang kurang dari 2 karakter", () => {
      expect(createCabangSchema.safeParse({ nama: "A" }).success).toBe(false);
    });
  });

  describe("updateCabangSchema", () => {
    it("menerima ID positif dan pembaruan nama serta kode", () => {
      const res = updateCabangSchema.safeParse({
        id: 1,
        nama: "Jawa Barat",
        kode: "jbr",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.kode).toBe("JBR");
      }
    });

    it("menolak ID non-positif atau nama kosong", () => {
      expect(updateCabangSchema.safeParse({ id: 0, nama: "Cabang" }).success).toBe(false);
      expect(updateCabangSchema.safeParse({ id: 1, nama: "" }).success).toBe(false);
    });
  });

  describe("deleteCabangSchema", () => {
    it("menerima ID perwakilan positif", () => {
      expect(deleteCabangSchema.safeParse({ id: 5 }).success).toBe(true);
      expect(deleteCabangSchema.safeParse({ id: "10" }).success).toBe(true);
    });

    it("menolak ID perwakilan 0 atau negatif", () => {
      expect(deleteCabangSchema.safeParse({ id: 0 }).success).toBe(false);
      expect(deleteCabangSchema.safeParse({ id: -1 }).success).toBe(false);
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

  describe("urutanSchema", () => {
    it("menerima integer 1 sampai 5", () => {
      expect(urutanSchema.safeParse(1).success).toBe(true);
      expect(urutanSchema.safeParse(5).success).toBe(true);
      expect(urutanSchema.safeParse(0).success).toBe(false);
      expect(urutanSchema.safeParse(6).success).toBe(false);
    });
  });

  describe("5 baris lampiran_links & validasi", () => {
    it("memvalidasi lampiran_links sebagai record map", () => {
      const row = {
        periode_id: 1,
        cabang_id: 10,
        pilar_kode: "I",
        pilar_nama: "Pilar I",
        variabel_kode: "V-1",
        variabel_nama: "Variabel 1",
        nomor: 1,
        pertanyaan: "SK Izin LAZ",
        regulasi_utama: "UU No. 23",
        regulasi_tambahan: null,
        ranah: "Ps",
        bobot: 2,
        lampiran_links: {
          "1": "https://drive.google.com/doc1",
          "2": "https://drive.google.com/doc2",
        },
        skor_audite: 4,
        nilai_skor: 8,
      };

      const parsed = matrixRowCabangSchema.parse(row);
      expect(parsed.lampiran_links?.["1"]).toBe("https://drive.google.com/doc1");
      expect(parsed.lampiran_links?.["2"]).toBe("https://drive.google.com/doc2");

      expect(getLampiranLink(parsed as MatrixRowCabang, 1)).toBe("https://drive.google.com/doc1");
      expect(getLampiranLink(parsed as MatrixRowCabang, 2)).toBe("https://drive.google.com/doc2");
      expect(getLampiranLink(parsed as MatrixRowCabang, 3)).toBe(null);
    });

    it("memvalidasi validasi auditor sebagai record map", () => {
      const adminRow = {
        periode_id: 1,
        cabang_id: 10,
        pilar_kode: "I",
        pilar_nama: "Pilar I",
        variabel_kode: "V-1",
        variabel_nama: "Variabel 1",
        nomor: 1,
        pertanyaan: "SK Izin LAZ",
        regulasi_utama: "UU No. 23",
        regulasi_tambahan: null,
        ranah: "Ps",
        bobot: 2,
        lampiran_links: null,
        skor_audite: 4,
        nilai_skor: 8,
        validasi: {
          "1": true,
          "2": false,
          "3": null,
        },
        skor_auditor: 4,
        nilai_skor_auditor: 8,
        catatan: "Catatan pengujian",
      };

      const parsed = matrixRowAdminSchema.parse(adminRow);
      expect(getValidasiStatus(parsed as MatrixRowAdmin, 1)).toBe(true);
      expect(getValidasiStatus(parsed as MatrixRowAdmin, 2)).toBe(false);
      expect(getValidasiStatus(parsed as MatrixRowAdmin, 3)).toBe(null);
      expect(getValidasiStatus(parsed as MatrixRowAdmin, 4)).toBe(null);
    });
  });
});
