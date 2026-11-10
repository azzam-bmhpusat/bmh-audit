import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPersen } from "@/lib/format";
import type { Cabang, Periode, TotalAdmin } from "@/types/audit";
import {
  Building2Icon,
  CheckCircle2Icon,
  ClockIcon,
  ArrowRightIcon,
  ClipboardCheckIcon,
  BarChart3Icon,
} from "lucide-react";

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Proteksi rute di tingkat server: role selain admin dialihkan ke dashboard user
  if (session.profile.role !== "admin") {
    redirect("/dashboard/user");
  }

  const supabase = await createClient();

  // 1. Ambil data cabang, periode, dan total admin
  const [{ data: rawCabangList }, { data: rawPeriodeList }] = await Promise.all([
    supabase.from("cabang").select("*").order("nama"),
    supabase.from("periode").select("*").order("id", { ascending: false }),
  ]);

  const cabangList = (rawCabangList ?? []) as Cabang[];
  const periodeList = (rawPeriodeList ?? []) as Periode[];

  const periodeAktif =
    periodeList.find((p) => p.is_open) ?? (periodeList[0] || null);

  const periodeId = periodeAktif?.id ?? 1;

  const { data: rawTotals } = await supabase
    .from("v_audit_total_admin")
    .select("*")
    .eq("periode_id", periodeId);

  const totalsList = (rawTotals ?? []) as TotalAdmin[];
  const totalsMap = new Map<number, TotalAdmin>();
  for (const t of totalsList) {
    totalsMap.set(t.cabang_id, t);
  }

  // Agregasi metrik
  const totalCabang = cabangList.length;
  const cabangSelesaiSIA = totalsList.filter(
    (t) => t.item_dinilai_auditor === t.total_item && t.total_item > 0
  ).length;
  const cabangSelesaiAudite = totalsList.filter(
    (t) => t.item_terisi_audite === t.total_item && t.total_item > 0
  ).length;

  const avgPersenAuditor =
    totalCabang > 0
      ? Math.round(
          totalsList.reduce((acc, curr) => acc + (curr.persen_auditor ?? 0), 0) /
            totalCabang *
            100
        ) / 100
      : 0;

  // Daftar cabang yang membutuhkan perhatian (belum lengkap diisi atau belum tuntas dinilai)
  const cabangPerluPerhatian = cabangList
    .map((c) => {
      const total = totalsMap.get(c.id);
      return {
        id: c.id,
        nama: c.nama,
        kode: c.kode,
        itemTerisiAudite: total?.item_terisi_audite ?? 0,
        itemDinilaiAuditor: total?.item_dinilai_auditor ?? 0,
        totalItem: total?.total_item ?? 72,
        persenAuditor: total?.persen_auditor ?? 0,
        persenAudite: total?.persen_audite ?? 0,
      };
    })
    .filter(
      (c) =>
        c.itemTerisiAudite < c.totalItem || c.itemDinilaiAuditor < c.totalItem
    )
    .sort((a, b) => a.itemDinilaiAuditor - b.itemDinilaiAuditor);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard Auditor SIA
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Ringkasan progres penilaian audit kepatuhan seluruh perwakilan cabang • Periode: {periodeAktif?.nama ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/nilai-audit" />}
            nativeButton={false}
            className="gap-1.5"
          >
            <ClipboardCheckIcon className="size-4" />
            <span>Mulai Penilaian</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            render={<Link href="/ringkasan" />}
            nativeButton={false}
            className="gap-1.5"
          >
            <BarChart3Icon className="size-4" />
            <span>Ringkasan Nasional</span>
          </Button>
        </div>
      </div>

      {/* Kartu Ringkasan Metrik */}
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
              {totalCabang}{" "}
              <span className="text-xs font-normal text-muted-foreground">cabang</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Terdaftar dalam sistem
            </p>
          </CardContent>
        </Card>

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
            <p className="text-xs text-muted-foreground mt-1">
              Semua item instrumen telah diisi audite
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Selesai Dinilai Auditor SIA
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
            <p className="text-xs text-muted-foreground mt-1">
              Validasi & penilaian lengkap
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Rata-rata Capaian Nasional SIA
            </CardTitle>
            <BarChart3Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {formatPersen(avgPersenAuditor)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari skor ideal seluruh cabang
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Cabang Perlu Perhatian */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 pb-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Daftar Cabang yang Perlu Perhatian
              </CardTitle>
              <CardDescription className="text-xs">
                Cabang yang pengisian mandirinya belum tuntas (72 item) atau belum selesai divalidasi oleh Auditor SIA.
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">
              {cabangPerluPerhatian.length} Cabang
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {cabangPerluPerhatian.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
              <CheckCircle2Icon className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Luar biasa! Semua cabang telah selesai dinilai.</p>
              <p className="text-xs text-muted-foreground">
                Tidak ada cabang yang membutuhkan tindak lanjut penilaian saat ini.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Cabang / Perwakilan</TableHead>
                    <TableHead className="w-48">Progres Audite</TableHead>
                    <TableHead className="w-36">Status SIA</TableHead>
                    <TableHead className="w-28 text-right">Skor SIA</TableHead>
                    <TableHead className="w-36 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cabangPerluPerhatian.map((c, idx) => {
                    const persenTerisi =
                      c.totalItem > 0 ? (c.itemTerisiAudite / c.totalItem) * 100 : 0;
                    const isSiaSelesai =
                      c.itemDinilaiAuditor === c.totalItem && c.totalItem > 0;

                    return (
                      <TableRow key={c.id}>
                        <TableCell className="text-center tabular-nums text-muted-foreground text-xs">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-foreground">
                              {c.nama}
                            </span>
                            {c.kode && (
                              <span className="text-xs text-muted-foreground">
                                Kode: {c.kode}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {c.itemTerisiAudite}/{c.totalItem} item
                              </span>
                              <span className="font-medium tabular-nums">
                                {Math.round(persenTerisi)}%
                              </span>
                            </div>
                            <Progress value={c.itemTerisiAudite} max={c.totalItem} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isSiaSelesai ? "default" : "secondary"}>
                            {isSiaSelesai
                              ? "Selesai"
                              : `${c.itemDinilaiAuditor}/${c.totalItem} dinilai`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-sm">
                          {formatPersen(c.persenAuditor)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            render={
                              <Link
                                href={`/nilai-audit?cabang=${c.id}&periode=${periodeId}`}
                              />
                            }
                            nativeButton={false}
                          >
                            <span>Nilai Cabang</span>
                            <ArrowRightIcon className="size-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
      </Card>
    </main>
  );
}
