import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/types/audit";

export interface CurrentUserSession {
  user: {
    id: string;
    email?: string;
  };
  profile: Profile;
  cabangNama: string | null;
}

/**
 * Mengambil profil pengguna yang sedang login di server.
 * Dibungkus dengan React cache() agar deduplikasi request per siklus render server.
 * Memanggil auth.getUser() (bukan getSession()) untuk verifikasi token yang aman.
 * Mengembalikan null jika belum login atau data profil tidak ditemukan.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentUserSession | null> => {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, nama, role, cabang_id, wajib_ganti_password")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  let cabangNama: string | null = null;
  if (profile.cabang_id) {
    const { data: cabang } = await supabase
      .from("cabang")
      .select("nama")
      .eq("id", profile.cabang_id)
      .single();

    if (cabang) {
      cabangNama = cabang.nama;
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile: {
      id: profile.id,
      nama: profile.nama,
      role: profile.role as Role,
      cabang_id: profile.cabang_id,
      wajib_ganti_password: profile.wajib_ganti_password,
    },
    cabangNama,
  };
});
