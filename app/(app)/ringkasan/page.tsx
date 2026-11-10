import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { searchParamsSchema } from "@/lib/schemas";
import { formatPersen } from "@/lib/format";
import {
  RingkasanCabangTable,
  type CabangSummaryItem,
} from "@/components/audit/ringkasan-cabang-table";
import type { Cabang, Periode, TotalAdmin } from "@/types/audit";
import { Building2Icon, CheckCircle2Icon, PercentIcon } from "lucide-react";

export const instant = false;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RingkasanPage(props: PageProps) {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Pengguna dengan role user diarahkan ke dashboard user (akses dibatasi hanya untuk admin SIA)
  if (session.profile.role !== "admin") {
    redirect("/dashboard/user");
  }

  const rawParams = await props.searchParams;
  const parsedParams = searchParamsSchema.parse(rawParams);

  const supabase = await createClient();

  // 1. Ambil daftar cabang dan periode secara paralel
  const [{ data: rawCabangList }, { data: rawPeriodeList }] = await Promise.all([
    supabase.from("cabang").select("*").order("nama"),
    supabase.from("periode").select("*").order("id", { ascending: false }),
  ]);

  const cabangList = (rawCabangList ?? []) as Cabang[];
  const periodeList = (rawPeriodeList ?? []) as Periode[];

  const periodeAktif = parsedParams.periode
    ? periodeList.find((p) => p.id === parsedParams.periode) ?? periodeList[0]
    : periodeList.find((p) => p.is_open) ?? (periodeList[0] || null);

  const periodeId = periodeAktif?.id ?? 1;

  // 2. Ambil data ringkasan semua cabang dari view v_audit_total_admin untuk periode terpilih
  const { data: rawTotals } = await supabase
    .from("v_audit_total_admin")
    .select("*")
    .eq("periode_id", periodeId);

  const totalsList = (rawTotals ?? []) as TotalAdmin[];
  const totalsMap = new Map<number, TotalAdmin>();
  for (const t of totalsList) {
    totalsMap.set(t.cabang_id, t);
  }

  // 3. Gabungkan seluruh cabang dengan data totalnya
  const summaryItems: CabangSummaryItem[] = cabangList.map((c) => {
    const total = totalsMap.get(c.id);
    return {
      cabangId: c.id,
      cabangNama: c.nama,
      cabangKode: c.kode,
      totalBobot: total?.total_bobot ?? 0,
      skorMaksimumIdeal: total?.skor_maksimum_ideal ?? 0,
      totalNilaiSkorAudite: total?.total_nilai_skor_audite ?? 0,
      totalNilaiSkorAuditor: total?.total_nilai_skor_auditor ?? 0,
      persenAuditor: total?.persen_auditor ?? 0,
      persenAudite: total?.persen_audite ?? 0,
      itemTerisiAudite: total?.item_terisi_audite ?? 0,
      itemDinilaiAuditor: total?.item_dinilai_auditor ?? 0,
      totalItem: total?.total_item ?? 72,
    };
  });

  // 4. Hitung metrik agregat nasional
  const totalCabangCount = summaryItems.length;
  const avgPersenAudite =
    totalCabangCount > 0
      ? Math.round(
        summaryItems.reduce((acc, curr) => acc + curr.persenAudite, 0) /
        totalCabangCount *
        100
      ) / 100
      : 0;

  const avgPersenAuditor =
    totalCabangCount > 0
      ? Math.round(
        summaryItems.reduce((acc, curr) => acc + curr.persenAuditor, 0) /
        totalCabangCount *
        100
      ) / 100
      : 0;

  const fullyEvaluatedCount = summaryItems.filter(
    (item) => item.itemDinilaiAuditor === item.totalItem && item.totalItem > 0
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header Halaman */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight uppercase">
          Ringkasan Hasil Audit Seluruh Cabang
        </h1>
        <p className="text-xs text-muted-foreground">
          Satuan Internal Audit BMH | Periode: {periodeAktif?.nama ?? "—"}
        </p>
      </div>

      {/* Kartu Metrik Agregat Nasional */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Perwakilan / Cabang
            </CardTitle>
            <Building2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {totalCabangCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">cabang</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Selesai Dinilai SIA
            </CardTitle>
            <CheckCircle2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {fullyEvaluatedCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {totalCabangCount} cabang
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Rata-rata Capaian Audite
            </CardTitle>
            <PercentIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {formatPersen(avgPersenAudite)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Rata-rata Capaian SIA
            </CardTitle>
            <PercentIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {formatPersen(avgPersenAuditor)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Rekapitulasi Cabang */}
      <RingkasanCabangTable data={summaryItems} periodeId={periodeId} />
    </main>
  );
}
