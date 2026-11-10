import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PerwakilanManagementView } from "@/components/perwakilan/perwakilan-management-view";
import type { Cabang, CabangDetailListItem } from "@/types/audit";

export const instant = false;

export default async function ManajemenPerwakilanPage() {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Hanya role admin yang berwenang mengakses Manajemen Perwakilan
  if (session.profile.role !== "admin") {
    redirect("/dashboard/user");
  }

  const supabase = await createClient();

  // 1. Ambil data cabang, profiles tertaut, dan statistik jawaban secara paralel
  const [
    { data: rawCabangList, error: cabangError },
    { data: rawProfiles, error: profilesError },
    { data: rawJawaban, error: jawabanError },
  ] = await Promise.all([
    supabase.from("cabang").select("*").order("nama"),
    supabase.from("profiles").select("id, nama, cabang_id").not("cabang_id", "is", null),
    supabase.from("audit_jawaban").select("cabang_id"),
  ]);

  if (cabangError) {
    console.error("[MANAJEMEN_CABANG] Gagal memuat cabang:", cabangError.message);
  }
  if (profilesError) {
    console.error("[MANAJEMEN_CABANG] Gagal memuat profiles:", profilesError.message);
  }
  if (jawabanError) {
    console.error("[MANAJEMEN_CABANG] Gagal memuat audit_jawaban:", jawabanError.message);
  }

  // 2. Pemetaan profil per cabang_id
  const usersByCabang = new Map<number, string[]>();
  for (const p of rawProfiles ?? []) {
    if (p.cabang_id) {
      const list = usersByCabang.get(p.cabang_id) ?? [];
      if (p.nama) list.push(p.nama);
      usersByCabang.set(p.cabang_id, list);
    }
  }

  // 3. Pemetaan jumlah isian jawaban per cabang_id
  const jawabanCountByCabang = new Map<number, number>();
  for (const j of rawJawaban ?? []) {
    if (j.cabang_id) {
      const count = jawabanCountByCabang.get(j.cabang_id) ?? 0;
      jawabanCountByCabang.set(j.cabang_id, count + 1);
    }
  }

  // 4. Susun daftar detail perwakilan
  const cabangList: CabangDetailListItem[] = ((rawCabangList ?? []) as Cabang[]).map((c) => {
    const userNames = usersByCabang.get(c.id) ?? [];
    const jawabanCount = jawabanCountByCabang.get(c.id) ?? 0;
    return {
      ...c,
      userCount: userNames.length,
      userNames,
      jawabanCount,
    };
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <PerwakilanManagementView initialCabangList={cabangList} />
    </main>
  );
}
