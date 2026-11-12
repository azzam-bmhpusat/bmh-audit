import * as XLSX from "xlsx";
import type {
  ItemPoin,
  MatrixRowAdmin,
  MatrixRowCabang,
  MatrixTree,
} from "@/types/audit";
import { getLampiranLink, getValidasiStatus } from "@/types/audit";

export interface ExportExcelMetadata {
  title?: string;
  subtitle?: string;
  cabangNama?: string;
  periodeNama?: string;
}

export interface BuildWorksheetResult {
  data: (string | number)[][];
  merges: XLSX.Range[];
  cols: XLSX.ColInfo[];
}

/**
 * Mencegah Formula / CSV Injection (CWE-1236):
 * Karakter awal =, +, -, @, \t, atau \r pada nilai string di-escape dengan tanda kutip tunggal
 * agar spreadsheet membacanya sebagai teks literal, bukan rumus formula yang dieksekusi.
 */
export function sanitizeExcelCell<T extends string | number | null | undefined>(val: T): T {
  if (typeof val === "string") {
    if (
      val.startsWith("=") ||
      val.startsWith("+") ||
      val.startsWith("-") ||
      val.startsWith("@") ||
      val.startsWith("\t") ||
      val.startsWith("\r")
    ) {
      return `'${val}` as T;
    }
    const trimmed = val.trim();
    if (
      trimmed.startsWith("=") ||
      trimmed.startsWith("+") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("@")
    ) {
      return `'${val}` as T;
    }
  }
  return val;
}

