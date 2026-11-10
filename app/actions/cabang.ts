"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  createCabangSchema,
  updateCabangSchema,
  deleteCabangSchema,
} from "@/lib/schemas";
import { z } from "zod";

export type CabangActionResult =
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
 * Server Action: Menambahkan perwakilan cabang baru.
 */
export async function createCabangAction(
  input: z.infer<typeof createCabangSchema>
): Promise<CabangActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = createCabangSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Data perwakilan tidak valid";
      return { ok: false, error: errorMsg };
    }

    const { nama, kode } = parsed.data;
    const supabase = await createClient();

    // 1. Cek keunikan nama cabang (case-insensitive)
    const { data: existingNama } = await supabase
      .from("cabang")
      .select("id")
      .ilike("nama", nama)
      .maybeSingle();

    if (existingNama) {
      return {
        ok: false,
        error: `Perwakilan dengan nama "${nama}" sudah terdaftar.`,
      };
    }

    // 2. Cek keunikan kode jika diisi (case-insensitive)
    if (kode) {
      const { data: existingKode } = await supabase
        .from("cabang")
        .select("id")
        .ilike("kode", kode)
        .maybeSingle();

      if (existingKode) {
        return {
          ok: false,
          error: `Kode perwakilan "${kode}" sudah digunakan oleh cabang lain.`,
        };
      }
    }

    // 3. Simpan data cabang baru
    const { error: insertError } = await supabase
      .from("cabang")
      .insert({
        nama,
        kode: kode || null,
      });

    if (insertError) {
      console.error("[CABANG_MGMT] Gagal insert cabang:", insertError.message);
      return { ok: false, error: `Gagal menambahkan perwakilan: ${insertError.message}` };
    }

    revalidatePath("/manajemen-perwakilan");
    revalidatePath("/manajemen-user");
    revalidatePath("/nilai-audit");
    revalidatePath("/ringkasan");
    revalidatePath("/dashboard/admin");

    return {
      ok: true,
      message: `Perwakilan "${nama}" berhasil ditambahkan.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return { ok: false, error: message };
  }
}

/**
 * Server Action: Memperbarui data perwakilan cabang.
 */
export async function updateCabangAction(
  input: z.infer<typeof updateCabangSchema>
): Promise<CabangActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = updateCabangSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Data perwakilan tidak valid";
      return { ok: false, error: errorMsg };
    }

    const { id, nama, kode } = parsed.data;
    const supabase = await createClient();

    // 1. Cek keunikan nama untuk cabang lain
    const { data: existingNama } = await supabase
      .from("cabang")
      .select("id")
      .ilike("nama", nama)
      .neq("id", id)
      .maybeSingle();

    if (existingNama) {
      return {
        ok: false,
        error: `Perwakilan dengan nama "${nama}" sudah digunakan oleh cabang lain.`,
      };
    }

    // 2. Cek keunikan kode untuk cabang lain jika diisi
    if (kode) {
      const { data: existingKode } = await supabase
        .from("cabang")
        .select("id")
        .ilike("kode", kode)
        .neq("id", id)
        .maybeSingle();

      if (existingKode) {
        return {
          ok: false,
          error: `Kode perwakilan "${kode}" sudah digunakan oleh cabang lain.`,
        };
      }
    }

    // 3. Update data cabang
    const { error: updateError } = await supabase
      .from("cabang")
      .update({
        nama,
        kode: kode || null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[CABANG_MGMT] Gagal update cabang:", updateError.message);
      return { ok: false, error: `Gagal memperbarui perwakilan: ${updateError.message}` };
    }

    revalidatePath("/manajemen-perwakilan");
    revalidatePath("/manajemen-user");
    revalidatePath("/nilai-audit");
    revalidatePath("/ringkasan");
    revalidatePath("/dashboard/admin");

    return {
      ok: true,
      message: `Data perwakilan "${nama}" berhasil diperbarui.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return { ok: false, error: message };
  }
}

/**
 * Server Action: Menghapus perwakilan cabang.
 */
export async function deleteCabangAction(
  input: z.infer<typeof deleteCabangSchema>
): Promise<CabangActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = deleteCabangSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "ID perwakilan tidak valid" };
    }

    const { id } = parsed.data;
    const supabase = await createClient();

    // Hapus data cabang
    const { error: deleteError } = await supabase
      .from("cabang")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[CABANG_MGMT] Gagal hapus cabang:", deleteError.message);
      return { ok: false, error: `Gagal menghapus perwakilan: ${deleteError.message}` };
    }

    revalidatePath("/manajemen-perwakilan");
    revalidatePath("/manajemen-user");
    revalidatePath("/nilai-audit");
    revalidatePath("/ringkasan");
    revalidatePath("/dashboard/admin");

    return {
      ok: true,
      message: "Perwakilan berhasil dihapus.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return { ok: false, error: message };
  }
}
