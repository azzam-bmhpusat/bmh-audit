import * as XLSX from "xlsx";
import type {
  ItemPoin,
  MatrixRowAdmin,
  MatrixRowCabang,
  MatrixTree,
} from "@/types/audit";
import { getLampiranLink, getValidasiStatus } from "@/types/audit";

export interface ImportExcelMetadata {
  title?: string;
  subtitle?: string;
  cabangNama?: string;
  periodeNama?: string;
}

export interface ParsedItemJawaban {
  itemNomor: number;
  skorAudite: number | null;
  skorAuditor?: number | null;
  lampiranLinks: Record<string, string>;
  validasi?: Record<string, boolean | null>;
  warnings: string[];
}

export interface ParseAuditExcelResult {
  items: ParsedItemJawaban[];
  totalItemsDetected: number;
  totalSkorFilled: number;
  totalSkorAuditorFilled: number;
  totalLinksFilled: number;
  totalValidasiFilled: number;
  warnings: string[];
  errors: string[];
  canImport: boolean;
}

/**
 * Membuat dan mengunduh berkas template Excel (.xlsx) untuk import jawaban audit cabang atau penilaian admin.
 * Mode cabang: Hanya kolom Lampiran (Link Evidence) dan Skor Audite (1-5).
 * Mode admin: Kolom Lampiran (Link Evidence), Validasi, Skor Audite (1-5), dan Skor Auditor (1-5).
 */