export function buildMatrixWorksheetData(
  tree: MatrixTree<MatrixRowCabang | MatrixRowAdmin>,
  mode: "cabang" | "admin",
  metadata: ExportExcelMetadata = {}
): BuildWorksheetResult {
  const isCabang = mode === "cabang";

  const headers = isCabang
    ? [
        "No",
        "Pilar / Variabel / Indikator Pertanyaan Audit",
        "Acuan Regulasi Utama & Acuan Tambahan",
        "Bobot",
        "Fokus Pemeriksaan Per-Item Pertanyaan (5 Poin)",
        "5 Bukti Evidence yang Di-Submit",
        "Lampiran (Link Evidence)",
        "Kriteria Skor Penilaian (1–5)",
        "Skor Audite",
        "Nilai Skor",
      ]
    : [
        "No",
        "Pilar / Variabel / Indikator Pertanyaan Audit",
        "Acuan Regulasi Utama & Acuan Tambahan",
        "Bobot",
        "Fokus Pemeriksaan Per-Item Pertanyaan (5 Poin)",
        "5 Bukti Evidence yang Di-Submit",
        "Lampiran (Link Evidence)",
        "Validasi",
        "Kriteria Skor Penilaian (1–5)",
        "Skor Audite",
        "Nilai Skor",
        "Skor Auditor",
        "Nilai Skor Auditor",
        "Catatan Auditor",
      ];

  const numCols = headers.length;
  const data: (string | number)[][] = [];
  const merges: XLSX.Range[] = [];

  // 1. Header Informasi Dokumen (Baris 0 - 3)
  const mainTitle = "TABEL MATRIKS INSTRUMEN AUDIT KEPATUHAN INTEGRATIF LAZNAS BMH";
  const periodeText = `Periode : ${metadata.periodeNama || "—"}`;
  const lembagaText = "Satuan Internal Audit BMH";
  const cabangText = `BMH Perwakilan ${metadata.cabangNama || "—"}`;

  data.push([mainTitle]);
  data.push([periodeText]);
  data.push([lembagaText]);
  data.push([cabangText]);
  data.push([]); // Baris kosong pemisah

  for (let r = 0; r < 4; r++) {
    merges.push({ s: { r, c: 0 }, e: { r, c: numCols - 1 } });
  }

  // 2. Baris Header Tabel (Baris 5)
  data.push(headers);
  let currentRow = 6;

  // 3. Iterasi Pilar -> Variabel -> Item
  for (const pilar of tree.pilarList) {
    const pilarTitle = isCabang
      ? `${pilar.kode} : ${pilar.nama} (Subtotal Bobot: ${pilar.totalBobot} | Subtotal Nilai Skor: ${pilar.totalNilaiSkor})`
      : `${pilar.kode} : ${pilar.nama} (Subtotal Bobot: ${pilar.totalBobot} | Nilai Skor Audite: ${pilar.totalNilaiSkor} | Nilai Skor Auditor: ${pilar.totalNilaiSkorAuditor ?? 0})`;

    data.push([pilarTitle]);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: numCols - 1 } });
    currentRow++;

    for (const variabel of pilar.variabelList) {
      const varTitle = isCabang
        ? `${variabel.kode} : ${variabel.nama} (Subtotal Bobot: ${variabel.totalBobot} | Subtotal Nilai Skor: ${variabel.totalNilaiSkor} | Terisi: ${variabel.itemTerisi}/${variabel.totalItem})`
        : `${variabel.kode} : ${variabel.nama} (Subtotal Bobot: ${variabel.totalBobot} | Nilai Skor Audite: ${variabel.totalNilaiSkor} | Nilai Skor Auditor: ${variabel.totalNilaiSkorAuditor ?? 0} | Terisi: ${variabel.itemTerisi}/${variabel.totalItem})`;

      data.push([varTitle]);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: numCols - 1 } });
      currentRow++;

      for (const item of variabel.items) {
        const poinList: ItemPoin[] =
          (item.poin ?? []).length > 0
            ? item.poin
            : [
                {
                  item_nomor: item.nomor,
                  urutan: 1,
                  fokus_pemeriksaan: "—",
                  bukti_evidence: null,
                  kriteria_skor: "—",
                },
              ];

        const rowSpan = poinList.length;
        const startItemRow = currentRow;

        let regulasi = item.regulasi_utama ? `Utama: ${item.regulasi_utama}` : "—";
        if (item.regulasi_tambahan) {
          regulasi += `\nTambahan: ${item.regulasi_tambahan}`;
        }

        const adminItem = !isCabang ? (item as MatrixRowAdmin) : null;

        poinList.forEach((poin, pIdx) => {
          const isFirstPoin = pIdx === 0;
          const link = getLampiranLink(item, poin.urutan) || "—";

          if (isCabang) {
            data.push([
              isFirstPoin ? item.nomor : "",
              isFirstPoin ? sanitizeExcelCell(item.pertanyaan) : "",
              isFirstPoin ? sanitizeExcelCell(regulasi) : "",
              isFirstPoin ? item.bobot : "",
              sanitizeExcelCell(`${poin.urutan}. ${poin.fokus_pemeriksaan}`),
              poin.bukti_evidence ? sanitizeExcelCell(`${poin.urutan}. ${poin.bukti_evidence}`) : "—",
              sanitizeExcelCell(link),
              sanitizeExcelCell(`${poin.urutan}. ${poin.kriteria_skor}`),
              isFirstPoin ? (item.skor_audite ?? "") : "",
              isFirstPoin
                ? (item.nilai_skor ?? (item.skor_audite ? item.skor_audite * item.bobot : ""))
                : "",
            ]);
          } else {
            const validasiStatus = getValidasiStatus(adminItem, poin.urutan);
            const validasiText =
              validasiStatus === true
                ? "Benar"
                : validasiStatus === false
                ? "Tidak Benar"
                : "Belum";

            data.push([
              isFirstPoin ? item.nomor : "",
              isFirstPoin ? sanitizeExcelCell(item.pertanyaan) : "",
              isFirstPoin ? sanitizeExcelCell(regulasi) : "",
              isFirstPoin ? item.bobot : "",
              sanitizeExcelCell(`${poin.urutan}. ${poin.fokus_pemeriksaan}`),
              poin.bukti_evidence ? sanitizeExcelCell(`${poin.urutan}. ${poin.bukti_evidence}`) : "—",
              sanitizeExcelCell(link),
              validasiText,
              sanitizeExcelCell(`${poin.urutan}. ${poin.kriteria_skor}`),
              isFirstPoin ? (item.skor_audite ?? "") : "",
              isFirstPoin
                ? (item.nilai_skor ?? (item.skor_audite ? item.skor_audite * item.bobot : ""))
                : "",
              isFirstPoin ? (adminItem?.skor_auditor ?? "") : "",
              isFirstPoin
                ? (adminItem?.nilai_skor_auditor ??
                  (adminItem?.skor_auditor ? adminItem.skor_auditor * item.bobot : ""))
                : "",
              isFirstPoin ? sanitizeExcelCell(adminItem?.catatan || "") : "",
            ]);
          }

          currentRow++;
        });

        // Merge sel vertikal item-level jika memiliki lebih dari 1 sub-baris poin
        if (rowSpan > 1) {
          const endItemRow = startItemRow + rowSpan - 1;
          const mergedColIndices = isCabang
            ? [0, 1, 2, 3, 8, 9] // No, Pertanyaan, Regulasi, Bobot, Skor Audite, Nilai Skor
            : [0, 1, 2, 3, 9, 10, 11, 12, 13]; // + Skor Auditor, Nilai Skor Auditor, Catatan Auditor

          for (const colIdx of mergedColIndices) {
            merges.push({
              s: { r: startItemRow, c: colIdx },
              e: { r: endItemRow, c: colIdx },
            });
          }
        }
      }
    }
  }

  // 4. Baris Total (Footer)
  if (isCabang) {
    data.push([
      "Σ",
      "TOTAL NILAI SKOR DIPEROLEH CABANG",
      "",
      tree.totalBobot,
      "",
      "",
      "",
      "",
      `${tree.itemTerisi}/${tree.totalItem}`,
      tree.totalNilaiSkor,
    ]);
  } else {
    data.push([
      "Σ",
      `TOTAL NILAI SKOR DIPEROLEH / SKOR MAKSIMUM IDEAL (${tree.skorMaksimumIdeal})`,
      "",
      tree.totalBobot,
      "",
      "",
      "",
      "",
      "",
      `${tree.itemTerisi}/${tree.totalItem}`,
      tree.totalNilaiSkor,
      tree.persenAuditor != null ? `${tree.persenAuditor}%` : "—",
      tree.totalNilaiSkorAuditor ?? 0,
      "",
    ]);
  }

  // 5. Konfigurasi Lebar Kolom
  const cols: XLSX.ColInfo[] = isCabang
    ? [
        { wch: 6 }, // No
        { wch: 45 }, // Pertanyaan
        { wch: 35 }, // Regulasi
        { wch: 10 }, // Bobot
        { wch: 40 }, // Fokus
        { wch: 40 }, // Bukti
        { wch: 30 }, // Lampiran
        { wch: 40 }, // Kriteria
        { wch: 14 }, // Skor Audite
        { wch: 14 }, // Nilai Skor
      ]
    : [
        { wch: 6 }, // No
        { wch: 45 }, // Pertanyaan
        { wch: 35 }, // Regulasi
        { wch: 10 }, // Bobot
        { wch: 40 }, // Fokus
        { wch: 40 }, // Bukti
        { wch: 30 }, // Lampiran
        { wch: 14 }, // Validasi
        { wch: 40 }, // Kriteria
        { wch: 14 }, // Skor Audite
        { wch: 14 }, // Nilai Skor
        { wch: 14 }, // Skor Auditor
        { wch: 18 }, // Nilai Skor Auditor
        { wch: 30 }, // Catatan Auditor
      ];

  return { data, merges, cols };
}

export function exportMatrixToExcel(
  tree: MatrixTree<MatrixRowCabang | MatrixRowAdmin>,
  mode: "cabang" | "admin",
  metadata: ExportExcelMetadata = {}
): string {
  const { data, merges, cols } = buildMatrixWorksheetData(tree, mode, metadata);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!merges"] = merges;
  ws["!cols"] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Matriks Instrumen Audit");

  const safeCabang = (metadata.cabangNama || "Cabang")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  const safePeriode = (metadata.periodeNama || "Periode")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const filename = `Matriks_Audit_BMH_${safeCabang}_${safePeriode}.xlsx`;

  XLSX.writeFile(wb, filename);
  return filename;
}
