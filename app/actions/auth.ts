"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, gantiPasswordSchema } from "@/lib/schemas";

export type AuthActionResult =
  | { ok: true; redirectUrl?: string }
  | { ok: false; error: string };

/**
 * Server action untuk autentikasi login (Email + Password) dengan validasi Zod.
 * Hanya menerima email dan password yang valid.
 */
export async function loginAction(
  input: { email: string; password: string }
): Promise<AuthActionResult> {
  const trimmedEmail = (input.email ?? "").trim();
  const parsed = loginSchema.safeParse({
    email: trimmedEmail,
    password: input.password,
  });

  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Format email atau password tidak valid";
    return {
      ok: false,
      error: errorMsg,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  const supabase = await createClient();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !data.user) {
    console.error("[AUTH] Gagal login:", signInError?.message);
    return {
      ok: false,
      error: "Email atau password salah",
    };
  }

  // Ambil role pengguna dari tabel profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile || !profile.role) {
    console.error("[AUTH] Profil/role tidak ditemukan untuk uid:", data.user.id);
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "Profil akun tidak ditemukan",
    };
  }

  // Path tujuan aman di tingkat server (selalu internal path diawali '/')
  const targetPath =
    profile.role === "admin" ? "/dashboard/admin" : "/dashboard/user";
  revalidatePath("/", "layout");

  return {
    ok: true,
    redirectUrl: targetPath,
  };
}

/**
 * Server action untuk keluar / logout.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Server action untuk mengganti password (mode wajib maupun sukarela).
 * Memvalidasi kepemilikan akun dengan memverifikasi password saat ini.
 */
export async function gantiPasswordAction(
  input: { passwordLama: string; passwordBaru: string; konfirmasiPassword: string }
): Promise<AuthActionResult> {
  const parsed = gantiPasswordSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Format password baru tidak valid";
    return {
      ok: false,
      error: errorMsg,
    };
  }

  const supabase = await createClient();

  // Pastikan user masih login
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return {
      ok: false,
      error: "Sesi telah berakhir. Silakan keluar lalu masuk kembali.",
    };
  }

  // Verifikasi password saat ini
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.passwordLama,
  });

  if (verifyError) {
    return {
      ok: false,
      error: "Password saat ini salah. Pastikan Anda memasukkan password yang benar.",
    };
  }

  // Update password di Supabase Auth
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.passwordBaru,
  });

  if (updateError) {
    console.error("[AUTH] Gagal memperbarui password:", updateError.message);
    // Jika Supabase membutuhkan reautentikasi (secure password change)
    if (
      updateError.status === 401 ||
      updateError.message.toLowerCase().includes("reauthentication") ||
      updateError.message.toLowerCase().includes("recent login")
    ) {
      return {
        ok: false,
        error:
          "Diperlukan autentikasi ulang untuk mengubah password. Silakan keluar lalu masuk kembali.",
      };
    }
    return {
      ok: false,
      error: "Gagal memperbarui password. Silakan coba lagi.",
    };
  }

  // Tandai password telah diganti di tabel profiles via RPC
  const { error: rpcError } = await supabase.rpc("tandai_password_diganti");
  if (rpcError) {
    console.error("[AUTH] Gagal memanggil rpc tandai_password_diganti:", rpcError.message);
  }

  return { ok: true };
}
