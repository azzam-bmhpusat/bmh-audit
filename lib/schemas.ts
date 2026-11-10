import { z } from "zod";
import { isValidNamaCabang } from "@/lib/auth/nama-email";

/**
 * Nilai input string kosong diubah menjadi null sebelum validasi skema.
 */
function emptyStringToNull(val: unknown): unknown {
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  }
  return val;
}

// ---------------------------------------------------------------------
// 1. Skema Mutasi Audit
// ---------------------------------------------------------------------

export const skorSchema = z.number().int().min(1).max(5).nullable();

export const lampiranSchema = z.preprocess(
  emptyStringToNull,
  z.url({ protocol: /^https?$/ })
    .max(2048, "Tautan lampiran maksimal 2048 karakter")
    .nullable()
);

export const validasiSchema = z.boolean().nullable();

export const urutanSchema = z.coerce.number().int().min(1).max(5);

export const catatanSchema = z.preprocess(
  emptyStringToNull,
  z.string().max(1000, "Catatan maksimal 1000 karakter").nullable()
);

export const bobotSchema = z.number().int().min(1, "Bobot minimal 1").max(10, "Bobot maksimal 10");

export const itemNomorSchema = z.number().int().min(1, "Nomor item minimal 1");

// ---------------------------------------------------------------------
// 2. Skema Autentikasi & Akun
// ---------------------------------------------------------------------

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid (contoh: user@audit.bmh.or.id)"),
  password: z
    .string()
    .min(1, "Password wajib diisi"),
});

export const gantiPasswordSchema = z
  .object({
    passwordBaru: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .refine(
        (pw) => pw !== "www.bmh.or.id",
        "Password tidak boleh sama dengan password default www.bmh.or.id"
      ),
    konfirmasiPassword: z
      .string()
      .min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.passwordBaru === data.konfirmasiPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["konfirmasiPassword"],
  });

// ---------------------------------------------------------------------
// 2b. Skema Manajemen User (Role Admin)
// ---------------------------------------------------------------------

export const createUserSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid (contoh: daerah@audit.bmh.or.id)"),
  role: z.enum(["admin", "user"]),
  cabang_id: z.coerce.number().int().positive().nullable().optional(),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .default("www.bmh.or.id"),
  wajib_ganti_password: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  id: z.string().uuid("ID pengguna tidak valid"),
  nama: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid (contoh: daerah@audit.bmh.or.id)"),
  role: z.enum(["admin", "user"]),
  cabang_id: z.coerce.number().int().positive().nullable().optional(),
  wajib_ganti_password: z.boolean(),
});

export const resetUserPasswordSchema = z.object({
  id: z.string().uuid("ID pengguna tidak valid"),
  passwordBaru: z.string().min(6, "Password minimal 6 karakter").default("www.bmh.or.id"),
  wajib_ganti_password: z.boolean().default(true),
});

export const deleteUserSchema = z.object({
  id: z.string().uuid("ID pengguna tidak valid"),
});

// ---------------------------------------------------------------------
// 2c. Skema Manajemen Perwakilan / Cabang (Role Admin)
// ---------------------------------------------------------------------

export const createCabangSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(2, "Nama perwakilan minimal 2 karakter")
    .max(100, "Nama perwakilan maksimal 100 karakter"),
  kode: z
    .preprocess(
      emptyStringToNull,
      z
        .string()
        .trim()
        .max(10, "Kode perwakilan maksimal 10 karakter")
        .toUpperCase()
        .nullable()
        .optional()
    )
    .default(null),
});

export const updateCabangSchema = z.object({
  id: z.coerce.number().int().positive("ID perwakilan tidak valid"),
  nama: z
    .string()
    .trim()
    .min(2, "Nama perwakilan minimal 2 karakter")
    .max(100, "Nama perwakilan maksimal 100 karakter"),
  kode: z
    .preprocess(
      emptyStringToNull,
      z
        .string()
        .trim()
        .max(10, "Kode perwakilan maksimal 10 karakter")
        .toUpperCase()
        .nullable()
        .optional()
    )
    .default(null),
});

export const deleteCabangSchema = z.object({
  id: z.coerce.number().int().positive("ID perwakilan tidak valid"),
});

// ---------------------------------------------------------------------
// 3. Skema Parameter URL
// ---------------------------------------------------------------------

export const searchParamsSchema = z.object({
  cabang: z.coerce.number().int().positive().optional().catch(undefined),
  periode: z.coerce.number().int().positive().optional().catch(undefined),
});

// ---------------------------------------------------------------------
// 4. Skema Baris Supabase (Toleran terhadap string/numeric)
// ---------------------------------------------------------------------

export const matrixRowCabangSchema = z.object({
  periode_id: z.coerce.number().int(),
  cabang_id: z.coerce.number().int(),
  pilar_kode: z.string(),
  pilar_nama: z.string(),
  variabel_kode: z.string(),
  variabel_nama: z.string(),
  nomor: z.coerce.number().int(),
  pertanyaan: z.string(),
  regulasi_utama: z.string().nullable(),
  regulasi_tambahan: z.string().nullable(),
  ranah: z.string().nullable(),
  bobot: z.coerce.number().int(),
  lampiran_links: z.record(z.string(), z.string().nullable()).nullable().optional(),
  lampiran_link: z.string().nullable().default(null),
  skor_audite: z.coerce.number().int().nullable(),
  nilai_skor: z.coerce.number().nullable(),
});

export const matrixRowAdminSchema = matrixRowCabangSchema.extend({
  validasi: z.union([z.boolean(), z.record(z.string(), z.boolean().nullable())]).nullable().default(null),
  skor_auditor: z.coerce.number().int().nullable(),
  nilai_skor_auditor: z.coerce.number().nullable(),
  catatan: z.string().nullable(),
});

export const itemPoinSchema = z.object({
  item_nomor: z.coerce.number().int(),
  urutan: z.coerce.number().int().min(1).max(5),
  fokus_pemeriksaan: z.string(),
  bukti_evidence: z.string().nullable(),
  kriteria_skor: z.string(),
});
