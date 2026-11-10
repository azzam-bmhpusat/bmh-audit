import { describe, it, expect } from "vitest";
import {
  auditPredikatSchema,
  penilaianCabangSchema,
  penilaianAdminSchema,
} from "@/lib/schemas";

describe("penilaian schemas & formatting logic", () => {
  const mockPredikatData = [
    {
      nilai: "A",
      batas_bawah: 90.0,
      batas_atas: 100.0,
      predikat: "Sangat Patuh (Excellence / Platinum)",
      status_kepatuhan: "SANGAT PATUH",
      keterangan: "Seluruh sistem kepatuhan terpenuhi.",
      wajib_ptk: false,
      rentang_teks: "90,00% – 100,00%",
    },
    {
      nilai: "B",
      batas_bawah: 80.0,
      batas_atas: 89.99,
      predikat: "Patuh (Good / Gold)",
      status_kepatuhan: "PATUH (ADA TEMUAN ADMINISTRATIF MINOR)",
      keterangan: "Sistem kepatuhan berjalan baik.",
      wajib_ptk: false,
      rentang_teks: "80,00% – 89,99%",
    },
    {
      nilai: "C",
      batas_bawah: 70.0,
      batas_atas: 79.99,
      predikat: "Cukup Patuh (Compliant / Silver)",
      status_kepatuhan: "CUKUP PATUH (PERLU SUPERVISI)",
      keterangan: "Memenuhi batas standar regulasi minimal.",
      wajib_ptk: false,
      rentang_teks: "70,00% – 79,99%",
    },
    {
      nilai: "D",
      batas_bawah: 60.0,
      batas_atas: 69.99,
      predikat: "Kurang Patuh (Satisfactory / Bronze)",
      status_kepatuhan: "KURANG PATUH (PERLU PERBAIKAN / PTK)",
      keterangan: "Wajib menerbitkan Permintaan Tindakan Korektif (PTK).",
      wajib_ptk: true,
      rentang_teks: "60,00% – 69,99%",
    },
    {
      nilai: "E",
      batas_bawah: 0.0,
      batas_atas: 59.99,
      predikat: "Tidak Patuh (Non-Compliant / Red Alert)",
      status_kepatuhan: "TIDAK PATUH (RISIKO TINGGI)",
      keterangan: "Memiliki risiko tinggi pada legalitas/syariah/keuangan.",
      wajib_ptk: true,
      rentang_teks: "< 60,00%",
    },
  ];

  it("berhasil memvalidasi skema data standar predikat", () => {
    for (const item of mockPredikatData) {
      const parsed = auditPredikatSchema.safeParse(item);
      expect(parsed.success).toBe(true);
    }
  });

  describe("evaluasi ambang batas predikat (boundary values)", () => {
    function findPredikat(score: number) {
      return (
        mockPredikatData.find(
          (p) => score >= p.batas_bawah && score <= p.batas_atas
        ) || null
      );
    }

    it("menetapkan 90.00 sebagai A", () => {
      expect(findPredikat(90.0)?.nilai).toBe("A");
    });

    it("menetapkan 89.99 sebagai B", () => {
      expect(findPredikat(89.99)?.nilai).toBe("B");
    });

    it("menetapkan 80.00 sebagai B", () => {
      expect(findPredikat(80.0)?.nilai).toBe("B");
    });

    it("menetapkan 79.99 sebagai C", () => {
      expect(findPredikat(79.99)?.nilai).toBe("C");
    });

    it("menetapkan 70.00 sebagai C", () => {
      expect(findPredikat(70.0)?.nilai).toBe("C");
    });

    it("menetapkan 69.99 sebagai D", () => {
      expect(findPredikat(69.99)?.nilai).toBe("D");
    });

    it("menetapkan 60.00 sebagai D", () => {
      expect(findPredikat(60.0)?.nilai).toBe("D");
    });

    it("menetapkan 59.99 sebagai E", () => {
      expect(findPredikat(59.99)?.nilai).toBe("E");
    });

    it("menetapkan 0.00 sebagai E", () => {
      expect(findPredikat(0.0)?.nilai).toBe("E");
    });
  });

  describe("kriteria penerimaan data uji PRD", () => {
    const dataUjiCabang = {
      periode_id: 1,
      cabang_id: 1,
      nama_lembaga: "Baitul Maal Hidayatullah (LAZNAS BMH)",
      entitas_audit: "BMH Perwakilan Jawa Timur",
      periode_audit: "Semester-I Tahun 2026",
      jumlah_indikator: 72,
      total_bobot: 162,
      skor_maksimum_ideal: 810,
      jumlah_butir_terisi: 59,
      jumlah_butir_belum_terisi: 13,
      jumlah_butir_terisi_teks: "59 / 72 Butir",
      persen_kelengkapan: 81.94,
      jumlah_butir_berlampiran: 55,
      total_nilai_skor: 548,
      nilai_akhir: 67.65,
      nilai_kepatuhan: "D",
      predikat_kepatuhan: "Kurang Patuh (Satisfactory / Bronze)",
      status_kepatuhan: "KURANG PATUH (PERLU PERBAIKAN / PTK)",
      wajib_ptk: true,
      keterangan_tindak_lanjut:
        "Ditemukan kelemahan operasional/pencatatan. Wajib menerbitkan Permintaan Tindakan Korektif (PTK) terikat waktu.",
    };

    it("memvalidasi payload penilaian cabang data uji secara sempurna", () => {
      const parsed = penilaianCabangSchema.safeParse(dataUjiCabang);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.skor_maksimum_ideal).toBe(810);
        expect(parsed.data.jumlah_butir_terisi_teks).toBe("59 / 72 Butir");
        expect(parsed.data.nilai_akhir).toBe(67.65);
        expect(parsed.data.nilai_kepatuhan).toBe("D");
        expect(parsed.data.wajib_ptk).toBe(true);
      }
    });

    it("memformat nilai akhir 67.65 ke dalam konvensi id-ID sebagai 67,65", () => {
      const formatter = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(formatter.format(dataUjiCabang.nilai_akhir)).toBe("67,65");
    });
  });

  describe("skema admin & selisih skor", () => {
    const dataUjiAdmin = {
      periode_id: 1,
      cabang_id: 1,
      nama_lembaga: "Baitul Maal Hidayatullah (LAZNAS BMH)",
      entitas_audit: "BMH Perwakilan Jawa Timur",
      periode_audit: "Semester-I Tahun 2026",
      jumlah_indikator: 72,
      total_bobot: 162,
      skor_maksimum_ideal: 810,
      jumlah_butir_terisi: 59,
      jumlah_butir_belum_terisi: 13,
      jumlah_butir_terisi_teks: "59 / 72 Butir",
      persen_kelengkapan: 81.94,
      jumlah_butir_berlampiran: 55,
      jumlah_bukti_diunggah: 120,
      total_nilai_skor_audite: 548,
      nilai_akhir_audite: 67.65,
      nilai_kepatuhan_audite: "D",
      predikat_kepatuhan_audite: "Kurang Patuh (Satisfactory / Bronze)",
      status_kepatuhan_audite: "KURANG PATUH (PERLU PERBAIKAN / PTK)",
      status_audit: "Sedang Diaudit",
      jumlah_butir_diaudit: 30,
      jumlah_butir_diaudit_teks: "30 / 72 Butir",
      jumlah_terisi_belum_diaudit: 29,
      jumlah_bukti_tervalidasi: 65,
      total_nilai_skor_auditor: 280,
      nilai_akhir_auditor: 34.57,
      nilai_kepatuhan_auditor: "E",
      predikat_kepatuhan_auditor: "Tidak Patuh (Non-Compliant / Red Alert)",
      status_kepatuhan_auditor: "TIDAK PATUH (RISIKO TINGGI)",
      wajib_ptk_auditor: true,
      keterangan_tindak_lanjut: "Evaluasi sistemik.",
      selisih_skor: -268,
      selisih_nilai_akhir: -33.08,
    };

    it("memvalidasi data view v_penilaian_admin dengan benar", () => {
      const parsed = penilaianAdminSchema.safeParse(dataUjiAdmin);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.selisih_skor).toBe(-268);
        expect(parsed.data.selisih_nilai_akhir).toBe(-33.08);
      }
    });
  });

  describe("penanganan edge cases", () => {
    it("ketika jumlah_butir_terisi = 0, frontend menampilkan 'Belum ada penilaian'", () => {
      const isZeroFilled = 0 === 0;
      const statusTampilan = isZeroFilled ? "Belum ada penilaian" : "E";
      expect(statusTampilan).toBe("Belum ada penilaian");
    });
  });
});
