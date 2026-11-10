import * as XLSX from "xlsx";
import { namaToEmail } from "@/lib/auth/nama-email";
import type { Cabang, Role } from "@/types/audit";

export interface ParsedUserRow {
  rowNumber: number;
  nama: string;
  email: string;
  role: Role;
  cabangNama?: string;
  cabangId?: number | null;
  password?: string;
  wajibGantiPassword: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UserImportTemplateData {
  nama: string;
  email: string;
  role: string;
  cabang: string;
  password: string;
  wajib_ganti_password: string;
}

export const TEMPLATE_COLUMNS = [
  "nama",
  "email",
  "role",
  "cabang",
  "password",
  "wajib_ganti_password",
] as const;

export const SAMPLE_TEMPLATE_ROWS: UserImportTemplateData[] = [
  {
    nama: "Jawa Timur",
    email: "jawa-timur@audit.bmh.or.id",
    role: "user",
    cabang: "Jawa Timur",
    password: "www.bmh.or.id",
    wajib_ganti_password: "ya",
  },
  {
    nama: "Jawa Barat",
    email: "jawa-barat@audit.bmh.or.id",
    role: "user",
    cabang: "Jawa Barat",
    password: "www.bmh.or.id",
    wajib_ganti_password: "ya",
  },
  {
    nama: "Auditor SIA Pusat",
    email: "auditor.pusat@audit.bmh.or.id",
    role: "admin",
    cabang: "",
    password: "www.bmh.or.id",
    wajib_ganti_password: "ya",
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
 * Download template data pengguna dalam format .csv (dengan UTF-8 BOM untuk kompatibilitas Excel).
 */
export function downloadUserImportTemplateCsv() {
  const header = TEMPLATE_COLUMNS.join(",");
  const rows = SAMPLE_TEMPLATE_ROWS.map((r) =>
    [
      `"${r.nama}"`,
      `"${r.email}"`,
      `"${r.role}"`,
      `"${r.cabang}"`,
      `"${r.password}"`,
      `"${r.wajib_ganti_password}"`,
    ].join(",")
  );

  const csvContent = "\uFEFF" + [header, ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerBrowserDownload(blob, "template_manajemen_pengguna.csv");
}

/**
 * Download template data pengguna dalam format .xlsx (Excel).
 */
export function downloadUserImportTemplateExcel() {
  const worksheetData = [
    [
      "nama",
      "email",
      "role",
      "cabang",
      "password",
      "wajib_ganti_password",
    ],
    ...SAMPLE_TEMPLATE_ROWS.map((r) => [
      r.nama,
      r.email,
      r.role,
      r.cabang,
      r.password,
      r.wajib_ganti_password,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Atur lebar kolom agar proporsional dan mudah dibaca
  worksheet["!cols"] = [
    { wch: 25 }, // nama
    { wch: 32 }, // email
    { wch: 12 }, // role
    { wch: 22 }, // cabang
    { wch: 18 }, // password
    { wch: 22 }, // wajib_ganti_password
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Pengguna");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerBrowserDownload(blob, "template_manajemen_pengguna.xlsx");
}

/**
 * Normalisasi header dari file (mendukung alias bahasa Indonesia & Inggris).
 */
function normalizeHeaderKey(key: string): keyof UserImportTemplateData | null {
  const clean = key.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();

  if (["nama", "namapengguna", "name", "username"].includes(clean)) return "nama";
  if (["email", "emaillogin", "surel"].includes(clean)) return "email";
  if (["role", "peran", "rolepengguna"].includes(clean)) return "role";
  if (["cabang", "namacabang", "perwakilan", "branch"].includes(clean)) return "cabang";
  if (["password", "katasandi", "pass"].includes(clean)) return "password";
  if (
    [
      "wajibgantipassword",
      "wajib_ganti_password",
      "gantipassword",
      "mustchangepassword",
      "resetpassword",
    ].includes(clean)
  ) {
    return "wajib_ganti_password";
  }

  return null;
}

/**
 * Validasi dan parse boolean dari string seperti "true", "ya", "1", "false", "tidak", "0".
 */
export function parseBooleanValue(val: unknown, defaultValue = true): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (!val || typeof val !== "string") return defaultValue;

  const clean = val.trim().toLowerCase();
  if (["true", "ya", "yes", "1", "y"].includes(clean)) return true;
  if (["false", "tidak", "no", "0", "t", "n"].includes(clean)) return false;
  return defaultValue;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parse raw rows data (array of objects atau array of arrays) menjadi ParsedUserRow[].
 */
export function parseRawUserRows(
  rawData: Array<Record<string, unknown>>,
  cabangList: Cabang[]
): ParsedUserRow[] {
  const parsedRows: ParsedUserRow[] = [];

  // Peta lookup cabang berdasarkan nama (case-insensitive) & kode
  const cabangByName = new Map<string, Cabang>();
  for (const c of cabangList) {
    cabangByName.set(c.nama.trim().toLowerCase(), c);
    if (c.kode) {
      cabangByName.set(c.kode.trim().toLowerCase(), c);
    }
  }

  for (let idx = 0; idx < rawData.length; idx++) {
    const raw = rawData[idx];
    const rowNumber = idx + 2; // Baris 1 adalah header di spreadsheet

    // Petakan nilai berdasarkan header yang dinormalisasi
    const mapped: Partial<Record<keyof UserImportTemplateData, string>> = {};
    for (const [key, value] of Object.entries(raw)) {
      const normalizedKey = normalizeHeaderKey(key);
      if (normalizedKey && value !== undefined && value !== null) {
        mapped[normalizedKey] = String(value).trim();
      }
    }

    const rawNama = mapped.nama || "";
    let rawEmail = mapped.email || "";
    const rawRole = (mapped.role || "").toLowerCase();
    const rawCabang = mapped.cabang || "";
    const rawPassword = mapped.password || "";
    const rawWajib = mapped.wajib_ganti_password;

    // Lewati baris kosong jika seluruh kolom tidak terisi
    if (!rawNama && !rawEmail && !rawRole && !rawCabang) {
      continue;
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validasi Nama
    if (!rawNama) {
      errors.push("Nama pengguna wajib diisi.");
    } else if (rawNama.length < 2) {
      errors.push("Nama pengguna minimal 2 karakter.");
    } else if (rawNama.length > 100) {
      errors.push("Nama pengguna maksimal 100 karakter.");
    }

    // 2. Tentukan Role
    let role: Role = "user";
    if (["admin", "auditor", "auditor sia", "superadmin"].includes(rawRole)) {
      role = "admin";
    } else if (["user", "cabang", "audite", "audite cabang", ""].includes(rawRole)) {
      role = "user";
    } else {
      errors.push(`Role "${rawRole}" tidak valid (gunakan 'admin' atau 'user').`);
    }

    // 3. Validasi & Normalisasi Email
    if (!rawEmail) {
      if (rawNama) {
        rawEmail = namaToEmail(rawNama);
      }
    } else {
      if (!EMAIL_REGEX.test(rawEmail)) {
        errors.push(`Format email "${rawEmail}" tidak valid.`);
      }
    }

    // 4. Hubungan dengan Cabang
    let cabangId: number | null = null;
    let cabangNama: string | undefined = undefined;

    if (role === "user") {
      const targetCabangName = rawCabang || rawNama;
      cabangNama = targetCabangName;
      const matched = cabangByName.get(targetCabangName.trim().toLowerCase());
      if (matched) {
        cabangId = matched.id;
      } else {
        warnings.push(`Cabang "${targetCabangName}" belum terdaftar. Cabang baru akan otomatis dibuat.`);
      }
    }

    // 5. Password & Wajib Ganti Password
    const password = rawPassword || "www.bmh.or.id";
    if (password.length < 6) {
      errors.push("Password minimal 6 karakter.");
    }
    const wajibGantiPassword = parseBooleanValue(rawWajib, true);

    parsedRows.push({
      rowNumber,
      nama: rawNama,
      email: rawEmail,
      role,
      cabangNama,
      cabangId,
      password,
      wajibGantiPassword,
      isValid: errors.length === 0,
      errors,
      warnings,
    });
  }

  return parsedRows;
}

/**
 * Membaca File (.xlsx, .xls, .csv) dari input file browser dan menghasilkan ParsedUserRow[].
 */
export async function parseUserImportFile(
  file: File,
  cabangList: Cabang[]
): Promise<ParsedUserRow[]> {
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

  return parseRawUserRows(jsonData, cabangList);
}
