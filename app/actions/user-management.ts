"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createUserSchema,
  updateUserSchema,
  resetUserPasswordSchema,
  deleteUserSchema,
} from "@/lib/schemas";
import { z } from "zod";

export type UserActionResult =
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
 * Server Action: Membuat user baru di auth.users & profiles.
 */
export async function createUserAction(
  input: z.infer<typeof createUserSchema>
): Promise<UserActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Input pengguna tidak valid";
      return { ok: false, error: errorMsg };
    }

    const { nama, email, role, cabang_id, password, wajib_ganti_password } = parsed.data;

    const adminClient = createAdminClient();

    // 1. Buat akun di Supabase Auth
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          nama,
        },
      });

    if (authError || !authData.user) {
      console.error("[USER_MGMT] Gagal membuat auth user:", authError?.message);
      if (authError?.message.includes("already registered") || authError?.message.includes("unique")) {
        return { ok: false, error: "Email sudah terdaftar untuk pengguna lain." };
      }
      return { ok: false, error: authError?.message || "Gagal membuat akun pengguna." };
    }

    const newUserId = authData.user.id;

    // 2. Sinkronisasi data profil di public.profiles
    // (Trigger db on_auth_user_created mungkin sudah meng-insert baris default, jadi gunakan upsert/update)
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: newUserId,
        nama,
        role,
        cabang_id: role === "user" ? (cabang_id || null) : null,
        wajib_ganti_password,
      });

    if (profileError) {
      console.error("[USER_MGMT] Gagal mengupdate profil pengguna:", profileError.message);
      // Bersihkan auth user jika pembuatan profil gagal
      await adminClient.auth.admin.deleteUser(newUserId);
      return { ok: false, error: `Gagal menyimpan data profil: ${profileError.message}` };
    }

    revalidatePath("/manajemen-user");
    return { ok: true, message: `Pengguna "${nama}" berhasil didaftarkan.` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return { ok: false, error: message };
  }
}

/**
 * Server Action: Mengubah data user (nama, email, role, cabang_id, wajib_ganti_password).
 */
export async function updateUserAction(
  input: z.infer<typeof updateUserSchema>
): Promise<UserActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Data pengguna tidak valid";
      return { ok: false, error: errorMsg };
    }

    const { id, nama, email, role, cabang_id, wajib_ganti_password } = parsed.data;

    const adminClient = createAdminClient();

    // 1. Update data auth.users (email & metadata nama)
    const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
      email: email.toLowerCase(),
      user_metadata: {
        nama,
      },
    });

    if (authError) {
      console.error("[USER_MGMT] Gagal memperbarui auth user:", authError.message);
      return { ok: false, error: authError.message };
    }

    // 2. Update data profil di tabel profiles
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        nama,
        role,
        cabang_id: role === "user" ? (cabang_id || null) : null,
        wajib_ganti_password,
      })
      .eq("id", id);

    if (profileError) {
      console.error("[USER_MGMT] Gagal memperbarui tabel profiles:", profileError.message);
      return { ok: false, error: profileError.message };
    }

    revalidatePath("/manajemen-user");
    return { ok: true, message: `Profil "${nama}" berhasil diperbarui.` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return { ok: false, error: message };
  }
}

/**
 * Server Action: Reset password pengguna ke default "www.bmh.or.id" atau password kustom.
 */
