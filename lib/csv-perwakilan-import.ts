import * as XLSX from "xlsx";
import type { Cabang } from "@/types/audit";

export interface ParsedPerwakilanRow {
  rowNumber: number;
  nama: string;
  kode?: string | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PerwakilanImportTemplateData {
  nama: string;
  kode: string;
}

export const TEMPLATE_COLUMNS = ["nama", "kode"] as const;

export const SAMPLE_TEMPLATE_ROWS: PerwakilanImportTemplateData[] = [
  {
    nama: "Jawa Timur",
    kode: "JTM",
  },
  {
    nama: "Jawa Barat",
    kode: "JBR",
  },
  {
    nama: "DKI Jakarta",
    kode: "JKT",
  },
  {
    nama: "D.I. Yogyakarta",
    kode: "DIY",
  },
];

/**
 * Trigger download file di browser.
 */
function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download template data perwakilan dalam format .csv (dengan UTF-8 BOM untuk kompatibilitas Excel).
 */
export function downloadPerwakilanImportTemplateCsv() {
  const header = TEMPLATE_COLUMNS.join(",");
  const rows = SAMPLE_TEMPLATE_ROWS.map((r) =>
    [`"${r.nama}"`, `"${r.kode}"`].join(",")
  );

  const csvContent = "\uFEFF" + [header, ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerBrowserDownload(blob, "template_manajemen_perwakilan.csv");
}

/**
 * Download template data perwakilan dalam format .xlsx (Excel).
 */
export function downloadPerwakilanImportTemplateExcel() {
  const worksheetData = [
    ["nama", "kode"],
    ...SAMPLE_TEMPLATE_ROWS.map((r) => [r.nama, r.kode]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Atur lebar kolom agar proporsional dan mudah dibaca
  worksheet["!cols"] = [
    { wch: 30 }, // nama
    { wch: 15 }, // kode
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Perwakilan");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerBrowserDownload(blob, "template_manajemen_perwakilan.xlsx");
}

/**
 * Normalisasi header dari file (mendukung alias bahasa Indonesia & Inggris).
 */
export function normalizeHeaderKey(key: string): keyof PerwakilanImportTemplateData | null {
  const clean = key.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  if (["nama", "namaperwakilan", "namacabang", "perwakilan", "cabang", "name", "branch"].includes(clean)) {
    return "nama";
  }
  if (["kode", "kodeperwakilan", "kodecabang", "singkatan", "code", "branchcode"].includes(clean)) {
    return "kode";
  }

  return null;
}

/**
 * Parse raw rows data menjadi ParsedPerwakilanRow[].
 * - Memvalidasi format kolom
 * - Memeriksa duplikasi nama dan kode dalam file
 * - Memeriksa duplikasi nama dan kode dengan cabang yang sudah ada di database
 */
export function parseRawPerwakilanRows(
  rawData: Array<Record<string, unknown>>,
  existingCabangList: Cabang[]
): ParsedPerwakilanRow[] {
  const parsedRows: ParsedPerwakilanRow[] = [];

  // Peta lookup cabang yang sudah terdaftar di database
  const existingNamaSet = new Set<string>();
  const existingKodeSet = new Set<string>();

  for (const c of existingCabangList) {
    if (c.nama) {
      existingNamaSet.add(c.nama.trim().toLowerCase());
    }
    if (c.kode) {
      existingKodeSet.add(c.kode.trim().toUpperCase());
    }
  }

  // Set untuk mendeteksi duplikasi di dalam file yang diunggah
  const seenNamaInFile = new Map<string, number>(); // nama lowercase -> rowNumber pertama
  const seenKodeInFile = new Map<string, number>(); // kode uppercase -> rowNumber pertama

  for (let idx = 0; idx < rawData.length; idx++) {
    const raw = rawData[idx];
    const rowNumber = idx + 2; // Baris 1 adalah header di spreadsheet

    // Petakan nilai berdasarkan header yang dinormalisasi
    const mapped: Partial<Record<keyof PerwakilanImportTemplateData, string>> = {};
    for (const [key, value] of Object.entries(raw)) {
      const normalizedKey = normalizeHeaderKey(key);
      if (normalizedKey && value !== undefined && value !== null) {
        mapped[normalizedKey] = String(value).trim();
      }
    }

    const rawNama = mapped.nama || "";
    const rawKode = mapped.kode || "";

    // Lewati baris kosong jika seluruh kolom tidak terisi
    if (!rawNama && !rawKode) {
      continue;
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validasi Nama Perwakilan
    if (!rawNama) {
      errors.push("Nama perwakilan wajib diisi.");
    } else if (rawNama.length < 2) {
      errors.push("Nama perwakilan minimal 2 karakter.");
    } else if (rawNama.length > 100) {
      errors.push("Nama perwakilan maksimal 100 karakter.");
    }

    const namaLower = rawNama.toLowerCase();
    if (rawNama) {
      // Cek apakah duplikat dalam file
      if (seenNamaInFile.has(namaLower)) {
        const prevRow = seenNamaInFile.get(namaLower);
        errors.push(`Nama perwakilan ganda di dalam file (sama dengan baris ${prevRow}).`);
      } else {
        seenNamaInFile.set(namaLower, rowNumber);
      }

      // Cek apakah sudah terdaftar di database
      if (existingNamaSet.has(namaLower)) {
        errors.push(`Perwakilan dengan nama "${rawNama}" sudah terdaftar di sistem.`);
      }
    }

    // 2. Validasi Kode Perwakilan (Opsional)
    let processedKode: string | null = null;
    if (rawKode) {
      const trimmedUpperKode = rawKode.toUpperCase();
      if (trimmedUpperKode.length > 10) {
        errors.push("Kode perwakilan maksimal 10 karakter.");
      } else {
        processedKode = trimmedUpperKode;

        // Cek duplikasi kode dalam file
        if (seenKodeInFile.has(trimmedUpperKode)) {
          const prevRow = seenKodeInFile.get(trimmedUpperKode);
          errors.push(`Kode perwakilan ganda di dalam file (sama dengan baris ${prevRow}).`);
        } else {
          seenKodeInFile.set(trimmedUpperKode, rowNumber);
        }

        // Cek apakah kode sudah terdaftar di database
        if (existingKodeSet.has(trimmedUpperKode)) {
          errors.push(`Kode perwakilan "${trimmedUpperKode}" sudah digunakan oleh cabang lain.`);
        }
      }
    }

    parsedRows.push({
      rowNumber,
      nama: rawNama,
      kode: processedKode,
      isValid: errors.length === 0,
      errors,
      warnings,
    });
  }

  return parsedRows;
}

/**
 * Membaca File (.xlsx, .xls, .csv) dari input file browser dan menghasilkan ParsedPerwakilanRow[].
 */
export async function parsePerwakilanImportFile(
  file: File,
  existingCabangList: Cabang[]
): Promise<ParsedPerwakilanRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array", raw: false });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("File tidak memiliki lembar kerja (worksheet).");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  return parseRawPerwakilanRows(jsonData, existingCabangList);
}
