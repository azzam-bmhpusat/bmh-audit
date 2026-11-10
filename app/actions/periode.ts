"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  createPeriodeSchema,
  updatePeriodeSchema,
  togglePeriodeStatusSchema,
  deletePeriodeSchema,
} from "@/lib/schemas";
import { z } from "zod";

export type PeriodeActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/**
 * Memastikan pemanggil adalah user terautentikasi dengan peran admin.
 */
async function verifyAdminCaller() {
  const session = await getCurrentProfile();
  if (!session || !session.user || session.profile.role !== "admin") {
    throw new Error("Akses ditolak: Hanya akun Auditor (Admin) yang berwenang.");
  }
  return session;
}

/**
 * Server Action: Menambahkan periode audit baru.
 */
export async function createPeriodeAction(
  input: z.infer<typeof createPeriodeSchema>
): Promise<PeriodeActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = createPeriodeSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Data periode tidak valid";
      return { ok: false, error: errorMsg };
    }

    const { nama, is_open, setAsOnlyActive } = parsed.data;
    const supabase = await createClient();

    // 1. Cek keunikan nama periode (case-insensitive)
    const { data: existingPeriode } = await supabase
      .from("periode")
      .select("id")
      .ilike("nama", nama)
      .maybeSingle();

    if (existingPeriode) {
      return {
        ok: false,
        error: `Periode dengan nama "${nama}" sudah terdaftar.`,
      };
    }

    // 2. Jika disetel sebagai satu-satunya periode aktif, tutup semua periode lain terlebih dahulu
    if (is_open && setAsOnlyActive) {
      const { error: deactivateError } = await supabase
        .from("periode")
        .update({ is_open: false })
        .neq("id", 0);

      if (deactivateError) {
        console.error("[PERIODE] Gagal menonaktifkan periode lain:", deactivateError.message);
      }
    }

    // 3. Simpan data periode baru
    const { error: insertError } = await supabase
      .from("periode")
      .insert({
        nama,
        is_open,
      });

    if (insertError) {
      console.error("[PERIODE] Gagal insert periode baru:", insertError.message);
      return {
        ok: false,
        error: `Gagal menambahkan periode: ${insertError.message}`,
      };
    }

    // Revalidasi cache halaman terkait
    revalidatePath("/pengaturan");
    revalidatePath("/dashboard/admin");
    revalidatePath("/audit");
    revalidatePath("/nilai-audit");
    revalidatePath("/admin/penilaian");
    revalidatePath("/ringkasan");

    return {
      ok: true,
      message: `Periode "${nama}" berhasil ditambahkan.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server";
    return { ok: false, error: message };
  }
}

/**
 * Server Action: Memperbarui nama dan status periode audit.
 */
export async function updatePeriodeAction(
  input: z.infer<typeof updatePeriodeSchema>
): Promise<PeriodeActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = updatePeriodeSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Data pembaruan periode tidak valid";
      return { ok: false, error: errorMsg };
    }

    const { id, nama, is_open, setAsOnlyActive } = parsed.data;
    const supabase = await createClient();

    // 1. Cek keunikan nama pada periode lain
    const { data: existingName } = await supabase
      .from("periode")
      .select("id")
      .ilike("nama", nama)
      .neq("id", id)
      .maybeSingle();

    if (existingName) {
      return {
        ok: false,
        error: `Nama periode "${nama}" sudah digunakan oleh periode lain.`,
      };
    }

    // 2. Jika disetel sebagai satu-satunya periode aktif, tutup semua periode lain
    if (is_open && setAsOnlyActive) {
      await supabase
        .from("periode")
        .update({ is_open: false })
        .neq("id", id);
    }

    // 3. Update periode
    const { error: updateError } = await supabase
      .from("periode")
      .update({
        nama,
        is_open,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[PERIODE] Gagal update periode:", updateError.message);
      return {
        ok: false,
        error: `Gagal memperbarui periode: ${updateError.message}`,
      };
    }

    revalidatePath("/pengaturan");
    revalidatePath("/dashboard/admin");
    revalidatePath("/audit");
    revalidatePath("/nilai-audit");
    revalidatePath("/admin/penilaian");
    revalidatePath("/ringkasan");

    return {
      ok: true,
      message: `Periode "${nama}" berhasil diperbarui.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server";
    return { ok: false, error: message };
  }
}

