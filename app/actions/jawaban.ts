"use server";

import { createClient } from "@/lib/supabase/server";
import { itemNomorSchema, lampiranSchema, skorSchema } from "@/lib/schemas";
import { z } from "zod";

export interface SimpanJawabanInput {
  periodeId: number;
  itemNomor: number;
  field: "skor_audite" | "lampiran_link";
  value: number | string | null;
}

export type SimpanJawabanResult =
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; error: string };

const saveInputSchema = z.object({
  periodeId: z.coerce.number().int().positive("ID periode harus valid"),
  itemNomor: itemNomorSchema,
  field: z.enum(["skor_audite", "lampiran_link"]),
});

/**
 * Server Action untuk menyimpan Skor Audite atau Lampiran Link secara terpisah (partial upsert).
 * Otorisasi ketat di server:
 * 1. Pengguna wajib login dengan role 'user' dan memiliki cabang_id.
 * 2. Periode audit wajib berstatus is_open = true.
 * 3. Nilai input divalidasi dengan Zod.
 * 4. Tanpa revalidatePath agar klien tidak me-render ulang seluruh pohon tabel.
 */
export async function simpanJawaban(
  input: SimpanJawabanInput
): Promise<SimpanJawabanResult> {
  // 1. Validasi struktur parameter dasar
  const baseParsed = saveInputSchema.safeParse({
    periodeId: input.periodeId,
    itemNomor: input.itemNomor,
    field: input.field,
  });

  if (!baseParsed.success) {
    const errorMsg =
      baseParsed.error.issues[0]?.message || "Parameter tidak valid";
    return { ok: false, error: errorMsg };
  }

  const { periodeId, itemNomor, field } = baseParsed.data;

  // 2. Validasi nilai field sesuai skema masing-masing
  let validatedValue: number | string | null = null;

  if (field === "skor_audite") {
    const parsedSkor = skorSchema.safeParse(input.value);
    if (!parsedSkor.success) {
      return { ok: false, error: "Skor harus berupa angka bulat 1–5 atau kosong" };
    }
    validatedValue = parsedSkor.data;
  } else if (field === "lampiran_link") {
    const parsedLink = lampiranSchema.safeParse(input.value);
    if (!parsedLink.success) {
      return {
        ok: false,
        error: "Tautan harus berupa URL http:// atau https:// valid (maks. 2048 karakter)",
      };
    }
    validatedValue = parsedLink.data;
  }

  // 3. Autentikasi dan otorisasi pengguna di server
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
    .select("role, cabang_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "user" || !profile.cabang_id) {
    return {
      ok: false,
      error: "Hanya akun cabang berwenang yang dapat mengisi instrumen audit.",
    };
  }

  // 4. Verifikasi status periode audit (wajib is_open)
  const { data: periode, error: periodeError } = await supabase
    .from("periode")
    .select("is_open")
    .eq("id", periodeId)
    .single();

  if (periodeError || !periode) {
    return { ok: false, error: "Periode audit tidak ditemukan." };
  }

  if (!periode.is_open) {
    return {
      ok: false,
      error: "Periode audit ini sudah ditutup. Isian tidak dapat diubah.",
    };
  }

  // 5. Susun payload upsert HANYA menyertakan kolom yang diubah (partial upsert)
  // Ini krusial agar pengubahan link tidak menghapus skor, dan sebaliknya.
  const payload: {
    periode_id: number;
    cabang_id: number;
    item_nomor: number;
    skor_audite?: number | null;
    lampiran_link?: string | null;
  } = {
    periode_id: periodeId,
    cabang_id: profile.cabang_id,
    item_nomor: itemNomor,
  };

  if (field === "skor_audite") {
    payload.skor_audite = validatedValue as number | null;
  } else if (field === "lampiran_link") {
    payload.lampiran_link = validatedValue as string | null;
  }

  // 6. Jalankan upsert dengan target onConflict (periode_id, cabang_id, item_nomor)
  const { data: upsertData, error: upsertError } = await supabase
    .from("audit_jawaban")
    .upsert(payload, { onConflict: "periode_id,cabang_id,item_nomor" })
    .select()
    .single();

  if (upsertError) {
    console.error("[JAWABAN] Gagal upsert audit_jawaban:", upsertError.message);
    return { ok: false, error: "Gagal menyimpan isian ke database." };
  }

  return { ok: true, row: upsertData as Record<string, unknown> };
}
