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

export interface Cabang {
  id: number;
  kode: string | null;
  nama: string;
  created_at?: string;
}

export interface Periode {
  id: number;
  nama: string;
  is_open: boolean;
  created_at?: string;
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
  lampiran_link: string | null;
  skor_audite: number | null;
  nilai_skor: number | null;
}

/**
 * Baris pada view v_audit_matrix_admin.
 * Mewarisi semua kolom cabang ditambah kolom penilaian auditor.
 */
export interface MatrixRowAdmin extends MatrixRowCabang {
  validasi: boolean | null;
  skor_auditor: number | null;
  nilai_skor_auditor: number | null;
  catatan: string | null;
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
