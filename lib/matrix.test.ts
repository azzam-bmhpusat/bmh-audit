import { describe, it, expect } from "vitest";
import { buildMatrixTree } from "./matrix";
import type { ItemPoin, MatrixRowAdmin, MatrixRowCabang } from "@/types/audit";

describe("lib/matrix", () => {
  const dummyPoin: ItemPoin[] = [
    { item_nomor: 1, urutan: 2, fokus_pemeriksaan: "Fokus 2", bukti_evidence: "Bukti 2", kriteria_skor: "Kriteria 2" },
    { item_nomor: 1, urutan: 1, fokus_pemeriksaan: "Fokus 1", bukti_evidence: "Bukti 1", kriteria_skor: "Kriteria 1" },
    // Item 11: bukti ke-5 bernilai null (kasus khusus PRD §5.2)
    { item_nomor: 11, urutan: 1, fokus_pemeriksaan: "Fokus 11-1", bukti_evidence: "Bukti 11-1", kriteria_skor: "K1" },
    { item_nomor: 11, urutan: 5, fokus_pemeriksaan: "Fokus 11-5", bukti_evidence: null, kriteria_skor: "K5" },
  ];

  const dummyRowsCabang: MatrixRowCabang[] = [
    {
      periode_id: 1,
      cabang_id: 10,
      pilar_kode: "I",
      pilar_nama: "Pilar I",
      variabel_kode: "V-1",
      variabel_nama: "Variabel 1",
      nomor: 1,
      pertanyaan: "Pertanyaan 1",
      regulasi_utama: "Reg 1",
      regulasi_tambahan: null,
      ranah: "Ps",
      bobot: 3,
      lampiran_link: "https://drive.google.com/test",
      skor_audite: 4,
      nilai_skor: 12,
    },
    {
      periode_id: 1,
      cabang_id: 10,
      pilar_kode: "I",
      pilar_nama: "Pilar I",
      variabel_kode: "V-1",
      variabel_nama: "Variabel 1",
      nomor: 11,
      pertanyaan: "Pertanyaan 11",
      regulasi_utama: "Reg 11",
      regulasi_tambahan: null,
      ranah: "PsPw",
      bobot: 2,
      lampiran_link: null,
      skor_audite: null,
      nilai_skor: null,
    },
    {
      periode_id: 1,
      cabang_id: 10,
      pilar_kode: "II",
      pilar_nama: "Pilar II",
      variabel_kode: "V-2",
      variabel_nama: "Variabel 2",
      nomor: 12,
      pertanyaan: "Pertanyaan 12",
      regulasi_utama: null,
      regulasi_tambahan: null,
      ranah: null,
      bobot: 4,
      lampiran_link: null,
      skor_audite: 5,
      nilai_skor: 20,
    },
  ];

  it("mengelompokkan baris ke dalam pohon Pilar -> Variabel -> Item", () => {
    const tree = buildMatrixTree(dummyRowsCabang, dummyPoin);

    expect(tree.pilarList.length).toBe(2);
    expect(tree.pilarList[0].kode).toBe("I");
    expect(tree.pilarList[0].variabelList.length).toBe(1);
    expect(tree.pilarList[0].variabelList[0].kode).toBe("V-1");
    expect(tree.pilarList[0].variabelList[0].items.length).toBe(2);
    expect(tree.pilarList[1].kode).toBe("II");
  });

  it("mengurutkan poin per item berdasarkan urutan (1..5)", () => {
    const tree = buildMatrixTree(dummyRowsCabang, dummyPoin);
    const item1 = tree.pilarList[0].variabelList[0].items[0];

    expect(item1.poin[0].urutan).toBe(1);
    expect(item1.poin[1].urutan).toBe(2);
  });

  it("menangani item 11 dengan bukti_evidence null tanpa error", () => {
    const tree = buildMatrixTree(dummyRowsCabang, dummyPoin);
    const item11 = tree.pilarList[0].variabelList[0].items[1];

    expect(item11.nomor).toBe(11);
    const poin5 = item11.poin.find((p) => p.urutan === 5);
    expect(poin5?.bukti_evidence).toBe(null);
  });

  it("menghitung subtotal bobot, nilai skor, dan progres isian per variabel", () => {
    const tree = buildMatrixTree(dummyRowsCabang, dummyPoin);
    const var1 = tree.pilarList[0].variabelList[0];

    // Item 1 bobot 3, Item 11 bobot 2 -> 5
    expect(var1.totalBobot).toBe(5);
    // Item 1 nilai 12, Item 11 null -> 12
    expect(var1.totalNilaiSkor).toBe(12);
    // 1 dari 2 item terisi
    expect(var1.itemTerisi).toBe(1);
    expect(var1.totalItem).toBe(2);
  });

  it("menghitung total keseluruhan matriks dan persentase", () => {
    const tree = buildMatrixTree(dummyRowsCabang, dummyPoin);

    // Total bobot: 3 + 2 + 4 = 9
    expect(tree.totalBobot).toBe(9);
    // Skor maks ideal: 5 × 9 = 45
    expect(tree.skorMaksimumIdeal).toBe(45);
    // Total nilai skor: 12 + 0 + 20 = 32
    expect(tree.totalNilaiSkor).toBe(32);
    // Persen audite: 32 / 45 * 100 = 71.11%
    expect(tree.persenAudite).toBe(71.11);
    // Mode cabang -> persenAuditor null
    expect(tree.persenAuditor).toBe(null);
  });

  it("menghitung nilai skor auditor dan persen auditor pada mode admin", () => {
    const dummyRowsAdmin: MatrixRowAdmin[] = [
      {
        ...dummyRowsCabang[0],
        validasi: true,
        skor_auditor: 3,
        nilai_skor_auditor: 9,
        catatan: "Catatan item 1",
      },
      {
        ...dummyRowsCabang[1],
        validasi: false,
        skor_auditor: 1,
        nilai_skor_auditor: 2,
        catatan: null,
      },
    ];

    const tree = buildMatrixTree(dummyRowsAdmin, dummyPoin);
    const var1 = tree.pilarList[0].variabelList[0];

    // Nilai auditor: 9 + 2 = 11
    expect(var1.totalNilaiSkorAuditor).toBe(11);
    expect(tree.totalNilaiSkorAuditor).toBe(11);
    // Total bobot: 5 -> maks 25. Persen auditor: 11 / 25 * 100 = 44%
    expect(tree.persenAuditor).toBe(44);
  });
});
