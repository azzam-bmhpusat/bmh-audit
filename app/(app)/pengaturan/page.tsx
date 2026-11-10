import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PengaturanView } from "@/components/pengaturan/pengaturan-view";
import type { PilarSummary } from "@/components/pengaturan/instrumen-overview";
import type { Periode, PeriodeDetailListItem, AuditPredikat } from "@/types/audit";

export const instant = false;

export default async function PengaturanPage() {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Hanya role admin (auditor) yang berwenang mengakses halaman Pengaturan
  if (session.profile.role !== "admin") {
    redirect("/dashboard/user");
  }

  const supabase = await createClient();

  // 1. Ambil seluruh data konfigurasi secara paralel
  const [
    { data: rawPeriodeList, error: periodeError },
    { data: rawJawaban, error: jawabanError },
    { data: rawPenilaian, error: penilaianError },
    { data: rawPredikat, error: predikatError },
    { data: rawPilar, error: pilarError },
    { data: rawVariabel, error: variabelError },
    { data: rawItems, error: itemsError },
  ] = await Promise.all([
    supabase.from("periode").select("*").order("id", { ascending: false }),
    supabase.from("audit_jawaban").select("periode_id"),
    supabase.from("audit_penilaian_auditor").select("periode_id"),
    supabase.from("v_audit_predikat").select("*").order("batas_bawah", { ascending: false }),
    supabase.from("audit_pilar").select("kode, nama, urutan").order("urutan"),
    supabase.from("audit_variabel").select("kode, nama, pilar_kode, urutan").order("urutan"),
    supabase.from("audit_item").select("nomor, variabel_kode, bobot"),
  ]);

  if (periodeError) console.error("[PENGATURAN] Gagal memuat periode:", periodeError.message);
  if (jawabanError) console.error("[PENGATURAN] Gagal memuat jawaban:", jawabanError.message);
  if (penilaianError) console.error("[PENGATURAN] Gagal memuat penilaian:", penilaianError.message);
  if (predikatError) console.error("[PENGATURAN] Gagal memuat predikat:", predikatError.message);
  if (pilarError) console.error("[PENGATURAN] Gagal memuat pilar:", pilarError.message);
  if (variabelError) console.error("[PENGATURAN] Gagal memuat variabel:", variabelError.message);
  if (itemsError) console.error("[PENGATURAN] Gagal memuat items:", itemsError.message);

  // 2. Pemetaan jumlah isian jawaban per periode_id
  const jawabanCountByPeriode = new Map<number, number>();
  for (const j of rawJawaban ?? []) {
    if (j.periode_id) {
      const count = jawabanCountByPeriode.get(j.periode_id) ?? 0;
      jawabanCountByPeriode.set(j.periode_id, count + 1);
    }
  }

  // 3. Pemetaan jumlah catatan penilaian per periode_id
  const penilaianCountByPeriode = new Map<number, number>();
  for (const p of rawPenilaian ?? []) {
    if (p.periode_id) {
      const count = penilaianCountByPeriode.get(p.periode_id) ?? 0;
      penilaianCountByPeriode.set(p.periode_id, count + 1);
    }
  }

  // 4. Susun daftar periode lengkap dengan statistik
  const periodeList: PeriodeDetailListItem[] = ((rawPeriodeList ?? []) as Periode[]).map((p) => ({
    ...p,
    jawabanCount: jawabanCountByPeriode.get(p.id) ?? 0,
    penilaianCount: penilaianCountByPeriode.get(p.id) ?? 0,
  }));

  // 5. Susun ringkasan struktur instrumen pilar & bobot
  const variabelList = rawVariabel ?? [];
  const itemsList = rawItems ?? [];

  // Peta variabel -> pilar_kode
  const variabelToPilar = new Map<string, string>();
  for (const v of variabelList) {
    variabelToPilar.set(v.kode, v.pilar_kode);
  }

  // Hitung jumlah item & total bobot per pilar
  const itemPerPilar = new Map<string, number>();
  const bobotPerPilar = new Map<string, number>();
  let totalBobot = 0;

  for (const item of itemsList) {
    const pilarKode = variabelToPilar.get(item.variabel_kode);
    if (pilarKode) {
      itemPerPilar.set(pilarKode, (itemPerPilar.get(pilarKode) ?? 0) + 1);
      bobotPerPilar.set(pilarKode, (bobotPerPilar.get(pilarKode) ?? 0) + item.bobot);
    }
    totalBobot += item.bobot;
  }

  // Hitung jumlah variabel per pilar
  const variabelPerPilar = new Map<string, number>();
  for (const v of variabelList) {
    variabelPerPilar.set(v.pilar_kode, (variabelPerPilar.get(v.pilar_kode) ?? 0) + 1);
  }

  const pilarList: PilarSummary[] = (rawPilar ?? []).map((p) => ({
    kode: p.kode,
    nama: p.nama,
    jumlahVariabel: variabelPerPilar.get(p.kode) ?? 0,
    jumlahItem: itemPerPilar.get(p.kode) ?? 0,
    totalBobot: bobotPerPilar.get(p.kode) ?? 0,
  }));

  const totalItem = itemsList.length;
  const totalVariabel = variabelList.length;
  const skorMaksimumIdeal = totalBobot * 5;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <PengaturanView
        periodeList={periodeList}
        predikatList={(rawPredikat ?? []) as AuditPredikat[]}
        pilarList={pilarList}
        totalItem={totalItem}
        totalVariabel={totalVariabel}
        totalBobot={totalBobot}
        skorMaksimumIdeal={skorMaksimumIdeal}
      />
    </main>
  );
}
