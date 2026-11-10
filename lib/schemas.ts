import { z } from "zod";

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

// ---------------------------------------------------------------------
// 5. Skema Penilaian & Predikat (View v_audit_predikat & v_penilaian_*)
// ---------------------------------------------------------------------

export const auditPredikatSchema = z.object({
  nilai: z.string(),
  predikat: z.string(),
  status_kepatuhan: z.string(),
  keterangan: z.string(),
  wajib_ptk: z.boolean(),
  batas_bawah: z.coerce.number(),
  batas_atas: z.coerce.number(),
  rentang_teks: z.string(),
});

export const penilaianCabangSchema = z.object({
  periode_id: z.coerce.number().int(),
  cabang_id: z.coerce.number().int(),
  nama_lembaga: z.string(),
  entitas_audit: z.string(),
  periode_audit: z.string(),
  jumlah_indikator: z.coerce.number().int(),
  total_bobot: z.coerce.number().int(),
  skor_maksimum_ideal: z.coerce.number().int(),
  jumlah_butir_terisi: z.coerce.number().int(),
  jumlah_butir_belum_terisi: z.coerce.number().int(),
  jumlah_butir_terisi_teks: z.string(),
  persen_kelengkapan: z.coerce.number(),
  jumlah_butir_berlampiran: z.coerce.number().int(),
  total_nilai_skor: z.coerce.number(),
  nilai_akhir: z.coerce.number(),
  nilai_kepatuhan: z.string(),
  predikat_kepatuhan: z.string(),
  status_kepatuhan: z.string(),
  wajib_ptk: z.boolean(),
  keterangan_tindak_lanjut: z.string(),
});

export const penilaianAdminSchema = z.object({
  periode_id: z.coerce.number().int(),
  cabang_id: z.coerce.number().int(),
  nama_lembaga: z.string(),
  entitas_audit: z.string(),
  periode_audit: z.string(),
  jumlah_indikator: z.coerce.number().int(),
  total_bobot: z.coerce.number().int(),
  skor_maksimum_ideal: z.coerce.number().int(),

  // Blok 1: Isian Cabang (Audite)
  jumlah_butir_terisi: z.coerce.number().int(),
  jumlah_butir_belum_terisi: z.coerce.number().int(),
  jumlah_butir_terisi_teks: z.string(),
  persen_kelengkapan: z.coerce.number(),
  jumlah_butir_berlampiran: z.coerce.number().int(),
  jumlah_bukti_diunggah: z.coerce.number().int(),
  total_nilai_skor_audite: z.coerce.number(),
  nilai_akhir_audite: z.coerce.number(),
  nilai_kepatuhan_audite: z.string(),
  predikat_kepatuhan_audite: z.string(),
  status_kepatuhan_audite: z.string(),

  // Blok 2: Sudah Di Audit (Auditor)
  status_audit: z.string(),
  jumlah_butir_diaudit: z.coerce.number().int(),
  jumlah_butir_diaudit_teks: z.string(),
  jumlah_terisi_belum_diaudit: z.coerce.number().int(),
  jumlah_bukti_tervalidasi: z.coerce.number().int(),
  total_nilai_skor_auditor: z.coerce.number(),
  nilai_akhir_auditor: z.coerce.number(),
  nilai_kepatuhan_auditor: z.string(),
  predikat_kepatuhan_auditor: z.string(),
  status_kepatuhan_auditor: z.string(),
  wajib_ptk_auditor: z.boolean(),
  keterangan_tindak_lanjut: z.string(),

  // Selisih
  selisih_skor: z.coerce.number(),
  selisih_nilai_akhir: z.coerce.number(),
});

export const savePenilaianAuditorSchema = z.object({
  periodeId: z.coerce.number().int().positive("ID periode harus valid"),
  cabangId: z.coerce.number().int().positive("ID cabang harus valid"),
  itemNomor: itemNomorSchema,
  skorAuditor: skorSchema.optional(),
  validasi: z.record(z.enum(["1", "2", "3", "4", "5"]), z.boolean()).optional(),
  catatan: catatanSchema.optional(),
  clientUpdatedAt: z.string().optional(),
});

// ---------------------------------------------------------------------
// 6. Skema Manajemen Periode & Pengaturan
// ---------------------------------------------------------------------

export const createPeriodeSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(3, "Nama periode minimal 3 karakter")
    .max(100, "Nama periode maksimal 100 karakter"),
  is_open: z.boolean().default(true),
  setAsOnlyActive: z.boolean().default(false),
});

export const updatePeriodeSchema = z.object({
  id: z.coerce.number().int().positive("ID periode harus valid"),
  nama: z
    .string()
    .trim()
    .min(3, "Nama periode minimal 3 karakter")
    .max(100, "Nama periode maksimal 100 karakter"),
  is_open: z.boolean().default(true),
  setAsOnlyActive: z.boolean().default(false),
});

export const togglePeriodeStatusSchema = z.object({
  id: z.coerce.number().int().positive("ID periode harus valid"),
  is_open: z.boolean(),
  setAsOnlyActive: z.boolean().default(false),
});

export const deletePeriodeSchema = z.object({
  id: z.coerce.number().int().positive("ID periode harus valid"),
});

