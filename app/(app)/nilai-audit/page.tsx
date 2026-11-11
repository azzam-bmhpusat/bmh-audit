import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircleIcon,
  InfoIcon,
  Building2Icon,
  ArrowRightIcon,
  ShieldCheckIcon,
  FileTextIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { itemPoinSchema, matrixRowAdminSchema, searchParamsSchema } from "@/lib/schemas";
import { buildMatrixTree } from "@/lib/matrix";
import { MatrixTable } from "@/components/audit/matrix-table";
import { CabangPicker } from "@/components/audit/cabang-picker";
import { AuditStatusControl } from "@/components/audit/audit-status-control";
import { getPenilaianAdmin } from "@/lib/penilaian/queries";
import type { Cabang, PenilaianAdmin, Periode } from "@/types/audit";
import { z } from "zod";

export const instant = false;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NilaiAuditPage(props: PageProps) {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Pengguna dengan role user diarahkan ke dashboard user
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

  // Keadaan 1: Belum memilih cabang
  if (!parsedParams.cabang) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Header Halaman Modern */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
                Portal Auditor SIA
              </Badge>
              {periodeAktif && (
                <Badge variant={periodeAktif.is_open ? "success" : "secondary"} className="text-[11px] px-2 py-0.5">
                  Periode: {periodeAktif.nama}
                </Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Penilaian Audit Perwakilan
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Matriks instrumen kepatuhan integratif LAZNAS BMH — Pilih cabang untuk memulai pengujian skor & verifikasi bukti
            </p>
          </div>
        </div>

        {/* Pemilih Cabang & Periode interaktif */}
        <Suspense fallback={<div className="h-16 rounded-xl border bg-card/50 animate-pulse" />}>
          <CabangPicker
            cabangList={cabangList}
            periodeList={periodeList}
            selectedPeriodeId={periodeAktif?.id}
          />
        </Suspense>

        {/* Card Petunjuk Alur Kerja Singkat */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-card/60 border-border/60 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <span>Pilih Perwakilan</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-xs text-muted-foreground">
                Gunakan search bar di atas atau klik langsung salah satu cabang di bawah.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/60 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <span>Uji Petik & Verifikasi</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-xs text-muted-foreground">
                Bandingkan skor mandiri cabang dengan tautan bukti dukung evidence di Google Drive.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/60 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <span>Beri Skor & Finalisasi</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-xs text-muted-foreground">
                Isi skor auditor (1-5) dan tetapkan status audit menjadi &quot;Sudah Diaudit&quot;.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Akses Cepat Daftar Semua Perwakilan */}
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2Icon className="size-4 text-primary" />
                  <span>Daftar Seluruh Perwakilan ({cabangList.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Klik langsung salah satu perwakilan di bawah untuk membuka instrumen auditnya
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {cabangList.map((c) => {
                const targetUrl = `/nilai-audit?cabang=${c.id}${periodeAktif ? `&periode=${periodeAktif.id}` : ""}`;
                return (
                  <Link
                    key={c.id}
                    href={targetUrl}
                    className="group flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background hover:bg-accent/40 hover:border-primary/40 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-2 rounded-full bg-primary/60 group-hover:bg-primary transition-colors shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {c.nama}
                      </span>
                    </div>
                    <ArrowRightIcon className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Keadaan 2: Cabang disertakan -> validasi keberadaan cabang di DB
  const cabang = cabangList.find((c) => c.id === parsedParams.cabang) ?? null;

  if (!cabang) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Penilaian Audit Perwakilan
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Satuan Internal Audit (SIA) LAZNAS BMH
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="h-16 rounded-xl border bg-card/50 animate-pulse" />}>
          <CabangPicker
            cabangList={cabangList}
            periodeList={periodeList}
            selectedPeriodeId={periodeAktif?.id}
          />
        </Suspense>

        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Perhatian</AlertTitle>
          <AlertDescription>
            Perwakilan tidak ditemukan. Silakan gunakan pemilih cabang di atas untuk memilih perwakilan yang valid.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (!periodeAktif) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Informasi</AlertTitle>
          <AlertDescription>
            Belum ada periode audit yang tersedia di sistem.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  // 3. Query paralel v_audit_matrix_admin, v_audit_item_poin, rekap penilaian admin, dan status kunci cabang
  const [matrixRes, poinRes, penilaianRes, lockStatusRes] = await Promise.all([
    supabase
      .from("v_audit_matrix_admin")
      .select("*")
      .eq("periode_id", periodeAktif.id)
      .eq("cabang_id", cabang.id)
      .order("nomor"),
    supabase
      .from("v_audit_item_poin")
      .select("*")
      .order("item_nomor")
      .order("urutan"),
    getPenilaianAdmin(periodeAktif.id, cabang.id).catch(() => null),
    supabase
      .from("audit_status_cabang")
      .select("is_locked")
      .eq("periode_id", periodeAktif.id)
      .eq("cabang_id", cabang.id)
      .maybeSingle(),
  ]);

  if (matrixRes.error) {
    console.error("Gagal memuat v_audit_matrix_admin:", matrixRes.error);
    throw new Error("Gagal memuat data matriks penilaian auditor.");
  }

  if (poinRes.error) {
    console.error("Gagal memuat v_audit_item_poin:", poinRes.error);
    throw new Error("Gagal memuat detail poin pertanyaan audit.");
  }

  // 4. Validasi skema toleran
  const rows = z.array(matrixRowAdminSchema).parse(matrixRes.data);
  const poinList = z.array(itemPoinSchema).parse(poinRes.data);
  const penilaianData = penilaianRes as PenilaianAdmin | null;

  // 5. Susun struktur pohon matriks
  const tree = buildMatrixTree(rows, poinList);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header Halaman Modern */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
              Portal Auditor SIA
            </Badge>
            <Badge variant={periodeAktif.is_open ? "success" : "secondary"} className="text-[11px] px-2 py-0.5">
              Periode: {periodeAktif.nama}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Penilaian Audit:</span>
            <span className="text-primary font-bold">BMH Perwakilan {cabang.nama}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Lakukan verifikasi bukti dukung dan input skor auditor secara objektif pada tabel matriks di bawah
          </p>
        </div>
      </div>

      {/* Pemilih Cabang & Periode interaktif di atas tabel */}
      <Suspense fallback={<div className="h-16 rounded-xl border bg-card/50 animate-pulse" />}>
        <CabangPicker
          cabangList={cabangList}
          periodeList={periodeList}
          selectedCabangId={cabang.id}
          selectedPeriodeId={periodeAktif.id}
        />
      </Suspense>

      {/* Kontrol Pemberian Status Audit & Tombol "Sudah Diaudit" dengan Popup Konfirmasi */}
      <AuditStatusControl
        periodeId={periodeAktif.id}
        cabangId={cabang.id}
        cabangNama={`BMH Perwakilan ${cabang.nama}`}
        periodeNama={periodeAktif.nama}
        initialStatus={penilaianData?.status_audit || "Belum Diaudit"}
        initialIsLocked={lockStatusRes?.data?.is_locked ?? false}
        jumlahButirTerisi={penilaianData?.jumlah_butir_terisi ?? tree.itemTerisi}
        jumlahButirDiaudit={penilaianData?.jumlah_butir_diaudit ?? 0}
        jumlahIndikator={penilaianData?.jumlah_indikator ?? tree.totalItem}
      />

      {/* Banner informasi jika periode ditutup (admin tetap dapat menilai) */}
      {!periodeAktif.is_open && (
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Periode Ditutup</AlertTitle>
          <AlertDescription>
            Periode ini berstatus ditutup untuk audite cabang. Auditor SIA tetap dapat melakukan pengujian dan penilaian.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabel matriks penilaian mode admin */}
      <MatrixTable
        mode="admin"
        data={tree}
        readOnly={false}
        periodeId={periodeAktif.id}
        cabangId={cabang.id}
        poinList={poinList}
        headerInfo={{
          title: `Penilaian: BMH Perwakilan ${cabang.nama}`,
          subtitle: `Periode: ${periodeAktif.nama}`,
          cabangNama: cabang.nama,
          periodeNama: periodeAktif.nama,
        }}
      />
    </main>
  );
}
