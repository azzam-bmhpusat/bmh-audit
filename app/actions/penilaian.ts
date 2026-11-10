"use server";

import { createClient } from "@/lib/supabase/server";
import {
  catatanSchema,
  itemNomorSchema,
  skorSchema,
  validasiSchema,
} from "@/lib/schemas";
import { z } from "zod";

export interface SimpanPenilaianInput {
  periodeId: number;
  cabangId: number;
  itemNomor: number;
  field: "validasi" | "skor_auditor" | "catatan";
  value: boolean | number | string | null;
}

export type SimpanPenilaianResult =
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; error: string };

const savePenilaianInputSchema = z.object({
  periodeId: z.coerce.number().int().positive("ID periode harus valid"),
  cabangId: z.coerce.number().int().positive("ID cabang harus valid"),
  itemNomor: itemNomorSchema,
  field: z.enum(["validasi", "skor_auditor", "catatan"]),
});

/**
 * Server Action untuk menyimpan penilaian auditor (Validasi, Skor Auditor, atau Catatan).
 * Aturan Otorisasi:
 * 1. Pengguna wajib login dengan role 'admin'.
 * 2. ID cabang tervalidasi ada di tabel cabang.
 * 3. Nilai input divalidasi dengan Zod.
 * 4. Admin diizinkan menilai meskipun cabang belum mengisi atau periode sudah ditutup.
 * 5. Partial upsert hanya pada kolom yang berubah.
 */
export async function simpanPenilaian(
  input: SimpanPenilaianInput
): Promise<SimpanPenilaianResult> {
  // 1. Validasi struktur parameter dasar
  const baseParsed = savePenilaianInputSchema.safeParse({
    periodeId: input.periodeId,
    cabangId: input.cabangId,
    itemNomor: input.itemNomor,
    field: input.field,
  });

  if (!baseParsed.success) {
    const errorMsg =
      baseParsed.error.issues[0]?.message || "Parameter penilaian tidak valid";
    return { ok: false, error: errorMsg };
  }

  const { periodeId, cabangId, itemNomor, field } = baseParsed.data;

  // 2. Validasi nilai spesifik sesuai field
  let validatedValue: boolean | number | string | null = null;

  if (field === "validasi") {
    const parsedValidasi = validasiSchema.safeParse(input.value);
    if (!parsedValidasi.success) {
      return { ok: false, error: "Nilai validasi harus benar, tidak benar, atau belum" };
    }
    validatedValue = parsedValidasi.data;
  } else if (field === "skor_auditor") {
    const parsedSkor = skorSchema.safeParse(input.value);
    if (!parsedSkor.success) {
      return { ok: false, error: "Skor auditor harus berupa angka bulat 1–5 atau kosong" };
    }
    validatedValue = parsedSkor.data;
  } else if (field === "catatan") {
    const parsedCatatan = catatanSchema.safeParse(input.value);
    if (!parsedCatatan.success) {
      return { ok: false, error: "Catatan auditor maksimal 1000 karakter" };
    }
    validatedValue = parsedCatatan.data;
  }

  // 3. Autentikasi dan otorisasi role 'admin' di server
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Sesi telah berakhir. Silakan login kembali." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return {
      ok: false,
      error: "Hanya akun auditor (admin) yang berwenang memberikan penilaian.",
    };
  }

  // 4. Validasi keberadaan cabang di database
  const { data: cabang, error: cabangError } = await supabase
    .from("cabang")
    .select("id")
    .eq("id", cabangId)
    .maybeSingle();

  if (cabangError || !cabang) {
    return { ok: false, error: "Cabang yang dinilai tidak ditemukan." };
  }

  // 5. Susun payload partial upsert hanya untuk kolom yang berubah
  const payload: {
    periode_id: number;
    cabang_id: number;
    item_nomor: number;
    validasi?: boolean | null;
    skor_auditor?: number | null;
    catatan?: string | null;
  } = {
    periode_id: periodeId,
    cabang_id: cabangId,
    item_nomor: itemNomor,
  };

  if (field === "validasi") {
    payload.validasi = validatedValue as boolean | null;
  } else if (field === "skor_auditor") {
    payload.skor_auditor = validatedValue as number | null;
  } else if (field === "catatan") {
    payload.catatan = validatedValue as string | null;
  }

  // 6. Upsert ke tabel audit_penilaian_auditor
  const { data: upsertData, error: upsertError } = await supabase
    .from("audit_penilaian_auditor")
    .upsert(payload, { onConflict: "periode_id,cabang_id,item_nomor" })
    .select()
    .single();

  if (upsertError) {
    console.error("[PENILAIAN] Gagal upsert audit_penilaian_auditor:", upsertError.message);
    return { ok: false, error: "Gagal menyimpan penilaian ke database." };
  }

  return { ok: true, row: upsertData as Record<string, unknown> };
}