/**
 * Server Action: Mengubah status buka/tutup (is_open) periode audit secara instan.
 */
export async function togglePeriodeStatusAction(
  input: z.infer<typeof togglePeriodeStatusSchema>
): Promise<PeriodeActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = togglePeriodeStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Input status periode tidak valid" };
    }

    const { id, is_open, setAsOnlyActive } = parsed.data;
    const supabase = await createClient();

    // Jika diaktifkan dan setAsOnlyActive = true, tutup periode lain
    if (is_open && setAsOnlyActive) {
      await supabase
        .from("periode")
        .update({ is_open: false })
        .neq("id", id);
    }

    const { error } = await supabase
      .from("periode")
      .update({ is_open })
      .eq("id", id);

    if (error) {
      console.error("[PERIODE] Gagal toggle status periode:", error.message);
      return { ok: false, error: `Gagal mengubah status: ${error.message}` };
    }

    revalidatePath("/pengaturan");
    revalidatePath("/dashboard/admin");
    revalidatePath("/audit");
    revalidatePath("/nilai-audit");
    revalidatePath("/admin/penilaian");
    revalidatePath("/ringkasan");

    return {
      ok: true,
      message: `Status periode berhasil ${is_open ? "dibuka (aktif)" : "ditutup"}.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server";
    return { ok: false, error: message };
  }
}

/**
 * Server Action: Menghapus periode audit dengan proteksi integritas data.
 */
export async function deletePeriodeAction(
  input: z.infer<typeof deletePeriodeSchema>
): Promise<PeriodeActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = deletePeriodeSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "ID periode tidak valid" };
    }

    const { id } = parsed.data;
    const supabase = await createClient();

    // 1. Cek apakah ada data audit_jawaban terkait
    const { count: jawabanCount, error: countJawabanErr } = await supabase
      .from("audit_jawaban")
      .select("*", { count: "exact", head: true })
      .eq("periode_id", id);

    if (countJawabanErr) {
      console.error("[PERIODE] Gagal memeriksa jawaban:", countJawabanErr.message);
    }

    // 2. Cek apakah ada data audit_penilaian_auditor terkait
    const { count: penilaianCount, error: countPenilaianErr } = await supabase
      .from("audit_penilaian_auditor")
      .select("*", { count: "exact", head: true })
      .eq("periode_id", id);

    if (countPenilaianErr) {
      console.error("[PERIODE] Gagal memeriksa penilaian:", countPenilaianErr.message);
    }

    const totalTerkait = (jawabanCount ?? 0) + (penilaianCount ?? 0);
    if (totalTerkait > 0) {
      return {
        ok: false,
        error: `Periode tidak dapat dihapus karena sudah memiliki ${jawabanCount ?? 0} data isian cabang dan ${penilaianCount ?? 0} catatan audit. Silakan nonaktifkan (tutup status) periode sebagai gantinya.`,
      };
    }

    // 3. Hapus periode jika kosong
    const { error: deleteError } = await supabase
      .from("periode")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[PERIODE] Gagal menghapus periode:", deleteError.message);
      return {
        ok: false,
        error: `Gagal menghapus periode: ${deleteError.message}`,
      };
    }

    revalidatePath("/pengaturan");
    revalidatePath("/dashboard/admin");
    revalidatePath("/audit");
    revalidatePath("/nilai-audit");
    revalidatePath("/admin/penilaian");
    revalidatePath("/ringkasan");

    return {
      ok: true,
      message: "Periode audit berhasil dihapus.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server";
    return { ok: false, error: message };
  }
}
