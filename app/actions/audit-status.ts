"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { toggleLockFormSchema, updateStatusAuditSchema } from "@/lib/schemas";
import { z } from "zod";

export type AuditStatusActionResult =
  | { ok: true; status: string; message: string }
  | { ok: false; error: string };

export type LockFormActionResult =
  | { ok: true; isLocked: boolean; message: string }
  | { ok: false; error: string };

/**
 * Server Action: Mengubah status audit cabang (misal: "Sudah Diaudit", "Sedang Diaudit", "Belum Diaudit").
 * Otorisasi: Khusus role 'admin' (Auditor SIA).
 */
export async function updateStatusAuditAction(
  input: z.infer<typeof updateStatusAuditSchema>
): Promise<AuditStatusActionResult> {
  try {
    const session = await getCurrentProfile();
    if (!session || !session.user || session.profile.role !== "admin") {
      return {
        ok: false,
        error: "Akses ditolak: Hanya akun Auditor (Admin) yang berwenang mengubah status audit.",
      };
    }

    const parsed = updateStatusAuditSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg =
        parsed.error.issues[0]?.message || "Data input status audit tidak valid.";
      return { ok: false, error: errorMsg };
    }

    const { periodeId, cabangId, status, catatan } = parsed.data;
    const supabase = await createClient();

    const payload = {
      periode_id: periodeId,
      cabang_id: cabangId,
      status,
      catatan: catatan?.trim() || null,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("audit_status_cabang")
      .upsert(payload, { onConflict: "periode_id,cabang_id" });

    if (upsertError) {
      console.error(
        "[updateStatusAuditAction] Gagal upsert audit_status_cabang:",
        upsertError.message
      );
      return {
        ok: false,
        error: `Gagal memperbarui status audit di sistem: ${upsertError.message}`,
      };
    }

    // Revalidasi seluruh rute yang menampilkan status audit
    revalidatePath("/nilai-audit");
    revalidatePath(`/admin/penilaian/${cabangId}`);
    revalidatePath("/admin/penilaian");
    revalidatePath("/dashboard/admin");

    return {
      ok: true,
      status,
      message: `Status audit berhasil diubah menjadi "${status}".`,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    console.error("[updateStatusAuditAction] Error:", message);
    return { ok: false, error: message };
  }
}

/**
 * Server Action: Mengunci atau membuka kunci form isian audit untuk cabang tertentu.
 * Otorisasi: Khusus role 'admin' (Auditor SIA).
 */
export async function toggleLockFormAction(
  input: z.infer<typeof toggleLockFormSchema>
): Promise<LockFormActionResult> {
  try {
    const session = await getCurrentProfile();
    if (!session || !session.user || session.profile.role !== "admin") {
      return {
        ok: false,
        error: "Akses ditolak: Hanya akun Auditor (Admin) yang berwenang mengunci form isian cabang.",
      };
    }

    const parsed = toggleLockFormSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg =
        parsed.error.issues[0]?.message || "Data input kunci form tidak valid.";
      return { ok: false, error: errorMsg };
    }

    const { periodeId, cabangId, isLocked, catatan } = parsed.data;
    const supabase = await createClient();

    // Ambil record yang sudah ada agar tidak menimpa status audit saat ini
    const { data: existing } = await supabase
      .from("audit_status_cabang")
      .select("status")
      .eq("periode_id", periodeId)
      .eq("cabang_id", cabangId)
      .maybeSingle();

    const currentStatus = existing?.status || "Sedang Diaudit";

    const payload = {
      periode_id: periodeId,
      cabang_id: cabangId,
      status: currentStatus,
      is_locked: isLocked,
      locked_at: isLocked ? new Date().toISOString() : null,
      catatan: catatan?.trim() || null,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("audit_status_cabang")
      .upsert(payload, { onConflict: "periode_id,cabang_id" });

    if (upsertError) {
      console.error(
        "[toggleLockFormAction] Gagal upsert is_locked:",
        upsertError.message
      );
      return {
        ok: false,
        error: `Gagal memperbarui status kunci form: ${upsertError.message}`,
      };
    }

    // Revalidasi seluruh rute yang terpengaruh
    revalidatePath("/nilai-audit");
    revalidatePath("/audit");
    revalidatePath(`/admin/penilaian/${cabangId}`);
    revalidatePath("/admin/penilaian");
    revalidatePath("/dashboard/user");

    return {
      ok: true,
      isLocked,
      message: isLocked
        ? "Form isian cabang berhasil dikunci (akun user tidak dapat mengedit)."
        : "Kunci form isian cabang berhasil dibuka (akun user dapat mengedit kembali).",
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    console.error("[toggleLockFormAction] Error:", message);
    return { ok: false, error: message };
  }
}

