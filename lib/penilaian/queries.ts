import { createClient } from "@/lib/supabase/server";
import {
  auditPredikatSchema,
  itemPoinSchema,
  matrixRowAdminSchema,
  matrixRowCabangSchema,
  penilaianAdminSchema,
  penilaianCabangSchema,
} from "@/lib/schemas";
import type {
  AuditPredikat,
  ItemPoin,
  MatrixRowAdmin,
  MatrixRowCabang,
  PenilaianAdmin,
  PenilaianCabang,
} from "@/types/audit";
import { z } from "zod";

/**
 * Mengambil tabel standar predikat audit kepatuhan (v_audit_predikat).
 * Diurutkan A -> E (berdasarkan batas_bawah menurun).
 */
export async function getPredikat(): Promise<AuditPredikat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_audit_predikat")
    .select("*")
    .order("batas_bawah", { ascending: false });

  if (error) {
    console.error("[getPredikat] Gagal memuat v_audit_predikat:", error.message);
    throw new Error("Gagal memuat standar predikat audit.");
  }

  return z.array(auditPredikatSchema).parse(data ?? []) as AuditPredikat[];
}

/**
 * Mengambil rekapitulasi penilaian lembaga untuk role user cabang (v_penilaian_cabang).
 * Berdasarkan RLS, user hanya akan mendapatkan baris cabangnya sendiri.
 */
export async function getPenilaianCabang(
  periodeId: number
): Promise<PenilaianCabang | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_penilaian_cabang")
    .select("*")
    .eq("periode_id", periodeId)
    .maybeSingle();

  if (error) {
    console.error("[getPenilaianCabang] Gagal memuat v_penilaian_cabang:", error.message);
    throw new Error("Gagal memuat rekapitulasi penilaian cabang.");
  }

  if (!data) return null;
  return penilaianCabangSchema.parse(data) as PenilaianCabang;
}

/**
 * Mengambil rekapitulasi penilaian auditor (v_penilaian_admin).
 * - Jika cabangId disertakan: mengembalikan 1 baris cabang spesifik.
 * - Jika cabangId tidak disertakan: mengembalikan daftar semua cabang per periode.
 */
export async function getPenilaianAdmin(
  periodeId: number,
  cabangId?: number
): Promise<PenilaianAdmin | PenilaianAdmin[] | null> {
  const supabase = await createClient();
  const query = supabase.from("v_penilaian_admin").select("*").eq("periode_id", periodeId);

  if (cabangId) {
    const { data, error } = await query.eq("cabang_id", cabangId).maybeSingle();
    if (error) {
      console.warn("[getPenilaianAdmin] Catatan memuat penilaian cabang:", error.message);
      return null;
    }
    if (!data) return null;
    return penilaianAdminSchema.parse(data) as PenilaianAdmin;
  }

  const { data, error } = await query.order("entitas_audit");
  if (error) {
    console.error("[getPenilaianAdmin] Gagal memuat daftar admin:", error.message);
    throw new Error("Gagal memuat daftar penilaian perwakilan.");
  }

  return z.array(penilaianAdminSchema).parse(data ?? []) as PenilaianAdmin[];
}

/**
 * Mengambil matriks instrumen untuk user cabang (v_audit_matrix_cabang).
 * Data dibatasi oleh RLS untuk cabang yang bersangkutan.
 */
export async function getMatrixCabang(
  periodeId: number
): Promise<MatrixRowCabang[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_audit_matrix_cabang")
    .select("*")
    .eq("periode_id", periodeId)
    .order("nomor");

  if (error) {
    console.error("[getMatrixCabang] Gagal memuat v_audit_matrix_cabang:", error.message);
    throw new Error("Gagal memuat matriks audit cabang.");
  }

  return z.array(matrixRowCabangSchema).parse(data ?? []) as MatrixRowCabang[];
}

/**
 * Mengambil matriks instrumen lengkap dengan kolom auditor (v_audit_matrix_admin).
 * Hanya dapat diakses oleh admin (didukung filter where is_admin() di view).
 */
export async function getMatrixAdmin(
  periodeId: number,
  cabangId: number
): Promise<MatrixRowAdmin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_audit_matrix_admin")
    .select("*")
    .eq("periode_id", periodeId)
    .eq("cabang_id", cabangId)
    .order("nomor");

  if (error) {
    console.error("[getMatrixAdmin] Gagal memuat v_audit_matrix_admin:", error.message);
    throw new Error("Gagal memuat matriks review auditor.");
  }

  return z.array(matrixRowAdminSchema).parse(data ?? []) as MatrixRowAdmin[];
}

/**
 * Mengambil rincian 5 poin per item pertanyaan (v_audit_item_poin).
 */
export async function getItemPoinList(): Promise<ItemPoin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_audit_item_poin")
    .select("*")
    .order("item_nomor")
    .order("urutan");

  if (error) {
    console.error("[getItemPoinList] Gagal memuat v_audit_item_poin:", error.message);
    throw new Error("Gagal memuat poin indikator audit.");
  }

  return z.array(itemPoinSchema).parse(data ?? []) as ItemPoin[];
}
