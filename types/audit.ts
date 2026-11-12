/**
 * types/audit.ts
 * Definisi tipe data statis sistem BMH Audit.
 * Ditulis manual sesuai kolom view database (PRD §5.1) tanpa menggunakan `any`.
 */

export type Role = "admin" | "user";

export interface Profile {
  id: string;
  nama: string | null;
  role: Role;
  cabang_id: number | null;
  wajib_ganti_password: boolean;
  created_at?: string;
}

export interface UserListItem extends Profile {
  email?: string | null;
  cabang?: {
    id: number;
    nama: string;
  } | null;
}

export interface Cabang {
  id: number;
  kode: string | null;
  nama: string;
  created_at?: string;
}

export interface CabangDetailListItem extends Cabang {
  userCount?: number;
  userNames?: string[];
  jawabanCount?: number;
}

export interface Periode {
  id: number;
  nama: string;
  is_open: boolean;
  created_at?: string;
}

export interface PeriodeDetailListItem extends Periode {
  jawabanCount?: number;
  penilaianCount?: number;
}

export interface ItemPoin {
  item_nomor: number;
  urutan: number;
  fokus_pemeriksaan: string;
  bukti_evidence: string | null;
  kriteria_skor: string;
}

/**
 * Baris pada view v_audit_matrix_cabang (15 kolom).
 * Mengembalikan data matriks pertanyaan, regulasi, bobot, serta isian mandiri cabang.
 */
export interface MatrixRowCabang {
  periode_id: number;
  cabang_id: number;
  pilar_kode: string;
  pilar_nama: string;
  variabel_kode: string;
  variabel_nama: string;
  nomor: number;
  pertanyaan: string;
  regulasi_utama: string | null;
  regulasi_tambahan: string | null;
  ranah: string | null;
  bobot: number;
  lampiran_links?: Record<string, string | null> | null;
  lampiran_link: string | null;
  skor_audite: number | null;
  nilai_skor: number | null;
  catatan?: string | null;
}

/**
 * Baris pada view v_audit_matrix_admin.
 * Mewarisi semua kolom cabang ditambah kolom penilaian auditor.
 */
export interface MatrixRowAdmin extends MatrixRowCabang {
  validasi: Record<string, boolean | null> | boolean | null;
  skor_auditor: number | null;
  nilai_skor_auditor: number | null;
  catatan: string | null;
}

/**
 * Helper untuk mengambil link lampiran pada urutan tertentu (1..5)
 * dengan fallback ke lampiran_link jika urutan 1.
 */
export function getLampiranLink(
  row: MatrixRowCabang,
  urutan: number
): string | null {
  const fromMap = row.lampiran_links?.[String(urutan)] ?? row.lampiran_links?.[urutan];
  if (fromMap !== undefined && fromMap !== null && fromMap !== "") {
    return fromMap;
  }
  if (urutan === 1 && row.lampiran_link) {
    return row.lampiran_link;
  }
  return null;
}

/**
 * Helper untuk mengambil status validasi pada urutan tertentu (1..5).
 */
export function getValidasiStatus(
  row: MatrixRowAdmin | null | undefined,
  urutan: number
): boolean | null {
  if (!row) return null;
  if (typeof row.validasi === "boolean") {
    return urutan === 1 ? row.validasi : null;
  }
  if (row.validasi && typeof row.validasi === "object") {
    const val = row.validasi[String(urutan)] ?? row.validasi[urutan];
    return typeof val === "boolean" ? val : null;
  }
  return null;
}

/**
 * Agregat total pada view v_audit_total_admin.
 */
export interface TotalAdmin {
  periode_id: number;
  cabang_id: number;
  total_bobot: number;
  skor_maksimum_ideal: number;
  total_nilai_skor_audite: number;
  total_nilai_skor_auditor: number;
  persen_auditor: number;
  persen_audite: number;
  item_terisi_audite: number;
  item_dinilai_auditor: number;
  total_item: number;
}

/**
 * Master standar predikat hasil audit (view v_audit_predikat).
 */
