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
  urutan?: number;
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
  urutan: z.coerce.number().int().min(1).max(5).optional(),
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
    urutan: input.urutan,
  });

  if (!baseParsed.success) {
    const errorMsg =
      baseParsed.error.issues[0]?.message || "Parameter penilaian tidak valid";
    return { ok: false, error: errorMsg };
  }

  const { periodeId, cabangId, itemNomor, field, urutan } = baseParsed.data;

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
    validasi?: Record<string, boolean | null> | boolean | null;
    skor_auditor?: number | null;
    catatan?: string | null;
  } = {
    periode_id: periodeId,
    cabang_id: cabangId,
    item_nomor: itemNomor,
  };

  if (field === "validasi") {
    if (urutan) {
      // Ambil validasi yang sudah ada agar tidak menimpa status validasi urutan bukti lain
      const { data: existingRow } = await supabase
        .from("audit_penilaian_auditor")
        .select("validasi")
        .eq("periode_id", periodeId)
        .eq("cabang_id", cabangId)
        .eq("item_nomor", itemNomor)
        .maybeSingle();

      let currentMap: Record<string, boolean | null> = {};
      if (typeof existingRow?.validasi === "boolean") {
        currentMap["1"] = existingRow.validasi;
      } else if (existingRow?.validasi && typeof existingRow.validasi === "object") {
        currentMap = { ...(existingRow.validasi as Record<string, boolean | null>) };
      }

      currentMap[String(urutan)] = validatedValue as boolean | null;
      payload.validasi = currentMap;
    } else {
      payload.validasi = validatedValue as boolean | null;
    }
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

export interface SavePenilaianAuditorInput {
  periodeId: number;
  cabangId: number;
  itemNomor: number;
  skorAuditor?: number | null;
  validasi?: Record<string, boolean>;
  catatan?: string | null;
  clientUpdatedAt?: string;
}

export type SavePenilaianAuditorResult =
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; error: string; conflict?: boolean };

/**
 * Server Action komprehensif untuk menyimpan penilaian auditor per butir:
 * - Skor Auditor (1-5 atau null)
 * - Validasi 5 bukti (objek jsonb dengan kunci "1".."5")
 * - Catatan auditor
 * - Deteksi konflik konkuren (optimistic locking berdasarkan updated_at)
 */
export async function savePenilaianAuditor(
  input: SavePenilaianAuditorInput
): Promise<SavePenilaianAuditorResult> {
  const supabase = await createClient();

  // 1. Verifikasi autentikasi & role admin
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

  // 2. Validasi input
  if (input.skorAuditor !== undefined && input.skorAuditor !== null) {
    if (input.skorAuditor < 1 || input.skorAuditor > 5) {
      return { ok: false, error: "Skor auditor harus berada dalam rentang 1–5." };
    }
  }

  if (input.catatan && input.catatan.length > 1000) {
    return { ok: false, error: "Catatan auditor maksimal 1000 karakter." };
  }

  // 3. Deteksi konflik konkuren jika clientUpdatedAt disertakan
  const { data: existingRow } = await supabase
    .from("audit_penilaian_auditor")
    .select("updated_at, validasi, skor_auditor, catatan")
    .eq("periode_id", input.periodeId)
    .eq("cabang_id", input.cabangId)
    .eq("item_nomor", input.itemNomor)
    .maybeSingle();

  if (existingRow?.updated_at && input.clientUpdatedAt) {
    const serverTime = new Date(existingRow.updated_at).getTime();
    const clientTime = new Date(input.clientUpdatedAt).getTime();
    if (serverTime > clientTime) {
      return {
        ok: false,
        conflict: true,
        error:
          "Penilaian butir ini telah diubah oleh auditor lain. Halaman akan diperbarui.",
      };
    }
  }

  // 4. Susun payload upsert
  const payload: {
    periode_id: number;
    cabang_id: number;
    item_nomor: number;
    skor_auditor?: number | null;
    validasi?: Record<string, boolean>;
    catatan?: string | null;
  } = {
    periode_id: input.periodeId,
    cabang_id: input.cabangId,
    item_nomor: input.itemNomor,
  };

  if (input.skorAuditor !== undefined) {
    payload.skor_auditor = input.skorAuditor;
  }

  if (input.validasi !== undefined) {
    // Sanitasi kunci hanya "1" .. "5"
    const sanitizedValidasi: Record<string, boolean> = {};
    for (const key of ["1", "2", "3", "4", "5"]) {
      if (typeof input.validasi[key] === "boolean") {
        sanitizedValidasi[key] = input.validasi[key];
      }
    }
    payload.validasi = sanitizedValidasi;
  }

  if (input.catatan !== undefined) {
    payload.catatan = input.catatan?.trim() || null;
  }

  // 5. Eksekusi upsert ke audit_penilaian_auditor
  const { data: upsertData, error: upsertError } = await supabase
    .from("audit_penilaian_auditor")
    .upsert(payload, { onConflict: "periode_id,cabang_id,item_nomor" })
    .select()
    .single();

  if (upsertError) {
    console.error("[savePenilaianAuditor] Upsert error:", upsertError.message);
    return { ok: false, error: "Gagal menyimpan penilaian ke database." };
  }

  return { ok: true, row: upsertData as Record<string, unknown> };
}

