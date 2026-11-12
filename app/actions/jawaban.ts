"use server";

import { createClient } from "@/lib/supabase/server";
import { itemNomorSchema, lampiranSchema, skorSchema } from "@/lib/schemas";
import { z } from "zod";

export interface SimpanJawabanInput {
  periodeId: number;
  itemNomor: number;
  field: "skor_audite" | "lampiran_link";
  urutan?: number;
  value: number | string | null;
}

export type SimpanJawabanResult =
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; error: string };

const saveInputSchema = z.object({
  periodeId: z.coerce.number().int().positive("ID periode harus valid"),
  itemNomor: itemNomorSchema,
  field: z.enum(["skor_audite", "lampiran_link"]),
  urutan: z.coerce.number().int().min(1).max(5).optional(),
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
    urutan: input.urutan,
  });

  if (!baseParsed.success) {
    const errorMsg =
      baseParsed.error.issues[0]?.message || "Parameter tidak valid";
    return { ok: false, error: errorMsg };
  }

  const { periodeId, itemNomor, field, urutan } = baseParsed.data;

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

  // 4b. Verifikasi status kunci form cabang (apakah dikunci oleh auditor)
  const { data: statusCabang } = await supabase
    .from("audit_status_cabang")
    .select("is_locked")
    .eq("periode_id", periodeId)
    .eq("cabang_id", profile.cabang_id)
    .maybeSingle();

  if (statusCabang?.is_locked) {
    return {
      ok: false,
      error:
        "Form audit untuk cabang Anda telah dikunci oleh Auditor SIA. Isian tidak dapat diubah.",
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
    lampiran_links?: Record<string, string | null>;
  } = {
    periode_id: periodeId,
    cabang_id: profile.cabang_id,
    item_nomor: itemNomor,
  };

  if (field === "skor_audite") {
    payload.skor_audite = validatedValue as number | null;
  } else if (field === "lampiran_link") {
    if (urutan) {
      // Ambil lampiran_links yang sudah ada agar tidak menimpa tautan urutan bukti lain
      const { data: existingRow } = await supabase
        .from("audit_jawaban")
        .select("lampiran_links, lampiran_link")
        .eq("periode_id", periodeId)
        .eq("cabang_id", profile.cabang_id)
        .eq("item_nomor", itemNomor)
        .maybeSingle();

      const existingMap: Record<string, string | null> =
        (existingRow?.lampiran_links as Record<string, string | null>) ?? {};

      if (existingRow?.lampiran_link && !existingMap["1"]) {
        existingMap["1"] = existingRow.lampiran_link;
      }

      const nextMap = { ...existingMap };
      if (validatedValue) {
        nextMap[String(urutan)] = validatedValue as string;
      } else {
        delete nextMap[String(urutan)];
      }

      payload.lampiran_links = nextMap;
      if (urutan === 1) {
        payload.lampiran_link = (validatedValue as string | null) ?? null;
      }
    } else {
      payload.lampiran_link = validatedValue as string | null;
    }
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

export interface ImportJawabanItemPayload {
  itemNomor: number;
  skorAudite: number | null;
  lampiranLinks: Record<string, string>;
}

export interface ImportJawabanBatchInput {
  periodeId: number;
  items: ImportJawabanItemPayload[];
}

export type ImportJawabanBatchResult =
  | {
      ok: true;
      count: number;
      message: string;
      importedRows: {
        itemNomor: number;
        skorAudite: number | null;
        lampiranLinks: Record<string, string | null>;
      }[];
    }
  | { ok: false; error: string };

/**
 * Server Action untuk mengimpor jawaban audit dari Excel secara massal (batch upsert).
 * HANYA mengimpor:
 * 1. Lampiran (Link Evidence) per-urutan poin 1..5
 * 2. Skor Audite (1–5)
 * Kolom lain sama sekali tidak diubah.
 */
export async function importJawabanBatch(
  input: ImportJawabanBatchInput
): Promise<ImportJawabanBatchResult> {
  const { periodeId, items } = input;

  if (!periodeId || !Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Data impor tidak boleh kosong." };
  }

  // 1. Autentikasi dan otorisasi pengguna di server
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
      error: "Hanya akun perwakilan/cabang yang berwenang mengimpor jawaban audit.",
    };
  }

  // 2. Verifikasi status periode audit (wajib is_open = true)
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

  // 3. Verifikasi status kunci form cabang (apakah dikunci oleh auditor)
  const { data: statusCabang } = await supabase
    .from("audit_status_cabang")
    .select("is_locked")
    .eq("periode_id", periodeId)
    .eq("cabang_id", profile.cabang_id)
    .maybeSingle();

  if (statusCabang?.is_locked) {
    return {
      ok: false,
      error:
        "Form audit untuk cabang Anda telah dikunci oleh Auditor SIA. Isian tidak dapat diubah.",
    };
  }

  // 4. Ambil seluruh data jawaban yang sudah ada untuk cabang & periode ini
  const { data: existingRows, error: existingError } = await supabase
    .from("audit_jawaban")
    .select("item_nomor, skor_audite, lampiran_links, lampiran_link")
    .eq("periode_id", periodeId)
    .eq("cabang_id", profile.cabang_id);

  if (existingError) {
    console.error("[JAWABAN] Gagal mengambil jawaban eksisting:", existingError.message);
    return { ok: false, error: "Gagal memproses data jawaban eksisting." };
  }

  const existingMap = new Map<
    number,
    {
      skor_audite: number | null;
      lampiran_links: Record<string, string | null>;
      lampiran_link: string | null;
    }
  >();

  for (const row of existingRows ?? []) {
    existingMap.set(row.item_nomor, {
      skor_audite: row.skor_audite ?? null,
      lampiran_links: (row.lampiran_links as Record<string, string | null>) ?? {},
      lampiran_link: row.lampiran_link ?? null,
    });
  }

  // 5. Susun batch payload upsert HANYA kolom skor_audite dan lampiran_links/lampiran_link
  const batchPayloads: {
    periode_id: number;
    cabang_id: number;
    item_nomor: number;
    skor_audite: number | null;
    lampiran_links: Record<string, string | null>;
    lampiran_link: string | null;
    updated_by: string;
    updated_at: string;
  }[] = [];

  const importedRowsResult: {
    itemNomor: number;
    skorAudite: number | null;
    lampiranLinks: Record<string, string | null>;
  }[] = [];

  const nowIso = new Date().toISOString();

  for (const item of items) {
    if (!item.itemNomor || item.itemNomor < 1) continue;

    const existing = existingMap.get(item.itemNomor);
    const mergedLinks = { ...(existing?.lampiran_links ?? {}) };

    // Gabungkan link bukti baru dari Excel dengan validasi skema URL
    if (item.lampiranLinks && typeof item.lampiranLinks === "object") {
      for (const [seq, url] of Object.entries(item.lampiranLinks)) {
        const seqNum = Number(seq);
        if (seqNum >= 1 && seqNum <= 5 && typeof url === "string" && url.trim()) {
          const parsed = lampiranSchema.safeParse(url.trim());
          if (parsed.success && parsed.data) {
            mergedLinks[String(seqNum)] = parsed.data;
          }
        }
      }
    }

    // Skor audite diutamakan dari Excel jika valid (1-5), atau pertahankan yang lama
    let finalSkor: number | null = existing?.skor_audite ?? null;
    if (
      typeof item.skorAudite === "number" &&
      item.skorAudite >= 1 &&
      item.skorAudite <= 5
    ) {
      finalSkor = item.skorAudite;
    }

    const finalLampiranLink = mergedLinks["1"] ?? existing?.lampiran_link ?? null;

    batchPayloads.push({
      periode_id: periodeId,
      cabang_id: profile.cabang_id,
      item_nomor: item.itemNomor,
      skor_audite: finalSkor,
      lampiran_links: mergedLinks,
      lampiran_link: finalLampiranLink,
      updated_by: user.id,
      updated_at: nowIso,
    });

    importedRowsResult.push({
      itemNomor: item.itemNomor,
      skorAudite: finalSkor,
      lampiranLinks: mergedLinks,
    });
  }

  if (batchPayloads.length === 0) {
    return { ok: false, error: "Tidak ada baris data valid yang dapat disimpan." };
  }

  // 6. Jalankan batch upsert secara atomik
  const { error: upsertError } = await supabase
    .from("audit_jawaban")
    .upsert(batchPayloads, {
      onConflict: "periode_id,cabang_id,item_nomor",
    });

  if (upsertError) {
    console.error("[JAWABAN] Gagal batch upsert audit_jawaban:", upsertError.message);
    return { ok: false, error: "Gagal menyimpan isian massal ke database." };
  }

  return {
    ok: true,
    count: batchPayloads.length,
    message: `Berhasil mengimpor jawaban untuk ${batchPayloads.length} butir instrumen audit.`,
    importedRows: importedRowsResult,
  };
}