export interface AuditPredikat {
  nilai: "A" | "B" | "C" | "D" | "E" | string;
  predikat: string;
  status_kepatuhan: string;
  keterangan: string;
  wajib_ptk: boolean;
  batas_bawah: number;
  batas_atas: number;
  rentang_teks: string;
}

/**
 * Rekapitulasi penilaian lembaga untuk role user cabang (view v_penilaian_cabang).
 */
export interface PenilaianCabang {
  periode_id: number;
  cabang_id: number;
  nama_lembaga: string;
  entitas_audit: string;
  periode_audit: string;
  jumlah_indikator: number;
  total_bobot: number;
  skor_maksimum_ideal: number;
  jumlah_butir_terisi: number;
  jumlah_butir_belum_terisi: number;
  jumlah_butir_terisi_teks: string;
  persen_kelengkapan: number;
  jumlah_butir_berlampiran: number;
  total_nilai_skor: number;
  nilai_akhir: number;
  nilai_kepatuhan: string;
  predikat_kepatuhan: string;
  status_kepatuhan: string;
  wajib_ptk: boolean;
  keterangan_tindak_lanjut: string;
}

/**
 * Rekapitulasi penilaian untuk role admin auditor (view v_penilaian_admin).
 */
export interface PenilaianAdmin {
  periode_id: number;
  cabang_id: number;
  nama_lembaga: string;
  entitas_audit: string;
  periode_audit: string;
  jumlah_indikator: number;
  total_bobot: number;
  skor_maksimum_ideal: number;

  // Blok 1: Isian Cabang (Audite)
  jumlah_butir_terisi: number;
  jumlah_butir_belum_terisi: number;
  jumlah_butir_terisi_teks: string;
  persen_kelengkapan: number;
  jumlah_butir_berlampiran: number;
  jumlah_bukti_diunggah: number;
  total_nilai_skor_audite: number;
  nilai_akhir_audite: number;
  nilai_kepatuhan_audite: string;
  predikat_kepatuhan_audite: string;
  status_kepatuhan_audite: string;

  // Blok 2: Sudah Di Audit (Auditor)
  status_audit: "Belum Diaudit" | "Sedang Diaudit" | "Sudah Diaudit" | string;
  jumlah_butir_diaudit: number;
  jumlah_butir_diaudit_teks: string;
  jumlah_terisi_belum_diaudit: number;
  jumlah_bukti_tervalidasi: number;
  total_nilai_skor_auditor: number;
  nilai_akhir_auditor: number;
  nilai_kepatuhan_auditor: string;
  predikat_kepatuhan_auditor: string;
  status_kepatuhan_auditor: string;
  wajib_ptk_auditor: boolean;
  keterangan_tindak_lanjut: string;

  // Selisih
  selisih_skor: number;
  selisih_nilai_akhir: number;
}

/**
 * Struktur hierarkis matriks (Pilar -> Variabel -> Item + Poin).
 */
export type ItemWithPoin<T extends MatrixRowCabang = MatrixRowCabang> = T & {
  poin: ItemPoin[];
};

export interface VariabelGroup<T extends MatrixRowCabang = MatrixRowCabang> {
  kode: string;
  nama: string;
  items: ItemWithPoin<T>[];
  totalBobot: number;
  totalNilaiSkor: number;
  totalNilaiSkorAuditor: number | null;
  itemTerisi: number;
  totalItem: number;
}

export interface PilarGroup<T extends MatrixRowCabang = MatrixRowCabang> {
  kode: string;
  nama: string;
  variabelList: VariabelGroup<T>[];
  totalBobot: number;
  totalNilaiSkor: number;
  totalNilaiSkorAuditor: number | null;
}

export interface MatrixTree<T extends MatrixRowCabang = MatrixRowCabang> {
  pilarList: PilarGroup<T>[];
  totalBobot: number;
  totalNilaiSkor: number;
  totalNilaiSkorAuditor: number | null;
  itemTerisi: number;
  totalItem: number;
  skorMaksimumIdeal: number;
  persenAudite: number;
  persenAuditor: number | null;
}
