"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { updatePredikatSchema } from "@/lib/schemas";
import { z } from "zod";

export type PredikatActionResult =
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
 * Server Action: Mengubah standar predikat audit kepatuhan oleh Admin SIA.
 */
export async function updatePredikatAction(
  input: z.infer<typeof updatePredikatSchema>
): Promise<PredikatActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = updatePredikatSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg =
        parsed.error.issues[0]?.message || "Data predikat tidak valid";
      return { ok: false, error: errorMsg };
    }

    const {
      nilai,
      predikat,
      status_kepatuhan,
      batas_bawah,
      batas_atas,
      keterangan,
      wajib_ptk,
    } = parsed.data;

    const supabase = await createClient();

    // 1. Cek keberadaan record audit_predikat yang akan diubah
    const { data: currentPredikat, error: checkError } = await supabase
      .from("audit_predikat")
      .select("nilai, batas_bawah")
      .eq("nilai", nilai)
      .maybeSingle();

    if (checkError) {
      console.error("[PREDIKAT] Gagal memverifikasi predikat:", checkError.message);
      return { ok: false, error: "Gagal memeriksa data predikat di database." };
    }

    if (!currentPredikat) {
      return { ok: false, error: `Standar predikat ${nilai} tidak ditemukan.` };
    }

    // 2. Cek apakah batas_bawah bertabrakan dengan batas_bawah predikat lain (karena kolom batas_bawah bertipe UNIQUE)
    const { data: duplicateBatasBawah } = await supabase
      .from("audit_predikat")
      .select("nilai")
      .neq("nilai", nilai)
      .eq("batas_bawah", batas_bawah)
      .maybeSingle();

    if (duplicateBatasBawah) {
      return {
        ok: false,
        error: `Batas bawah ${batas_bawah}% sudah digunakan oleh predikat ${duplicateBatasBawah.nilai}.`,
      };
    }

    // 3. Lakukan update data
    const { error: updateError } = await supabase
      .from("audit_predikat")
      .update({
        predikat,
        status_kepatuhan,
        batas_bawah,
        batas_atas,
        keterangan,
        wajib_ptk,
      })
      .eq("nilai", nilai);

    if (updateError) {
      console.error("[PREDIKAT] Gagal memperbarui audit_predikat:", updateError.message);
      return {
        ok: false,
        error: "Gagal memperbarui standar predikat di sistem.",
      };
    }

    // 4. Revalidate cache halaman yang terdampak
    revalidatePath("/pengaturan");
    revalidatePath("/penilaian");
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/user");

    return {
      ok: true,
      message: `Standar Predikat ${nilai} berhasil diperbarui.`,
    };
  } catch (error) {
    console.error("[PREDIKAT] Exception pada updatePredikatAction:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan internal server saat menyimpan predikat.",
    };
  }
}
