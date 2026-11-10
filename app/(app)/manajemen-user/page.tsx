import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserManagementView } from "@/components/user-management/user-management-view";
import { namaToEmail } from "@/lib/auth/nama-email";
import type { Cabang, Role, UserListItem } from "@/types/audit";

export const instant = false;

export default async function ManajemenUserPage() {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Hanya role admin yang diizinkan mengakses halaman Manajemen User
  if (session.profile.role !== "admin") {
    redirect("/dashboard/user");
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Ambil profiles, cabang, dan auth users secara paralel
  const [
    { data: rawProfiles, error: profilesError },
    { data: rawCabangList, error: cabangError },
    { data: authUsersData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nama, role, cabang_id, wajib_ganti_password, created_at, cabang:cabang_id(id, nama)")
      .order("created_at", { ascending: false }),
    supabase.from("cabang").select("*").order("nama"),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (profilesError) {
    console.error("[MANAJEMEN_USER] Gagal memuat profiles:", profilesError.message);
  }

  // Buat mapping email dari auth.users berdasarkan user id
  const emailMap = new Map<string, string>();
  if (authUsersData?.users) {
    for (const u of authUsersData.users) {
      if (u.email) {
        emailMap.set(u.id, u.email);
      }
    }
  }

  const cabangList = (rawCabangList ?? []) as Cabang[];

  // Gabungkan profil dengan email auth
  const userList: UserListItem[] = (rawProfiles ?? []).map((p: any) => {
    const email = emailMap.get(p.id) || (p.nama ? namaToEmail(p.nama) : null);
    return {
      id: p.id,
      nama: p.nama,
      role: p.role as Role,
      cabang_id: p.cabang_id,
      wajib_ganti_password: p.wajib_ganti_password,
      created_at: p.created_at,
      email,
      cabang: p.cabang,
    };
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <UserManagementView
        initialUsers={userList}
        cabangList={cabangList}
        currentAdminId={session.user.id}
      />
    </main>
  );
}
