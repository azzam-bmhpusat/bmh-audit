import { describe, expect, it } from "vitest";
import { buildMatrixWorksheetData, sanitizeExcelCell } from "./export-excel";
import type { MatrixRowAdmin, MatrixRowCabang, MatrixTree } from "@/types/audit";

function createMockCabangTree(): MatrixTree<MatrixRowCabang> {
  return {
    pilarList: [
      {
        kode: "PILAR I",
        nama: "KEPATUHAN SYARIAH",
        totalBobot: 10,
        totalNilaiSkor: 40,
        totalNilaiSkorAuditor: null,
        variabelList: [
          {
            kode: "V-1",
            nama: "Pengawasan Syariah",
            totalBobot: 10,
            totalNilaiSkor: 40,
            totalNilaiSkorAuditor: null,
            itemTerisi: 1,
            totalItem: 1,
            items: [
              {
                periode_id: 1,
                cabang_id: 2,
                pilar_kode: "PILAR I",
                pilar_nama: "KEPATUHAN SYARIAH",
                variabel_kode: "V-1",
                variabel_nama: "Pengawasan Syariah",
                nomor: 1,
                pertanyaan: "Apakah terdapat SK Dewan Pengawas Syariah?",
                regulasi_utama: "UU No. 23/2011",
                regulasi_tambahan: "PMA No. 52/2014",
                ranah: "Syariah",
                bobot: 10,
                lampiran_link: "https://drive.google.com/test1",
                lampiran_links: { "1": "https://drive.google.com/test1" },
                skor_audite: 4,
                nilai_skor: 40,
                poin: [
                  {
                    item_nomor: 1,
                    urutan: 1,
                    fokus_pemeriksaan: "Kelengkapan SK DPS",
                    bukti_evidence: "Salinan SK DPS",
                    kriteria_skor: "Ada SK aktif",
                  },
                  {
                    item_nomor: 1,
                    urutan: 2,
                    fokus_pemeriksaan: "Rapat DPS",
                    bukti_evidence: "Notula rapat",
                    kriteria_skor: "Minimal 2 kali per tahun",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    totalBobot: 10,
    totalNilaiSkor: 40,
    totalNilaiSkorAuditor: null,
    itemTerisi: 1,
    totalItem: 1,
    skorMaksimumIdeal: 50,
    persenAudite: 80,
    persenAuditor: null,
  };
}

function createMockAdminTree(): MatrixTree<MatrixRowAdmin> {
  return {
    pilarList: [
      {
        kode: "PILAR I",
        nama: "KEPATUHAN SYARIAH",
        totalBobot: 10,
        totalNilaiSkor: 40,
        totalNilaiSkorAuditor: 50,
        variabelList: [
          {
            kode: "V-1",
            nama: "Pengawasan Syariah",
            totalBobot: 10,
            totalNilaiSkor: 40,
            totalNilaiSkorAuditor: 50,
            itemTerisi: 1,
            totalItem: 1,
            items: [
              {
                periode_id: 1,
                cabang_id: 2,
                pilar_kode: "PILAR I",
                pilar_nama: "KEPATUHAN SYARIAH",
                variabel_kode: "V-1",
                variabel_nama: "Pengawasan Syariah",
                nomor: 1,
                pertanyaan: "Apakah terdapat SK Dewan Pengawas Syariah?",
                regulasi_utama: "UU No. 23/2011",
                regulasi_tambahan: null,
                ranah: "Syariah",
                bobot: 10,
                lampiran_link: "https://drive.google.com/test1",
                lampiran_links: { "1": "https://drive.google.com/test1" },
                skor_audite: 4,
                nilai_skor: 40,
                validasi: { "1": true, "2": false },
                skor_auditor: 5,
                nilai_skor_auditor: 50,
                catatan: "Dokumen sangat lengkap dan sesuai.",
                poin: [
                  {
                    item_nomor: 1,
                    urutan: 1,
                    fokus_pemeriksaan: "Kelengkapan SK DPS",
                    bukti_evidence: "Salinan SK DPS",
                    kriteria_skor: "Ada SK aktif",
                  },
                  {
                    item_nomor: 1,
                    urutan: 2,
                    fokus_pemeriksaan: "Rapat DPS",
                    bukti_evidence: "Notula rapat",
                    kriteria_skor: "Minimal 2 kali per tahun",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    totalBobot: 10,
    totalNilaiSkor: 40,
    totalNilaiSkorAuditor: 50,
    itemTerisi: 1,
    totalItem: 1,
    skorMaksimumIdeal: 50,
    persenAudite: 80,
    persenAuditor: 100,
  };
}

describe("export-excel builder", () => {
  it("builds correct worksheet data for mode cabang (10 columns)", () => {
    const tree = createMockCabangTree();
    const result = buildMatrixWorksheetData(tree, "cabang", {
      cabangNama: "Surabaya",
      periodeNama: "2026 Semester 1",
    });

    expect(result.data.length).toBeGreaterThan(6);

    // Metadata baris 0 - 3
    expect(result.data[0][0]).toContain("TABEL MATRIKS INSTRUMEN AUDIT");
    expect(result.data[1][0]).toBe("Periode : 2026 Semester 1");
    expect(result.data[2][0]).toBe("Satuan Internal Audit BMH");
    expect(result.data[3][0]).toBe("BMH Perwakilan Surabaya");

    // Header tabel di baris 5 memiliki 10 kolom
    const headers = result.data[5];
    expect(headers).toHaveLength(10);
    expect(headers[0]).toBe("No");
    expect(headers[9]).toBe("Nilai Skor");

    // Baris pilar dan variabel
    expect(result.data[6][0]).toContain("PILAR I");
    expect(result.data[7][0]).toContain("V-1");

    // Baris item poin ke-1
    expect(result.data[8][0]).toBe(1); // No
    expect(result.data[8][1]).toContain("Apakah terdapat SK"); // Pertanyaan
    expect(result.data[8][3]).toBe(10); // Bobot
    expect(result.data[8][8]).toBe(4); // Skor Audite
    expect(result.data[8][9]).toBe(40); // Nilai Skor

    // Baris item poin ke-2 (sub-baris)
    expect(result.data[9][0]).toBe(""); // No kosong karena di-merge
    expect(result.data[9][4]).toContain("2. Rapat DPS");

    // Merge ranges terdaftar
    expect(result.merges.length).toBeGreaterThan(0);
    // Kolom No (c=0) di-merge dari baris 8 sampai 9
    const noMerge = result.merges.find((m) => m.s.r === 8 && m.s.c === 0);
    expect(noMerge).toBeDefined();
    expect(noMerge?.e.r).toBe(9);

    // Total footer di akhir
    const footer = result.data[result.data.length - 1];
    expect(footer[0]).toBe("Σ");
    expect(footer[3]).toBe(10); // Total bobot
    expect(footer[9]).toBe(40); // Total nilai skor
  });

  it("builds correct worksheet data for mode admin (14 columns)", () => {
    const tree = createMockAdminTree();
    const result = buildMatrixWorksheetData(tree, "admin", {
      cabangNama: "Malang",
      periodeNama: "2026 Semester 1",
    });

    const headers = result.data[5];
    expect(headers).toHaveLength(14);
    expect(headers[7]).toBe("Validasi");
    expect(headers[11]).toBe("Skor Auditor");
    expect(headers[12]).toBe("Nilai Skor Auditor");
    expect(headers[13]).toBe("Catatan Auditor");

    // Poin 1 validasi Benar
    expect(result.data[8][7]).toBe("Benar");
    // Poin 2 validasi Tidak Benar
    expect(result.data[9][7]).toBe("Tidak Benar");

    // Skor & nilai auditor ada pada item row pertama
    expect(result.data[8][11]).toBe(5);
    expect(result.data[8][12]).toBe(50);
    expect(result.data[8][13]).toBe("Dokumen sangat lengkap dan sesuai.");
  });

  describe("sanitizeExcelCell", () => {
    it("menambahkan kutip tunggal jika diawali simbol formula berbahaya", () => {
      expect(sanitizeExcelCell("=1+1")).toBe("'=1+1");
      expect(sanitizeExcelCell("+cmd")).toBe("'+cmd");
      expect(sanitizeExcelCell("-cmd")).toBe("'-cmd");
      expect(sanitizeExcelCell("@SUM(A1:A5)")).toBe("'@SUM(A1:A5)");
      expect(sanitizeExcelCell("\tcmd")).toBe("'\tcmd");
      expect(sanitizeExcelCell("\rcmd")).toBe("'\rcmd");
    });

    it("tidak mengubah string normal, angka, atau nilai kosong", () => {
      expect(sanitizeExcelCell("Laporan Audit")).toBe("Laporan Audit");
      expect(sanitizeExcelCell(100)).toBe(100);
      expect(sanitizeExcelCell(null)).toBe(null);
      expect(sanitizeExcelCell(undefined)).toBe(undefined);
    });
  });
});
