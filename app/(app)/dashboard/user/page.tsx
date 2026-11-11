import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getPenilaianCabang, getPenilaianAdmin } from "@/lib/penilaian/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PeriodePicker } from "@/components/penilaian/periode-picker";
import { UserKepatuhanHero } from "@/components/dashboard/user-kepatuhan-hero";
import { UserPilarBreakdown } from "@/components/dashboard/user-pilar-breakdown";
import { nilaiSkor, skorMaksimum, subtotal } from "@/lib/scoring";
import { matrixRowCabangSchema, searchParamsSchema } from "@/lib/schemas";
import type { PenilaianAdmin, Periode } from "@/types/audit";
import { z } from "zod";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileSpreadsheetIcon,
  ArrowRightIcon,
  PaperclipIcon,
  ShieldCheckIcon,
  InfoIcon,
} from "lucide-react";

export const instant = false;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UserDashboardPage(props: PageProps) {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Proteksi rute di tingkat server: role selain user dialihkan ke dashboard admin
  if (session.profile.role !== "user") {
    redirect("/dashboard/admin");
  }

  const { profile, cabangNama } = session;

  if (!profile.cabang_id) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Perhatian</AlertTitle>
          <AlertDescription>
            Akun Anda belum ditautkan ke cabang manapun. Silakan hubungi Auditor SIA untuk pengaturan penugasan cabang.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const rawParams = await props.searchParams;
  const parsedParams = searchParamsSchema.parse(rawParams);

  const supabase = await createClient();

  // 1. Ambil daftar periode
  const { data: rawPeriodeList } = await supabase
    .from("periode")
    .select("*")
    .order("id", { ascending: false });

  const periodeList = (rawPeriodeList ?? []) as Periode[];

  if (periodeList.length === 0) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Informasi</AlertTitle>
          <AlertDescription>
            Belum ada periode audit yang tersedia saat ini. Silakan hubungi Auditor SIA.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const periodeAktif = parsedParams.periode
    ? periodeList.find((p) => p.id === parsedParams.periode) ?? periodeList[0]
    : periodeList.find((p) => p.is_open) ?? (periodeList[0] || null);

  const periodeId = periodeAktif?.id ?? periodeList[0].id;
  const isOpen = periodeAktif?.is_open ?? true;

  // 2. Query paralel: Data matriks cabang, rekapitulasi penilaian mandiri, penilaian SIA, dan status kunci
  const [
    { data: rawMatrix, error: matrixError },
    penilaianCabang,
    penilaianAdminData,
    statusCabangRes,
  ] = await Promise.all([
    supabase
      .from("v_audit_matrix_cabang")
      .select("*")
      .eq("periode_id", periodeId)
      .eq("cabang_id", profile.cabang_id)
      .order("nomor"),
    getPenilaianCabang(periodeId),
    getPenilaianAdmin(periodeId, profile.cabang_id).catch(() => null),
    supabase
      .from("audit_status_cabang")
      .select("status, is_locked, catatan, updated_at")
      .eq("periode_id", periodeId)
      .eq("cabang_id", profile.cabang_id)
      .maybeSingle(),
  ]);

  if (matrixError) {
    console.error("Gagal mengambil data matriks cabang:", matrixError);
    throw new Error("Gagal memuat ringkasan audit cabang.");
  }

  const penilaianSIA = penilaianAdminData as PenilaianAdmin | null;
  const statusAudit =
    statusCabangRes?.data?.status ??
    penilaianSIA?.status_audit ??
    "Belum Diaudit";
  const isLocked = Boolean(statusCabangRes?.data?.is_locked);
  const catatanAuditor = statusCabangRes?.data?.catatan ?? null;

  const rows = z.array(matrixRowCabangSchema).parse(rawMatrix ?? []);

  // 3. Hitung metrik agregat
  const totalItem = rows.length || 72;
  const itemTerisi = rows.filter((r) => r.skor_audite !== null).length;
  const itemBelumTerisi = totalItem - itemTerisi;
  const itemBerlampiran =
    penilaianCabang?.jumlah_butir_berlampiran ??
    rows.filter(
      (r) =>
        Boolean(r.lampiran_link) ||
        (r.lampiran_links && Object.values(r.lampiran_links).some(Boolean))
    ).length;

  const skorMaks = skorMaksimum(rows.map((r) => r.bobot));
  const totalNilaiSkor = subtotal(
    rows.map((r) => r.nilai_skor ?? nilaiSkor(r.skor_audite, r.bobot))
  );

  const daftarBelumTerisi = rows.filter((r) => r.skor_audite === null);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header Halaman & Pemilih Periode */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Audite Perwakilan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Perwakilan: <span className="font-medium text-foreground">{cabangNama || "—"}</span> • Siklus Audit Kepatuhan Integratif
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodePicker
            periodeList={periodeList}
            selectedPeriodeId={periodeId}
          />
          <Button
            variant="default"
            size="sm"
            render={<Link href="/audit" />}
            nativeButton={false}
            className="gap-1.5 h-9 text-xs"
            disabled={!isOpen || isLocked}
          >
            <FileSpreadsheetIcon className="size-4" />
            <span>Instrumen Audit</span>
          </Button>
        </div>
      </div>

      {/* Banner informasi jika form dikunci oleh auditor */}
      {isLocked && isOpen && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Form Isian Audit Dikunci</AlertTitle>
          <AlertDescription>
            Form pengisian instrumen untuk cabang Anda telah dikunci oleh Auditor SIA.
            {catatanAuditor ? ` Catatan Auditor: "${catatanAuditor}".` : " Pengisian instrumen berstatus hanya-baca (read-only)."}
          </AlertDescription>
        </Alert>
      )}

      {/* Banner informasi jika periode ditutup */}
      {!isOpen && (
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Periode Audit Ditutup</AlertTitle>
          <AlertDescription>
            Periode audit ini telah ditutup oleh Auditor SIA. Pengisian instrumen berstatus hanya-baca (read-only).
          </AlertDescription>
        </Alert>
      )}

      {/* =========================================================================
          POSISI PALING ATAS: HIGHLIGHT HASIL AUDIT RESMI SIA & SKOR MANDIRI
          ========================================================================= */}
      <UserKepatuhanHero
        penilaianSIA={penilaianSIA}
        penilaianMandiri={penilaianCabang}
        statusAudit={statusAudit}
        catatanAuditor={catatanAuditor}
        isLocked={isLocked}
        skorMaks={skorMaks}
        totalNilaiSkorMandiri={totalNilaiSkor}
        isOpen={isOpen && !isLocked}
      />

      {/* =========================================================================
          KARTU METRIK OPERASIONAL
          ========================================================================= */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Progres Pengisian */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Progres Pengisian
            </CardTitle>
            <ClockIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {itemTerisi}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {totalItem} item
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <Progress value={itemTerisi} max={totalItem} />
              <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                {Math.round((itemTerisi / totalItem) * 100)}% selesai
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Butir Berlampiran Bukti */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Bukti Pendukung
            </CardTitle>
            <PaperclipIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {itemBerlampiran}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                butir
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {itemBerlampiran > 0
                ? "Memiliki lampiran file/dokumen"
                : "Belum ada lampiran diunggah"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Item Belum Terisi */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Item Belum Terisi
            </CardTitle>
            <AlertCircleIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {itemBelumTerisi}{" "}
              <span className="text-xs font-normal text-muted-foreground">item</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {itemBelumTerisi === 0
                ? "Semua butir selesai diisi"
                : "Perlu segera dilengkapi"}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Status Audit SIA */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Status Audit SIA
            </CardTitle>
            <ShieldCheckIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="mt-1">
              <Badge
                variant={
                  statusAudit === "Sudah Diaudit"
                    ? "success"
                    : statusAudit === "Sedang Diaudit"
                    ? "secondary"
                    : "outline"
                }
              >
                {statusAudit}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isLocked
                ? "Form dikunci oleh Auditor"
                : isOpen
                ? "Instrumen terbuka untuk diisi"
                : "Periode audit telah ditutup"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          CAPAIAN 5 PILAR KEPATUHAN
          ========================================================================= */}
      <UserPilarBreakdown rows={rows} />

      {/* =========================================================================
          DAFTAR ITEM BELUM DIISI / KARTU TUNTAS
          ========================================================================= */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 pb-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Daftar Pertanyaan yang Belum Diisi
              </CardTitle>
              <CardDescription className="text-xs">
                Lengkapi seluruh item penilaian mandiri berikut untuk memaksimalkan capaian kepatuhan cabang Anda.
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">
              {daftarBelumTerisi.length} Item Tersisa
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {daftarBelumTerisi.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2Icon className="size-6" />
              </div>
              <p className="text-base font-semibold text-foreground">Alhamdulillah, seluruh 72 item telah terisi lengkap!</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Isian instrumen kepatuhan cabang Anda telah lengkap. Anda dapat meninjau kembali berkas pendukung atau memantau evaluasi penilaian dari Auditor SIA.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/audit" />}
                  nativeButton={false}
                  className="text-xs"
                >
                  Tinjau Instrumen
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  render={<Link href="/penilaian" />}
                  nativeButton={false}
                  className="text-xs"
                >
                  Lihat Rekap Penilaian
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">No</TableHead>
                  <TableHead className="w-56">Pilar & Variabel</TableHead>
                  <TableHead>Pertanyaan Instrumen</TableHead>
                  <TableHead className="w-20 text-center">Bobot</TableHead>
                  <TableHead className="w-36 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daftarBelumTerisi.map((item) => (
                  <TableRow key={item.nomor}>
                    <TableCell className="text-center font-medium tabular-nums text-sm">
                      #{item.nomor}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-xs text-primary">
                          {item.pilar_kode}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                          {item.variabel_nama}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-foreground line-clamp-2">
                        {item.pertanyaan}
                      </p>
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums text-xs">
                      {item.bobot}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        render={<Link href="/audit" />}
                        nativeButton={false}
                        disabled={!isOpen}
                      >
                        <span>Isi Sekarang</span>
                        <ArrowRightIcon className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