export interface ImportPenilaianAdminItemPayload {
  itemNomor: number;
  skorAudite?: number | null;
  skorAuditor?: number | null;
  lampiranLinks?: Record<string, string>;
  validasi?: Record<string, boolean | null>;
}

export interface ImportPenilaianAdminBatchInput {
  periodeId: number;
  cabangId: number;
  items: ImportPenilaianAdminItemPayload[];
}

export type ImportPenilaianAdminBatchResult =
  | {
      ok: true;
      count: number;
      message: string;
      importedRows: {
        itemNomor: number;
        skorAudite: number | null;
        skorAuditor: number | null;
        lampiranLinks: Record<string, string | null>;
        validasi: Record<string, boolean | null>;
      }[];
    }
  | { ok: false; error: string };

/**
 * Server Action untuk mengimpor data penilaian audit dari Excel oleh Auditor SIA.
 * HANYA mengimpor 4 kolom:
 * 1. Lampiran (Link Evidence)
 * 2. Validasi (Benar / Tidak Benar)
 * 3. Skor Audite (1–5)
 * 4. Skor Auditor (1–5)
 * Kolom lainnya (bobot, regulasi, catatan auditor, dll.) sama sekali tidak diubah.
 */
export async function importPenilaianAdminBatch(
  input: ImportPenilaianAdminBatchInput
): Promise<ImportPenilaianAdminBatchResult> {
  const { periodeId, cabangId, items } = input;

  if (!periodeId || !cabangId || !Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Data impor penilaian tidak boleh kosong." };
  }

  // 1. Autentikasi dan otorisasi role 'admin' di server
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
      error: "Hanya akun Auditor SIA (admin) yang berwenang mengimpor penilaian audit.",
    };
  }

  // 2. Verifikasi keberadaan cabang dan periode
  const [{ data: cabang, error: cabangError }, { data: periode, error: periodeError }] =
    await Promise.all([
      supabase.from("cabang").select("id, nama").eq("id", cabangId).single(),
      supabase.from("periode").select("id, nama").eq("id", periodeId).single(),
    ]);

  if (cabangError || !cabang) {
    return { ok: false, error: "Cabang/perwakilan yang dituju tidak ditemukan." };
  }

  if (periodeError || !periode) {
    return { ok: false, error: "Periode audit tidak ditemukan." };
  }

  // 3. Ambil data eksisting dari audit_jawaban dan audit_penilaian_auditor
  const [{ data: existingJawaban }, { data: existingPenilaian }] = await Promise.all([
    supabase
      .from("audit_jawaban")
      .select("item_nomor, skor_audite, lampiran_links, lampiran_link")
      .eq("periode_id", periodeId)
      .eq("cabang_id", cabangId),
    supabase
      .from("audit_penilaian_auditor")
      .select("item_nomor, validasi, skor_auditor, catatan")
      .eq("periode_id", periodeId)
      .eq("cabang_id", cabangId),
  ]);

  const jawabanMap = new Map<
    number,
    {
      skor_audite: number | null;
      lampiran_links: Record<string, string | null>;
      lampiran_link: string | null;
    }
  >();
  for (const j of existingJawaban ?? []) {
    jawabanMap.set(j.item_nomor, {
      skor_audite: j.skor_audite ?? null,
      lampiran_links: (j.lampiran_links as Record<string, string | null>) ?? {},
      lampiran_link: j.lampiran_link ?? null,
    });
  }

  const penilaianMap = new Map<
    number,
    {
      validasi: Record<string, boolean | null>;
      skor_auditor: number | null;
      catatan: string | null;
    }
  >();
  for (const p of existingPenilaian ?? []) {
    penilaianMap.set(p.item_nomor, {
      validasi: (p.validasi as Record<string, boolean | null>) ?? {},
      skor_auditor: p.skor_auditor ?? null,
      catatan: p.catatan ?? null,
    });
  }

  const nowIso = new Date().toISOString();
  const penilaianPayloads: {
    periode_id: number;
    cabang_id: number;
    item_nomor: number;
    validasi: Record<string, boolean | null>;
    skor_auditor: number | null;
    catatan: string | null;
    updated_by: string;
    updated_at: string;
  }[] = [];

  const importedRowsResult: {
    itemNomor: number;
    skorAudite: number | null;
    skorAuditor: number | null;
    lampiranLinks: Record<string, string | null>;
    validasi: Record<string, boolean | null>;
  }[] = [];

  for (const item of items) {
    if (!item.itemNomor || item.itemNomor < 1) continue;

    const existJ = jawabanMap.get(item.itemNomor);
    const existP = penilaianMap.get(item.itemNomor);

    // 1. Lampiran & Skor Mandiri Cabang tetap dipertahankan dari data cabang (tidak ditimpa admin)
    const cabangLinks = existJ?.lampiran_links ?? {};
    const finalSkorAudite = existJ?.skor_audite ?? null;

    // 2. Validasi (1..5)
    const mergedValidasi = { ...(existP?.validasi ?? {}) };
    if (item.validasi && typeof item.validasi === "object") {
      for (const [seq, val] of Object.entries(item.validasi)) {
        const seqNum = Number(seq);
        if (seqNum >= 1 && seqNum <= 5 && typeof val === "boolean") {
          mergedValidasi[String(seqNum)] = val;
        }
      }
    }

    // 3. Skor Auditor (1-5)
    let finalSkorAuditor = existP?.skor_auditor ?? null;
    if (
      typeof item.skorAuditor === "number" &&
      item.skorAuditor >= 1 &&
      item.skorAuditor <= 5
    ) {
      finalSkorAuditor = item.skorAuditor;
    }

    // Susun payload penilaian auditor
    penilaianPayloads.push({
      periode_id: periodeId,
      cabang_id: cabangId,
      item_nomor: item.itemNomor,
      validasi: mergedValidasi,
      skor_auditor: finalSkorAuditor,
      catatan: existP?.catatan ?? null,
      updated_by: user.id,
      updated_at: nowIso,
    });

    importedRowsResult.push({
      itemNomor: item.itemNomor,
      skorAudite: finalSkorAudite,
      skorAuditor: finalSkorAuditor,
      lampiranLinks: cabangLinks,
      validasi: mergedValidasi,
    });
  }

  // Admin menyimpan hasil penilaian auditor (audit_penilaian_auditor)
  if (penilaianPayloads.length > 0) {
    const { error: pError } = await supabase
      .from("audit_penilaian_auditor")
      .upsert(penilaianPayloads, {
        onConflict: "periode_id,cabang_id,item_nomor",
      });

    if (pError) {
      console.error("[importPenilaianAdminBatch] Gagal upsert audit_penilaian_auditor:", pError.message);
      return { ok: false, error: "Gagal menyimpan penilaian auditor ke database." };
    }
  }

  return {
    ok: true,
    count: items.length,
    message: `Berhasil mengimpor penilaian untuk ${items.length} butir instrumen audit BMH Perwakilan ${cabang.nama}.`,
    importedRows: importedRowsResult,
  };
}