export async function resetUserPasswordAction(
  input: z.infer<typeof resetUserPasswordSchema>
): Promise<UserActionResult> {
  try {
    await verifyAdminCaller();

    const parsed = resetUserPasswordSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Data reset password tidak valid";
      return { ok: false, error: errorMsg };
    }

    const { id, passwordBaru, wajib_ganti_password } = parsed.data;

    const adminClient = createAdminClient();

    // 1. Update password di auth.users
    const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
      password: passwordBaru,
    });

    if (authError) {
      console.error("[USER_MGMT] Gagal mereset password di auth:", authError.message);
      return { ok: false, error: `Gagal mereset password: ${authError.message}` };
    }

    // 2. Set wajib_ganti_password = true di tabel profiles
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        wajib_ganti_password,
      })
      .eq("id", id);

    if (profileError) {
      console.error("[USER_MGMT] Gagal menandai wajib_ganti_password:", profileError.message);
    }

    revalidatePath("/manajemen-user");
    return {
      ok: true,
      message: `Password berhasil direset ke "${passwordBaru}". Pengguna wajib mengganti password saat login berikutnya.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return { ok: false, error: message };
  }
}

/**
 * Server Action: Menghapus pengguna secara permanen.
 */
export async function deleteUserAction(
  input: z.infer<typeof deleteUserSchema>
): Promise<UserActionResult> {
  try {
    const currentSession = await verifyAdminCaller();

    const parsed = deleteUserSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "ID pengguna tidak valid" };
    }

    const { id } = parsed.data;

    // Proteksi: jangan izinkan admin menghapus akunnya sendiri yang sedang aktif
    if (currentSession.user.id === id) {
      return {
        ok: false,
        error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang login.",
      };
    }

    const adminClient = createAdminClient();

    // Menghapus akun di auth.users otomatis menghapus baris di profiles (CASCADE)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);

    if (deleteError) {
      console.error("[USER_MGMT] Gagal menghapus akun:", deleteError.message);
      return { ok: false, error: `Gagal menghapus akun: ${deleteError.message}` };
    }

    revalidatePath("/manajemen-user");
    return { ok: true, message: "Pengguna berhasil dihapus secara permanen." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return { ok: false, error: message };
  }
}

export interface ImportUserPayloadItem {
  rowNumber: number;
  nama: string;
  email: string;
  role: "admin" | "user";
  cabangNama?: string;
  cabangId?: number | null;
  password?: string;
  wajibGantiPassword: boolean;
}

export interface ImportUsersResult {
  ok: boolean;
  total: number;
  successCount: number;
  failedCount: number;
  details: Array<{
    rowNumber: number;
    nama: string;
    email: string;
    status: "success" | "error";
    error?: string;
  }>;
  message: string;
}

/**
 * Server Action: Melakukan import massal akun pengguna dari data CSV/Excel.
 * - Memverifikasi hak akses admin pemanggil.
 * - Membuat cabang baru secara otomatis jika belum ada di tabel cabang.
 * - Membuat akun auth.users dan profil public.profiles.
 * - Menangani error per baris secara modular sehingga tidak membatalkan seluruh proses.
 */
export async function importUsersAction(
  items: ImportUserPayloadItem[]
): Promise<ImportUsersResult> {
  try {
    await verifyAdminCaller();

    if (!items || items.length === 0) {
      return {
        ok: false,
        total: 0,
        successCount: 0,
        failedCount: 0,
        details: [],
        message: "Tidak ada data pengguna yang dikirim untuk diimpor.",
      };
    }

    const adminClient = createAdminClient();

    // 1. Ambil seluruh cabang yang sudah ada ke dalam cache memory untuk optimasi lookup
    const { data: rawCabangList } = await adminClient
      .from("cabang")
      .select("id, nama");

    const cabangMap = new Map<string, number>();
    if (rawCabangList) {
      for (const c of rawCabangList) {
        cabangMap.set(c.nama.trim().toLowerCase(), c.id);
      }
    }

    const details: ImportUsersResult["details"] = [];
    let successCount = 0;
    let failedCount = 0;

    // 2. Loop dan daftarkan setiap pengguna
    for (const item of items) {
      const trimmedNama = item.nama.trim();
      const trimmedEmail = item.email.trim().toLowerCase();

      let targetCabangId: number | null = null;

      // Jika role adalah 'user', pastikan cabang tersedia
      if (item.role === "user") {
        const cabangName = (item.cabangNama || trimmedNama).trim();
        const existingId = cabangMap.get(cabangName.toLowerCase()) || (item.cabangId ?? null);

        if (existingId) {
          targetCabangId = existingId;
        } else if (cabangName) {
          // Buat cabang baru otomatis
          const { data: newCabang, error: createCabangError } = await adminClient
            .from("cabang")
            .insert({ nama: cabangName })
            .select("id")
            .single();

          if (!createCabangError && newCabang) {
            targetCabangId = newCabang.id;
            cabangMap.set(cabangName.toLowerCase(), newCabang.id);
          } else {
            console.warn(
              `[USER_IMPORT] Gagal auto-create cabang "${cabangName}":`,
              createCabangError?.message
            );
          }
        }
      }

      // 3. Buat akun di Supabase Auth
      const { data: authData, error: authError } =
        await adminClient.auth.admin.createUser({
          email: trimmedEmail,
          password: item.password || "www.bmh.or.id",
          email_confirm: true,
          user_metadata: {
            nama: trimmedNama,
          },
        });

      if (authError || !authData.user) {
        failedCount++;
        const errMsg =
          authError?.message.includes("already registered") ||
          authError?.message.includes("unique")
            ? "Email sudah terdaftar."
            : authError?.message || "Gagal membuat akun auth.";

        details.push({
          rowNumber: item.rowNumber,
          nama: trimmedNama,
          email: trimmedEmail,
          status: "error",
          error: errMsg,
        });
        continue;
      }

      const newUserId = authData.user.id;

      // 4. Update data profil di tabel profiles
      const { error: profileError } = await adminClient
        .from("profiles")
        .upsert({
          id: newUserId,
          nama: trimmedNama,
          role: item.role,
          cabang_id: item.role === "user" ? targetCabangId : null,
          wajib_ganti_password: item.wajibGantiPassword,
        });

      if (profileError) {
        // Rollback akun auth yang baru dibuat
        await adminClient.auth.admin.deleteUser(newUserId);
        failedCount++;
        details.push({
          rowNumber: item.rowNumber,
          nama: trimmedNama,
          email: trimmedEmail,
          status: "error",
          error: `Gagal menyimpan profil: ${profileError.message}`,
        });
        continue;
      }

      // Berhasil
      successCount++;
      details.push({
        rowNumber: item.rowNumber,
        nama: trimmedNama,
        email: trimmedEmail,
        status: "success",
      });
    }

    revalidatePath("/manajemen-user");
    revalidatePath("/manajemen-perwakilan");

    const message =
      failedCount === 0
        ? `Berhasil mengimpor ${successCount} pengguna.`
        : `Berhasil mengimpor ${successCount} pengguna, ${failedCount} gagal.`;

    return {
      ok: successCount > 0,
      total: items.length,
      successCount,
      failedCount,
      details,
      message,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return {
      ok: false,
      total: items.length,
      successCount: 0,
      failedCount: items.length,
      details: [],
      message,
    };
  }
}
