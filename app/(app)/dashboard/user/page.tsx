import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
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
import { nilaiSkor, persen, skorMaksimum, subtotal } from "@/lib/scoring";
import { formatPersen } from "@/lib/format";
import { matrixRowCabangSchema } from "@/lib/schemas";
import type { Periode } from "@/types/audit";
import { z } from "zod";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileSpreadsheetIcon,
  ArrowRightIcon,
  PercentIcon,
  InfoIcon,
} from "lucide-react";

export const instant = false;

export default async function UserDashboardPage() {
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

  const supabase = await createClient();

  // 1. Ambil periode aktif
  const { data: rawPeriodeList } = await supabase
    .from("periode")
    .select("*")
    .order("id", { ascending: false });

  const periodeList = (rawPeriodeList ?? []) as Periode[];
  const periodeAktif =
    periodeList.find((p) => p.is_open) ?? (periodeList[0] || null);

  if (!periodeAktif) {
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

  // 2. Ambil data instrumen audit cabang
  const { data: rawMatrix, error: matrixError } = await supabase
    .from("v_audit_matrix_cabang")
    .select("*")
    .eq("periode_id", periodeAktif.id)
    .eq("cabang_id", profile.cabang_id)
    .order("nomor");

  if (matrixError) {
    console.error("Gagal mengambil data matriks cabang:", matrixError);
    throw new Error("Gagal memuat ringkasan audit cabang.");
  }

  const rows = z.array(matrixRowCabangSchema).parse(rawMatrix ?? []);

  // 3. Hitung metrik agregat
  const totalItem = rows.length || 72;
  const itemTerisi = rows.filter((r) => r.skor_audite !== null).length;
  const itemBelumTerisi = totalItem - itemTerisi;

  const skorMaks = skorMaksimum(rows.map((r) => r.bobot));
  const totalNilaiSkor = subtotal(
    rows.map((r) => r.nilai_skor ?? nilaiSkor(r.skor_audite, r.bobot))
  );
  const persenMandiri = persen(totalNilaiSkor, skorMaks);

  const daftarBelumTerisi = rows.filter((r) => r.skor_audite === null);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard Audite Cabang
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Perwakilan: {cabangNama || "—"} • Periode: {periodeAktif.nama}
          </p>
        </div>
        <div className="pt-2 sm:pt-0">
          <Button
            variant="default"
            size="sm"
            render={<Link href="/audit" />}
            nativeButton={false}
            className="gap-1.5"
          >
            <FileSpreadsheetIcon className="size-4" />
            <span>Buka Instrumen Audit</span>
          </Button>
        </div>
      </div>

      {/* Banner informasi jika periode ditutup */}
      {!periodeAktif.is_open && (
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Periode Ditutup</AlertTitle>
          <AlertDescription>
            Periode audit ini telah ditutup oleh Auditor SIA. Pengisian instrumen berstatus hanya-baca (read-only).
          </AlertDescription>
        </Alert>
      )}

      {/* Kartu Ringkasan Metrik */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
                ? "Semua item selesai diisi"
                : "Perlu segera dilengkapi"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Estimasi Capaian Mandiri
            </CardTitle>
            <PercentIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {formatPersen(persenMandiri)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total nilai: {totalNilaiSkor} / {skorMaks}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Status Periode
            </CardTitle>
            <CheckCircle2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="mt-1">
              <Badge variant={periodeAktif.is_open ? "default" : "secondary"}>
                {periodeAktif.is_open ? "Terbuka untuk Pengisian" : "Ditutup"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {periodeAktif.is_open
                ? "Dapat mengisi dan mengubah data"
                : "Data terkunci"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Item Belum Terisi */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 pb-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Daftar Pertanyaan yang Belum Diisi
              </CardTitle>
              <CardDescription className="text-xs">
                Lengkapi seluruh item penilaian mandiri berikut untuk menyelesaikan instrumen audit kepatuhan.
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
              <CheckCircle2Icon className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Alhamdulillah, seluruh item telah terisi lengkap!</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Anda dapat meninjau kembali isian Anda melalui halaman Instrumen Audit atau menunggu proses evaluasi & validasi dari Auditor SIA.
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/audit" />}
                  nativeButton={false}
                >
                  Tinjau Instrumen Audit
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">No</TableHead>
                    <TableHead className="w-48">Pilar & Variabel</TableHead>
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
                          <span className="font-medium text-xs text-foreground">
                            {item.pilar_kode} — {item.pilar_nama}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
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
                          disabled={!periodeAktif.is_open}
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
