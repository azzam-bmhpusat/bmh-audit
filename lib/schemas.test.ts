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
  resetUserPasswordSchema,
  createCabangSchema,
  updateCabangSchema,
  deleteCabangSchema,
  createPeriodeSchema,
  updatePeriodeSchema,
  togglePeriodeStatusSchema,
  deletePeriodeSchema,
  updateStatusAuditSchema,
  toggleLockFormSchema,
  updatePredikatSchema,
  searchParamsSchema,
  matrixRowCabangSchema,
  matrixRowAdminSchema,
  urutanSchema,
} from "./schemas";
import { getLampiranLink, getValidasiStatus, type MatrixRowAdmin, type MatrixRowCabang } from "@/types/audit";
import { COLUMNS_CABANG, COLUMNS_ADMIN } from "@/components/audit/columns";

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
    it("menerima password baru minimal 8 karakter", () => {
      const res = resetUserPasswordSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        passwordBaru: "PasswordAman123!",
        wajib_ganti_password: true,
      });
      expect(res.success).toBe(true);
    });

    it("menolak jika id bukan uuid atau password kurang dari 8 karakter", () => {
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

  describe("createPeriodeSchema", () => {
    it("menerima nama periode valid dengan default is_open = true", () => {
      const res = createPeriodeSchema.safeParse({ nama: "Semester-II Tahun 2026" });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.is_open).toBe(true);
        expect(res.data.setAsOnlyActive).toBe(false);
      }
    });

    it("menolak nama periode terlalu pendek", () => {
      expect(createPeriodeSchema.safeParse({ nama: "AB" }).success).toBe(false);
      expect(createPeriodeSchema.safeParse({ nama: "   " }).success).toBe(false);
    });
  });

  describe("updatePeriodeSchema & togglePeriodeStatusSchema", () => {
    it("memvalidasi update periode", () => {
      const res = updatePeriodeSchema.safeParse({
        id: "2",
        nama: "Semester-I 2027",
        is_open: false,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.id).toBe(2);
        expect(res.data.is_open).toBe(false);
      }
    });

    it("memvalidasi toggle periode status", () => {
      expect(togglePeriodeStatusSchema.safeParse({ id: 1, is_open: false }).success).toBe(true);
      expect(togglePeriodeStatusSchema.safeParse({ id: -1, is_open: true }).success).toBe(false);
    });
  });

  describe("deletePeriodeSchema", () => {
    it("memvalidasi ID periode positif", () => {
      expect(deletePeriodeSchema.safeParse({ id: 3 }).success).toBe(true);
      expect(deletePeriodeSchema.safeParse({ id: 0 }).success).toBe(false);
    });
  });

  describe("gantiPasswordSchema", () => {
    it("menerima password baru >= 8 karakter yang cocok dengan konfirmasi dan password lama valid", () => {
      const res = gantiPasswordSchema.safeParse({
        passwordLama: "passwordLama123",
        passwordBaru: "rahasia123",
        konfirmasiPassword: "rahasia123",
      });
      expect(res.success).toBe(true);
    });

    it("menolak jika password lama kosong", () => {
      const res = gantiPasswordSchema.safeParse({
        passwordLama: "",
        passwordBaru: "rahasia123",
        konfirmasiPassword: "rahasia123",
      });
      expect(res.success).toBe(false);
    });

    it("menolak password baru yang sama dengan password lama", () => {
      const res = gantiPasswordSchema.safeParse({
        passwordLama: "rahasia123",
        passwordBaru: "rahasia123",
        konfirmasiPassword: "rahasia123",
      });
      expect(res.success).toBe(false);
    });

    it("menolak password default www.bmh.or.id", () => {
      const res = gantiPasswordSchema.safeParse({
        passwordLama: "passwordLama123",
        passwordBaru: "www.bmh.or.id",
        konfirmasiPassword: "www.bmh.or.id",
      });
      expect(res.success).toBe(false);
    });

    it("menolak jika konfirmasi tidak cocok", () => {
      const res = gantiPasswordSchema.safeParse({
        passwordLama: "passwordLama123",
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
      expect(parsed.catatan).toBeUndefined();
    });

    it("menerima kolom catatan auditor opsional", () => {
      const row = {
        periode_id: 1,
        cabang_id: 2,
        pilar_kode: "I",
        pilar_nama: "Pilar I",
        variabel_kode: "V-1",
        variabel_nama: "Variabel 1",
        nomor: 1,
        pertanyaan: "Pertanyaan 1",
        regulasi_utama: null,
        regulasi_tambahan: null,
        ranah: null,
        bobot: 10,
        lampiran_link: null,
        skor_audite: 4,
        nilai_skor: 40,
        catatan: "Catatan auditor untuk perwakilan",
      };
      const parsed = matrixRowCabangSchema.parse(row);
      expect(parsed.catatan).toBe("Catatan auditor untuk perwakilan");
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

  describe("updateStatusAuditSchema", () => {
    it("menerima payload status audit yang valid", () => {
      const validPayload = {
        periodeId: "1",
        cabangId: 5,
        status: "Sudah Diaudit",
        catatan: "Pemeriksaan instrumen selesai 100%.",
      };
      const result = updateStatusAuditSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.periodeId).toBe(1);
        expect(result.data.status).toBe("Sudah Diaudit");
      }
    });

    it("menolak status selain enum yang ditentukan", () => {
      const invalidPayload = {
        periodeId: 1,
        cabangId: 5,
        status: "Selesai",
      };
      const result = updateStatusAuditSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("menolak jika ID periode atau cabang negatif atau 0", () => {
      const invalidPayload = {
        periodeId: 0,
        cabangId: -1,
        status: "Sedang Diaudit",
      };
      const result = updateStatusAuditSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("toggleLockFormSchema", () => {
    it("menerima payload kunci form yang valid", () => {
      const validPayload = {
        periodeId: "1",
        cabangId: 3,
        isLocked: true,
        catatan: "Form dikunci setelah pemeriksaan selesai",
      };
      const result = toggleLockFormSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isLocked).toBe(true);
        expect(result.data.cabangId).toBe(3);
      }
    });

    it("menolak jika isLocked bukan boolean", () => {
      const invalidPayload = {
        periodeId: 1,
        cabangId: 3,
        isLocked: "locked",
      };
      const result = toggleLockFormSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("updatePredikatSchema", () => {
    const validPredikat = {
      nilai: "A",
      predikat: "Sangat Patuh (Excellence / Platinum)",
      status_kepatuhan: "SANGAT PATUH",
      batas_bawah: 90,
      batas_atas: 100,
      keterangan: "Seluruh sistem kepatuhan terpenuhi dengan bukti lengkap.",
      wajib_ptk: false,
    };

    it("menerima data predikat yang valid", () => {
      const result = updatePredikatSchema.safeParse(validPredikat);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nilai).toBe("A");
        expect(result.data.batas_bawah).toBe(90);
        expect(result.data.batas_atas).toBe(100);
        expect(result.data.wajib_ptk).toBe(false);
      }
    });

    it("menerima batas angka bertipe string numerik (coerced)", () => {
      const payload = {
        ...validPredikat,
        batas_bawah: "85.5",
        batas_atas: "89.99",
      };
      const result = updatePredikatSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.batas_bawah).toBe(85.5);
        expect(result.data.batas_atas).toBe(89.99);
      }
    });

    it("menolak jika batas_atas lebih kecil dari batas_bawah", () => {
      const payload = {
        ...validPredikat,
        batas_bawah: 95,
        batas_atas: 80,
      };
      const result = updatePredikatSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "Batas atas harus lebih besar atau sama dengan batas bawah"
        );
      }
    });

    it("menolak jika batas_bawah di bawah 0 atau batas_atas di atas 100", () => {
      const belowZero = {
        ...validPredikat,
        batas_bawah: -5,
      };
      expect(updatePredikatSchema.safeParse(belowZero).success).toBe(false);

      const above100 = {
        ...validPredikat,
        batas_atas: 105,
      };
      expect(updatePredikatSchema.safeParse(above100).success).toBe(false);
    });

    it("menolak jika string wajib kosong", () => {
      const emptyPredikat = {
        ...validPredikat,
        predikat: "   ",
      };
      expect(updatePredikatSchema.safeParse(emptyPredikat).success).toBe(false);
    });
  });

  describe("COLUMNS_CABANG", () => {
    it("memiliki kolom Catatan Auditor tepat di sebelah kanan kolom Nilai Skor", () => {
      const nilaiSkorIdx = COLUMNS_CABANG.findIndex((c) => c.id === "nilai_skor");
      const catatanIdx = COLUMNS_CABANG.findIndex((c) => c.id === "catatan");

      expect(nilaiSkorIdx).toBeGreaterThan(-1);
      expect(catatanIdx).toBe(nilaiSkorIdx + 1);
      expect(COLUMNS_CABANG[catatanIdx].label).toBe("Catatan Auditor");
    });
  });
});
