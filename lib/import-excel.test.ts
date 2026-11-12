import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseAuditImportExcel } from "./import-excel";

describe("parseAuditImportExcel", () => {
  it("berhasil mem-parsing Skor Audite dan Lampiran (Link Evidence) dari file Excel sederhana (mode cabang)", async () => {
    const data = [
      ["TABEL INSTRUMEN AUDIT"],
      ["Periode 2026"],
      [],
      ["No", "Pertanyaan", "Bobot", "Fokus", "Lampiran (Link Evidence)", "Skor Audite"],
      [1, "Apakah terdapat SK Pengurus?", 5, "1. Fokus 1", "https://drive.google.com/doc1", 4],
      ["", "", "", "2. Fokus 2", "https://drive.google.com/doc2", ""],
      [2, "Apakah ada SOP Keuangan?", 4, "1. Fokus SOP", "https://example.com/sop", 5],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    const result = await parseAuditImportExcel(buffer, undefined, "cabang");

    expect(result.errors).toHaveLength(0);
    expect(result.canImport).toBe(true);
    expect(result.totalItemsDetected).toBe(2);
    expect(result.totalSkorFilled).toBe(2);
    expect(result.totalLinksFilled).toBe(3);

    const item1 = result.items.find((i) => i.itemNomor === 1);
    expect(item1).toBeDefined();
    expect(item1?.skorAudite).toBe(4);
    expect(item1?.lampiranLinks["1"]).toBe("https://drive.google.com/doc1");
    expect(item1?.lampiranLinks["2"]).toBe("https://drive.google.com/doc2");

    const item2 = result.items.find((i) => i.itemNomor === 2);
    expect(item2?.skorAudite).toBe(5);
    expect(item2?.lampiranLinks["1"]).toBe("https://example.com/sop");
  });

  it("mengabaikan kolom lain selain Lampiran dan Skor Audite pada mode cabang", async () => {
    const data = [
      ["No", "Pertanyaan", "Bobot Diubah", "Regulasi Palsu", "Lampiran (Link Evidence)", "Skor Audite"],
      [1, "Pertanyaan Diubah Oleh User", 99, "Regulasi Palsu 123", "https://valid.com/link", 3],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    const result = await parseAuditImportExcel(buffer, undefined, "cabang");

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item.itemNomor).toBe(1);
    expect(item.skorAudite).toBe(3);
    expect(item.lampiranLinks["1"]).toBe("https://valid.com/link");
    expect((item as unknown as Record<string, unknown>).pertanyaan).toBeUndefined();
    expect((item as unknown as Record<string, unknown>).bobot).toBeUndefined();
  });

  it("berhasil mem-parsing 4 kolom pada mode admin (Lampiran, Validasi, Skor Audite, Skor Auditor)", async () => {
    const data = [
      ["TABEL INSTRUMEN AUDIT ADMIN"],
      ["Periode 2026"],
      [],
      [
        "No",
        "Pertanyaan",
        "Bobot",
        "Fokus",
        "Lampiran (Link Evidence)",
        "Validasi",
        "Skor Audite",
        "Skor Auditor",
        "Catatan Auditor",
      ],
      [
        1,
        "Apakah terdapat SK Pengurus?",
        5,
        "1. Fokus 1",
        "https://drive.google.com/doc1",
        "Benar",
        4,
        5,
        "Catatan ini harus diabaikan",
      ],
      [
        "",
        "",
        "",
        "2. Fokus 2",
        "https://drive.google.com/doc2",
        "Tidak Benar",
        "",
        "",
        "",
      ],
      [
        2,
        "Apakah ada SOP Keuangan?",
        4,
        "1. Fokus SOP",
        "https://example.com/sop",
        "Belum",
        3,
        4,
        "Catatan ini juga diabaikan",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    const result = await parseAuditImportExcel(buffer, undefined, "admin");

    expect(result.errors).toHaveLength(0);
    expect(result.canImport).toBe(true);
    expect(result.totalItemsDetected).toBe(2);
    expect(result.totalSkorFilled).toBe(2);
    expect(result.totalSkorAuditorFilled).toBe(2);
    expect(result.totalLinksFilled).toBe(3);
    expect(result.totalValidasiFilled).toBe(2); // "Benar" and "Tidak Benar"

    const item1 = result.items.find((i) => i.itemNomor === 1);
    expect(item1).toBeDefined();
    expect(item1?.skorAudite).toBe(4);
    expect(item1?.skorAuditor).toBe(5);
    expect(item1?.validasi?.["1"]).toBe(true);
    expect(item1?.validasi?.["2"]).toBe(false);
    expect(item1?.lampiranLinks["1"]).toBe("https://drive.google.com/doc1");
    expect(item1?.lampiranLinks["2"]).toBe("https://drive.google.com/doc2");

    // Catatan Auditor harus diabaikan dan tidak ada di objek item
    expect((item1 as unknown as Record<string, unknown>).catatan).toBeUndefined();

    const item2 = result.items.find((i) => i.itemNomor === 2);
    expect(item2?.skorAudite).toBe(3);
    expect(item2?.skorAuditor).toBe(4);
    expect(item2?.validasi?.["1"]).toBeUndefined(); // "Belum" tidak dimasukkan sebagai boolean
  });

  it("menangani nilai skor tidak valid (> 5 atau < 1)", async () => {
    const data = [
      ["No", "Fokus", "Lampiran (Link Evidence)", "Skor Audite", "Skor Auditor"],
      [1, "1. Fokus", "https://valid.com", 6, 9], // Skor 6 dan 9 tidak valid
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    const result = await parseAuditImportExcel(buffer, undefined, "admin");

    expect(result.totalSkorFilled).toBe(0);
    expect(result.totalSkorAuditorFilled).toBe(0);
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
    const item1 = result.items.find((i) => i.itemNomor === 1);
    expect(item1?.skorAudite).toBeNull();
    expect(item1?.skorAuditor).toBeNull();
  });

  it("menangani link tidak valid dan membersihkan tanda strip/kosong", async () => {
    const data = [
      ["No", "Fokus", "Lampiran (Link Evidence)", "Skor Audite"],
      [1, "1. Fokus", "—", 4],
      [1, "2. Fokus", "-", 4],
      [1, "3. Fokus", "bukan-url-valid", 4],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    const result = await parseAuditImportExcel(buffer, undefined, "cabang");

    const item = result.items.find((i) => i.itemNomor === 1);
    expect(Object.keys(item?.lampiranLinks ?? {})).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes("bukan-url-valid"))).toBe(true);
  });
});