export function downloadAuditImportTemplateExcel(
  tree: MatrixTree<MatrixRowCabang | MatrixRowAdmin>,
  metadata: ImportExcelMetadata = {},
  mode: "cabang" | "admin" = "cabang"
): string {
  const isAdmin = mode === "admin";

  const headers = !isAdmin
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
        "Skor Auditor",
      ];

  const numCols = headers.length;
  const data: (string | number)[][] = [];
  const merges: XLSX.Range[] = [];

  // 1. Header Informasi & Panduan Pengisian
  const mainTitle = !isAdmin
    ? "TEMPLATE IMPORT JAWABAN AUDIT - LAZNAS BMH"
    : "TEMPLATE IMPORT PENILAIAN AUDIT - SATUAN INTERNAL AUDIT BMH";
  const periodeText = `Periode : ${metadata.periodeNama || "—"}`;
  const cabangText = `BMH Perwakilan ${metadata.cabangNama || "—"}`;
  const panduanText = !isAdmin
    ? "PETUNJUK: Isi hanya kolom 'Lampiran (Link Evidence)' dan 'Skor Audite (1–5)'. Kolom lain jangan diubah."
    : "PETUNJUK: Isi hanya kolom 'Lampiran (Link Evidence)', 'Validasi', 'Skor Audite (1–5)', dan 'Skor Auditor (1–5)'. Kolom lain jangan diubah.";

  data.push([mainTitle]);
  data.push([periodeText]);
  data.push([cabangText]);
  data.push([panduanText]);
  data.push([]); // Baris kosong pemisah

  for (let r = 0; r < 4; r++) {
    merges.push({ s: { r, c: 0 }, e: { r, c: numCols - 1 } });
  }

  // 2. Baris Header Tabel (Baris 5 / index 5)
  data.push(headers);
  let currentRow = 6;

  // 3. Iterasi Pilar -> Variabel -> Item
  for (const pilar of tree.pilarList) {
    const pilarTitle = `${pilar.kode} : ${pilar.nama}`;
    data.push([pilarTitle]);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: numCols - 1 } });
    currentRow++;

    for (const variabel of pilar.variabelList) {
      const varTitle = `${variabel.kode} : ${variabel.nama}`;
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

        const adminItem = isAdmin ? (item as MatrixRowAdmin) : null;

        poinList.forEach((poin, pIdx) => {
          const isFirstPoin = pIdx === 0;
          const currentLink = getLampiranLink(item, poin.urutan) || "";

          if (!isAdmin) {
            data.push([
              isFirstPoin ? item.nomor : "",
              isFirstPoin ? item.pertanyaan : "",
              isFirstPoin ? regulasi : "",
              isFirstPoin ? item.bobot : "",
              `${poin.urutan}. ${poin.fokus_pemeriksaan}`,
              poin.bukti_evidence ? `${poin.urutan}. ${poin.bukti_evidence}` : "—",
              currentLink,
              `${poin.urutan}. ${poin.kriteria_skor}`,
              isFirstPoin ? (item.skor_audite ?? "") : "",
            ]);
          } else {
            const validasiVal = getValidasiStatus(adminItem, poin.urutan);
            const validasiText =
              validasiVal === true
                ? "Benar"
                : validasiVal === false
                ? "Tidak Benar"
                : "";

            data.push([
              isFirstPoin ? item.nomor : "",
              isFirstPoin ? item.pertanyaan : "",
              isFirstPoin ? regulasi : "",
              isFirstPoin ? item.bobot : "",
              `${poin.urutan}. ${poin.fokus_pemeriksaan}`,
              poin.bukti_evidence ? `${poin.urutan}. ${poin.bukti_evidence}` : "—",
              currentLink,
              validasiText,
              `${poin.urutan}. ${poin.kriteria_skor}`,
              isFirstPoin ? (item.skor_audite ?? "") : "",
              isFirstPoin ? (adminItem?.skor_auditor ?? "") : "",
            ]);
          }

          currentRow++;
        });

        // Merge sel vertikal item-level
        if (rowSpan > 1) {
          const endItemRow = startItemRow + rowSpan - 1;
          const mergedColIndices = !isAdmin
            ? [0, 1, 2, 3, 8] // No, Pertanyaan, Regulasi, Bobot, Skor Audite
            : [0, 1, 2, 3, 9, 10]; // + Skor Auditor

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

  // Konfigurasi lebar kolom proporsional
  const cols: XLSX.ColInfo[] = !isAdmin
    ? [
        { wch: 6 },  // No
        { wch: 45 }, // Pertanyaan
        { wch: 30 }, // Regulasi
        { wch: 8 },  // Bobot
        { wch: 40 }, // Fokus Pemeriksaan
        { wch: 40 }, // 5 Bukti Evidence
        { wch: 35 }, // Lampiran (Link Evidence) - ISI DI SINI
        { wch: 35 }, // Kriteria Skor
        { wch: 14 }, // Skor Audite - ISI DI SINI
      ]
    : [
        { wch: 6 },  // No
        { wch: 45 }, // Pertanyaan
        { wch: 30 }, // Regulasi
        { wch: 8 },  // Bobot
        { wch: 40 }, // Fokus Pemeriksaan
        { wch: 40 }, // 5 Bukti Evidence
        { wch: 35 }, // Lampiran (Link Evidence) - ISI DI SINI
        { wch: 14 }, // Validasi - ISI DI SINI
        { wch: 35 }, // Kriteria Skor
        { wch: 14 }, // Skor Audite - ISI DI SINI
        { wch: 14 }, // Skor Auditor - ISI DI SINI
      ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!merges"] = merges;
  ws["!cols"] = cols;

  const wb = XLSX.utils.book_new();
  const sheetTitle = !isAdmin ? "Template Isian Audit" : "Template Penilaian Audit";
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  const safeCabang = (metadata.cabangNama || "Cabang")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  const safePeriode = (metadata.periodeNama || "Periode")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const filenamePrefix = !isAdmin ? "Template_Import_Audit" : "Template_Import_Penilaian";
  const filename = `${filenamePrefix}_${safeCabang}_${safePeriode}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}

/**
 * Helper untuk membersihkan dan menormalkan URL link bukti.
 */
function normalizeUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let trimmed = raw.trim();
  if (
    !trimmed ||
    trimmed === "—" ||
    trimmed === "-" ||
    trimmed.toLowerCase() === "n/a" ||
    trimmed.toLowerCase() === "null" ||
    trimmed === "http://" ||
    trimmed === "https://"
  ) {
    return null;
  }

  // Normalisasi jika pengguna mengetik domain tanpa http/https (misal: drive.google.com/...)
  if (!/^https?:\/\//i.test(trimmed)) {
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    } else {
      return null;
    }
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Helper untuk menormalkan nilai validasi boolean dari teks/angka Excel.
 * "Benar" / "Ya" / "True" / "Valid" / "1" / "V" -> true
 * "Tidak Benar" / "Salah" / "Tidak" / "False" / "Invalid" / "0" / "X" -> false
 * Lainnya / Kosong / "Belum" -> null
 */
function normalizeValidasi(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") {
    if (raw === 1) return true;
    if (raw === 0) return false;
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (
      s === "benar" ||
      s === "ya" ||
      s === "true" ||
      s === "valid" ||
      s === "v" ||
      s === "1" ||
      s === "sesuai"
    ) {
      return true;
    }
    if (
      s === "tidak benar" ||
      s === "tidak" ||
      s === "salah" ||
      s === "false" ||
      s === "invalid" ||
      s === "0" ||
      s === "x" ||
      s === "tidak sesuai"
    ) {
      return false;
    }
  }
  return null;
}

/**
 * Parsing berkas Excel (.xlsx / .xls) hasil pengisian template atau export.
 * Mode cabang mengimpor:
 * 1. Lampiran (Link Evidence)
 * 2. Skor Audite
 * Mode admin mengimpor:
 * 1. Lampiran (Link Evidence)
 * 2. Validasi
 * 3. Skor Audite
 * 4. Skor Auditor
 * Kolom lainnya (bobot, regulasi, catatan auditor, dll.) sama sekali tidak diimpor.
 */
export async function parseAuditImportExcel(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  knownItemNomors?: Set<number>,
  mode: "cabang" | "admin" = "cabang"
): Promise<ParseAuditExcelResult> {
  const isAdmin = mode === "admin";
  const warnings: string[] = [];
  const errors: string[] = [];

  let buffer: ArrayBuffer | Uint8Array;
  if (typeof (fileOrBuffer as File).arrayBuffer === "function") {
    buffer = await (fileOrBuffer as File).arrayBuffer();
  } else {
    buffer = fileOrBuffer as ArrayBuffer | Uint8Array;
  }

  const wb = XLSX.read(buffer, { type: "array", cellFormula: false });
  const sheetName = wb.SheetNames[0];

  if (!sheetName || !wb.Sheets[sheetName]) {
    return {
      items: [],
      totalItemsDetected: 0,
      totalSkorFilled: 0,
      totalSkorAuditorFilled: 0,
      totalLinksFilled: 0,
      totalValidasiFilled: 0,
      warnings: ["Berkas Excel tidak memiliki lembar kerja (worksheet) yang valid."],
      errors: ["Lembar kerja Excel kosong."],
      canImport: false,
    };
  }

  const ws = wb.Sheets[sheetName];
  const rawSheet = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (rawSheet.length < 2) {
    return {
      items: [],
      totalItemsDetected: 0,
      totalSkorFilled: 0,
      totalSkorAuditorFilled: 0,
      totalLinksFilled: 0,
      totalValidasiFilled: 0,
      warnings: [],
      errors: ["Berkas Excel tidak memiliki cukup data untuk diimpor."],
      canImport: false,
    };
  }

  // 1. Cari baris header tabel secara dinamis
  let headerRowIndex = -1;
  let colNo = -1;
  let colFokus = -1;
  let colLink = -1;
  let colSkor = -1;
  let colValidasi = -1;
  let colSkorAuditor = -1;

  for (let r = 0; r < Math.min(rawSheet.length, 15); r++) {
    const row = rawSheet[r];
    if (!Array.isArray(row)) continue;

    const rowStrings = row.map((cell) => String(cell ?? "").trim());

    const cNo = rowStrings.findIndex((c) => /^no\.?$/i.test(c) || /^nomor$/i.test(c));
    const cLink = rowStrings.findIndex(
      (c) => /lampiran/i.test(c) || /link\s*evidence/i.test(c)
    );
    const cSkor = rowStrings.findIndex(
      (c) =>
        /skor\s*audite/i.test(c) ||
        (/skor/i.test(c) && !/kriteria|nilai|auditor/i.test(c))
    );
    const cValidasi = rowStrings.findIndex((c) => /validasi/i.test(c));
    const cSkorAuditor = rowStrings.findIndex(
      (c) =>
        /skor\s*auditor/i.test(c) ||
        (/auditor/i.test(c) && /skor/i.test(c) && !/nilai/i.test(c))
    );
    const cFokus = rowStrings.findIndex((c) => /fokus/i.test(c) || /bukti/i.test(c));

    if (
      cNo !== -1 &&
      (cLink !== -1 || cSkor !== -1 || cValidasi !== -1 || cSkorAuditor !== -1)
    ) {
      headerRowIndex = r;
      colNo = cNo;
      colLink = cLink;
      colSkor = cSkor;
      colValidasi = cValidasi;
      colSkorAuditor = cSkorAuditor;
      colFokus = cFokus;
      break;
    }
  }

  if (headerRowIndex === -1 || colNo === -1) {
    return {
      items: [],
      totalItemsDetected: 0,
      totalSkorFilled: 0,
      totalSkorAuditorFilled: 0,
      totalLinksFilled: 0,
      totalValidasiFilled: 0,
      warnings: [],
      errors: [
        "Format header tabel tidak dikenali. Pastikan terdapat kolom 'No', serta kolom isian yang sesuai.",
      ],
      canImport: false,
    };
  }

  // 2. Iterasi baris data di bawah header
  const itemsMap = new Map<
    number,
    {
      itemNomor: number;
      skorAudite: number | null;
      skorAuditor: number | null;
      lampiranLinks: Record<string, string>;
      validasi: Record<string, boolean | null>;
      warnings: string[];
    }
  >();

  let currentItemNomor: number | null = null;
  let subRowCounter = 0;

  for (let r = headerRowIndex + 1; r < rawSheet.length; r++) {
    const row = rawSheet[r];
    if (!Array.isArray(row)) continue;

    const noCellRaw = row[colNo];
    const noCellStr = String(noCellRaw ?? "").trim();

    // Deteksi jika sel No berisi angka item
    const parsedNo = parseInt(noCellStr, 10);
    const isNewItemRow = !isNaN(parsedNo) && parsedNo > 0 && String(parsedNo) === noCellStr;

    if (isNewItemRow) {
      currentItemNomor = parsedNo;
      subRowCounter = 1;
    } else if (currentItemNomor !== null) {
      subRowCounter++;
    } else {
      // Baris judul pilar/variabel atau baris kosong sebelum item pertama
      continue;
    }

    // Jika knownItemNomors diberikan, verifikasi apakah nomor butir ini dikenali
    if (knownItemNomors && !knownItemNomors.has(currentItemNomor)) {
      continue;
    }

    if (!itemsMap.has(currentItemNomor)) {
      itemsMap.set(currentItemNomor, {
        itemNomor: currentItemNomor,
        skorAudite: null,
        skorAuditor: null,
        lampiranLinks: {},
        validasi: {},
        warnings: [],
      });
    }

    const currentItem = itemsMap.get(currentItemNomor)!;

    // Tentukan urutan bukti (1..5)
    let urutan = subRowCounter;
    if (colFokus !== -1) {
      const fokusStr = String(row[colFokus] ?? "").trim();
      const matchPoin = fokusStr.match(/^([1-5])\./);
      if (matchPoin) {
        urutan = parseInt(matchPoin[1], 10);
      }
    }
    if (urutan < 1 || urutan > 5) {
      urutan = Math.min(Math.max(urutan, 1), 5);
    }

    // Ekstrak Kolom 1: Lampiran (Link Evidence)
    if (colLink !== -1) {
      const cellRef = XLSX.utils.encode_cell({ r, c: colLink });
      const cellObj = ws[cellRef];
      const rawLink = cellObj?.l?.Target || row[colLink];

      if (rawLink) {
        const normalized = normalizeUrl(rawLink);
        if (normalized) {
          currentItem.lampiranLinks[String(urutan)] = normalized;
        } else {
          const rawStr = String(rawLink).trim();
          if (
            rawStr &&
            rawStr !== "—" &&
            rawStr !== "-" &&
            rawStr.toLowerCase() !== "n/a"
          ) {
            const warnMsg = `Item ${currentItemNomor} Poin ${urutan}: Tautan '${rawStr}' bukan format URL http/https yang valid dan diabaikan.`;
            if (!currentItem.warnings.includes(warnMsg)) {
              currentItem.warnings.push(warnMsg);
              warnings.push(warnMsg);
            }
          }
        }
      }
    }

    // Ekstrak Kolom 2: Validasi (Khusus Admin)
    if (isAdmin && colValidasi !== -1) {
      const rawVal = row[colValidasi];
      if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== "") {
        const normVal = normalizeValidasi(rawVal);
        if (normVal !== null) {
          currentItem.validasi[String(urutan)] = normVal;
        }
      }
    }

    // Ekstrak Kolom 3: Skor Audite (HANYA angka 1–5)
    if (colSkor !== -1) {
      const skorRaw = row[colSkor];
      if (skorRaw !== undefined && skorRaw !== null && String(skorRaw).trim() !== "") {
        const skorStr = String(skorRaw).trim();
        const parsedSkor = parseInt(skorStr, 10);

        if (!isNaN(parsedSkor) && parsedSkor >= 1 && parsedSkor <= 5) {
          currentItem.skorAudite = parsedSkor;
        } else if (skorStr !== "—" && skorStr !== "-") {
          const warnMsg = `Item ${currentItemNomor}: Skor Audite '${skorStr}' tidak valid (skor harus angka bulat 1–5).`;
          if (!currentItem.warnings.includes(warnMsg)) {
            currentItem.warnings.push(warnMsg);
            warnings.push(warnMsg);
          }
        }
      }
    }

    // Ekstrak Kolom 4: Skor Auditor (Khusus Admin, HANYA angka 1–5)
    if (isAdmin && colSkorAuditor !== -1) {
      const skorAuditorRaw = row[colSkorAuditor];
      if (
        skorAuditorRaw !== undefined &&
        skorAuditorRaw !== null &&
        String(skorAuditorRaw).trim() !== ""
      ) {
        const skorStr = String(skorAuditorRaw).trim();
        const parsedSkor = parseInt(skorStr, 10);

        if (!isNaN(parsedSkor) && parsedSkor >= 1 && parsedSkor <= 5) {
          currentItem.skorAuditor = parsedSkor;
        } else if (skorStr !== "—" && skorStr !== "-") {
          const warnMsg = `Item ${currentItemNomor}: Skor Auditor '${skorStr}' tidak valid (skor harus angka bulat 1–5).`;
          if (!currentItem.warnings.includes(warnMsg)) {
            currentItem.warnings.push(warnMsg);
            warnings.push(warnMsg);
          }
        }
      }
    }
  }

  const items = Array.from(itemsMap.values()).sort((a, b) => a.itemNomor - b.itemNomor);
  let totalSkorFilled = 0;
  let totalSkorAuditorFilled = 0;
  let totalLinksFilled = 0;
  let totalValidasiFilled = 0;

  for (const it of items) {
    if (it.skorAudite !== null) totalSkorFilled++;
    if (it.skorAuditor !== null) totalSkorAuditorFilled++;
    totalLinksFilled += Object.keys(it.lampiranLinks).length;
    totalValidasiFilled += Object.keys(it.validasi).length;
  }

  const canImport = !isAdmin
    ? items.length > 0 && (totalSkorFilled > 0 || totalLinksFilled > 0)
    : items.length > 0 &&
      (totalSkorFilled > 0 ||
        totalSkorAuditorFilled > 0 ||
        totalLinksFilled > 0 ||
        totalValidasiFilled > 0);

  if (items.length === 0) {
    errors.push("Tidak ditemukan butir instrumen audit yang valid dalam berkas.");
  } else if (!canImport) {
    const expectedCols = !isAdmin
      ? "'Lampiran (Link Evidence)' atau 'Skor Audite'"
      : "'Lampiran', 'Validasi', 'Skor Audite', atau 'Skor Auditor'";
    warnings.push(`Berkas terbaca, namun tidak ada nilai ${expectedCols} yang terisi.`);
  }

  return {
    items,
    totalItemsDetected: items.length,
    totalSkorFilled,
    totalSkorAuditorFilled,
    totalLinksFilled,
    totalValidasiFilled,
    warnings,
    errors,
    canImport,
  };
}
