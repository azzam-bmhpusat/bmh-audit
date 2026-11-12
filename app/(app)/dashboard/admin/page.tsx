import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getPenilaianAdmin } from "@/lib/penilaian/queries";
import { PeriodePicker } from "@/components/penilaian/periode-picker";
import { AdminCabangMonitoringChart } from "@/components/dashboard/admin-cabang-monitoring-chart";
import { AdminPredikatDistribution } from "@/components/dashboard/admin-predikat-distribution";
import { AdminWorkQueue } from "@/components/dashboard/admin-work-queue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { formatPersen } from "@/lib/format";
import { searchParamsSchema } from "@/lib/schemas";
import type { Cabang, PenilaianAdmin, Periode, TotalAdmin } from "@/types/audit";
import {
  Building2Icon,
  CheckCircle2Icon,
  ClockIcon,
  BarChart3Icon,
  FileCheckIcon,
  InfoIcon,
} from "lucide-react";

export const instant = false;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminDashboardPage(props: PageProps) {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Proteksi rute di tingkat server: role selain admin dialihkan ke dashboard user
  if (session.profile.role !== "admin") {
    redirect("/dashboard/user");
  }

  const rawParams = await props.searchParams;
  const parsedParams = searchParamsSchema.parse(rawParams);

  const supabase = await createClient();

  // 1. Ambil data cabang dan periode secara paralel
  const [{ data: rawCabangList }, { data: rawPeriodeList }] = await Promise.all([
    supabase.from("cabang").select("*").order("nama"),
    supabase.from("periode").select("*").order("id", { ascending: false }),
  ]);

  const cabangList = (rawCabangList ?? []) as Cabang[];
  const periodeList = (rawPeriodeList ?? []) as Periode[];

  if (periodeList.length === 0) {
    return (
      <main className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Informasi</AlertTitle>
          <AlertDescription>
            Belum ada siklus periode audit yang terdaftar di sistem.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const periodeAktif = parsedParams.periode
    ? periodeList.find((p) => p.id === parsedParams.periode) ?? periodeList[0]
    : periodeList.find((p) => p.is_open) ?? (periodeList[0] || null);

  const periodeId = periodeAktif?.id ?? periodeList[0].id;

  // 2. Query paralel: v_penilaian_admin & v_audit_total_admin untuk periode terpilih
  const [rawPenilaian, { data: rawTotals }] = await Promise.all([
    getPenilaianAdmin(periodeId),
    supabase
      .from("v_audit_total_admin")
      .select("*")
      .eq("periode_id", periodeId),
  ]);

  const penilaianList = (
    Array.isArray(rawPenilaian) ? rawPenilaian : []
  ) as PenilaianAdmin[];

  const totalsList = (rawTotals ?? []) as TotalAdmin[];

  // 3. Agregasi metrik KPI
  const totalCabang = cabangList.length;
  const cabangSelesaiAudite = totalsList.filter(
    (t) => t.item_terisi_audite === t.total_item && t.total_item > 0
  ).length;
  const cabangSelesaiSIA = totalsList.filter(
    (t) => t.item_dinilai_auditor === t.total_item && t.total_item > 0
  ).length;

  const percentSelesaiAudite =
    totalCabang > 0 ? Math.round((cabangSelesaiAudite / totalCabang) * 100) : 0;
  const percentSelesaiSIA =
    totalCabang > 0 ? Math.round((cabangSelesaiSIA / totalCabang) * 100) : 0;

  const avgPersenAuditor =
    totalCabang > 0
      ? Math.round(
          (totalsList.reduce((acc, curr) => acc + (curr.persen_auditor ?? 0), 0) /
            totalCabang) *
            100
        ) / 100
      : 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Header Halaman & Filter Periode */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-3 border-b">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Dashboard Auditor SIA
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Pusat Kendali Pengawasan & Ringkasan Kepatuhan Integratif Nasional LAZNAS BMH
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PeriodePicker
            periodeList={periodeList}
            selectedPeriodeId={periodeId}
          />
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/admin/penilaian" />}
            nativeButton={false}
            className="gap-1.5 h-9 text-xs"
          >
            <FileCheckIcon className="size-4" />
            <span>Review Penilaian</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            render={<Link href="/ringkasan" />}
            nativeButton={false}
            className="gap-1.5 h-9 text-xs"
          >
            <BarChart3Icon className="size-4" />
            <span>Ringkasan Nasional</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          KARTU METRIK EKSEKUTIF (TOP KPI STATS)
          Responsif: 1 kolom di mobile sangat kecil, 2 kolom di tablet kecil, 4 di desktop
          ========================================================================= */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Perwakilan Cabang */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Perwakilan Cabang
            </CardTitle>
            <Building2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {totalCabang}{" "}
              <span className="text-xs font-normal text-muted-foreground">cabang</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Terdaftar dalam siklus audit kepatuhan
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Pengisian Mandiri Audite */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pengisian Mandiri Selesai
            </CardTitle>
            <ClockIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {cabangSelesaiAudite}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {totalCabang} cabang
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <Progress value={cabangSelesaiAudite} max={totalCabang} />
              <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                {percentSelesaiAudite}% cabang tuntas isi mandiri
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Verifikasi Auditor SIA */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Selesai Diaudit SIA
            </CardTitle>
            <CheckCircle2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {cabangSelesaiSIA}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {totalCabang} cabang
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <Progress value={cabangSelesaiSIA} max={totalCabang} />
              <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                {percentSelesaiSIA}% cabang tuntas diverifikasi
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Rata-rata Skor Nasional SIA */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Rata-rata Capaian Nasional SIA
            </CardTitle>
            <BarChart3Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {formatPersen(avgPersenAuditor)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rata-rata skor evaluasi auditor seluruh cabang
            </p>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          CHART MONITORING SELURUH CABANG (BARU)
          Visualisasi interaktif: Capaian Skor, Progres Butir, & Sebaran Status Kesiapan
          ========================================================================= */}
      <AdminCabangMonitoringChart penilaianList={penilaianList} />

      {/* =========================================================================
          DISTRIBUSI PREDIKAT KEPATUHAN NASIONAL
          ========================================================================= */}
      <AdminPredikatDistribution penilaianList={penilaianList} />

      {/* =========================================================================
          PUSAT KENDALI & ANTREAN KERJA AUDITOR SIA
          Menu bar 4 tab: Siap Diaudit | Belum Lengkap | Selesai Dinilai | Semua Cabang
          ========================================================================= */}
      <AdminWorkQueue
        penilaianList={penilaianList}
        selectedPeriodeId={periodeId}
      />
    </main>
  );
}
