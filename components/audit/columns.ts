/**
 * components/audit/columns.ts
 * Konfigurasi kolom terpusat untuk mode "cabang" (10 kolom) dan "admin" (13 kolom).
 * Label kolom disesuaikan persis dengan dokumen Excel instrumen audit kepatuhan BMH.
 */

export interface ColumnDef {
  id: string;
  label: string;
  width?: string;
  minWidth?: string;
  isSubRow?: boolean;
  align?: "left" | "center" | "right";
  stickyLeft?: boolean;
}

export const COLUMNS_CABANG: ColumnDef[] = [
  { id: "no", label: "No", width: "w-14", minWidth: "min-w-[56px]", align: "center", stickyLeft: true },
  { id: "pertanyaan", label: "Pilar / Variabel / Indikator Pertanyaan Audit", minWidth: "min-w-[320px]" },
  { id: "regulasi", label: "Acuan Regulasi Utama & Acuan Tambahan", minWidth: "min-w-[260px]" },
  { id: "bobot", label: "Bobot", width: "w-20", minWidth: "min-w-[80px]", align: "right" },
  { id: "fokus", label: "Fokus Pemeriksaan Per-Item Pertanyaan (5 Poin)", minWidth: "min-w-[280px]", isSubRow: true },
  { id: "bukti", label: "5 Bukti Evidence yang Di-Submit", minWidth: "min-w-[280px]", isSubRow: true },
  { id: "lampiran", label: "Lampiran (Link Evidence)", minWidth: "min-w-[220px]", isSubRow: true },
  { id: "kriteria", label: "Kriteria Skor Penilaian (1–5)", minWidth: "min-w-[300px]", isSubRow: true },
  { id: "skor_audite", label: "Skor Audite", width: "w-28", minWidth: "min-w-[112px]", align: "center" },
  { id: "nilai_skor", label: "Nilai Skor", width: "w-24", minWidth: "min-w-[96px]", align: "right" },
];

export const COLUMNS_ADMIN: ColumnDef[] = [
  { id: "no", label: "No", width: "w-14", minWidth: "min-w-[56px]", align: "center", stickyLeft: true },
  { id: "pertanyaan", label: "Pilar / Variabel / Indikator Pertanyaan Audit", minWidth: "min-w-[320px]" },
  { id: "regulasi", label: "Acuan Regulasi Utama & Acuan Tambahan", minWidth: "min-w-[260px]" },
  { id: "bobot", label: "Bobot", width: "w-20", minWidth: "min-w-[80px]", align: "right" },
  { id: "fokus", label: "Fokus Pemeriksaan Per-Item Pertanyaan (5 Poin)", minWidth: "min-w-[280px]", isSubRow: true },
  { id: "bukti", label: "5 Bukti Evidence yang Di-Submit", minWidth: "min-w-[280px]", isSubRow: true },
  { id: "lampiran", label: "Lampiran (Link Evidence)", minWidth: "min-w-[220px]", isSubRow: true },
  { id: "validasi", label: "Validasi", width: "w-32", minWidth: "min-w-[124px]", align: "center", isSubRow: true },
  { id: "kriteria", label: "Kriteria Skor Penilaian (1–5)", minWidth: "min-w-[300px]", isSubRow: true },
  { id: "skor_audite", label: "Skor Audite", width: "w-28", minWidth: "min-w-[112px]", align: "center" },
  { id: "nilai_skor", label: "Nilai Skor", width: "w-24", minWidth: "min-w-[96px]", align: "right" },
  { id: "skor_auditor", label: "Skor Auditor", width: "w-28", minWidth: "min-w-[112px]", align: "center" },
  { id: "nilai_skor_auditor", label: "Nilai Skor Auditor", width: "w-28", minWidth: "min-w-[112px]", align: "right" },
];

export function getColumns(mode: "cabang" | "admin"): ColumnDef[] {
  return mode === "admin" ? COLUMNS_ADMIN : COLUMNS_CABANG;
}
