import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircleIcon, InfoIcon, SearchIcon } from "lucide-react";
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
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight uppercase">
            TABEL MATRIKS INSTRUMEN AUDIT KEPATUHAN INTEGRATIF LAZNAS BMH
          </h1>
          <p className="text-xs text-muted-foreground">
            Satuan Internal Audit BMH
          </p>
          <p className="text-sm font-medium">Penilaian Auditor SIA</p>
        </div>

        {/* Pemilih Cabang & Periode interaktif */}
        <Suspense fallback={<div className="h-16 rounded-lg border bg-card/50 animate-pulse" />}>
          <CabangPicker
            cabangList={cabangList}
            periodeList={periodeList}
            selectedPeriodeId={periodeAktif?.id}
          />
        </Suspense>

        <Card className="border-dashed">
          <CardHeader className="text-center py-10 space-y-2">
            <SearchIcon className="size-8 mx-auto text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              Pilih Perwakilan BMH untuk mulai menilai.
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Gunakan pemilih cabang di atas untuk memuat instrumen penilaian audit kepatuhan cabang terkait.
            </p>
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
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight uppercase">
            TABEL MATRIKS INSTRUMEN AUDIT KEPATUHAN INTEGRATIF LAZNAS BMH
          </h1>
          <p className="text-xs text-muted-foreground">
            Satuan Internal Audit BMH
          </p>
          <p className="text-sm font-medium">Penilaian Auditor SIA</p>
        </div>

        <Suspense fallback={<div className="h-16 rounded-lg border bg-card/50 animate-pulse" />}>
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
            Cabang tidak ditemukan. Pilih cabang yang valid untuk mulai menilai.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (!periodeAktif) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Informasi</AlertTitle>
          <AlertDescription>
            Belum ada periode audit yang tersedia.
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
      {/* Pemilih Cabang & Periode interaktif di atas tabel */}
      <Suspense fallback={<div className="h-16 rounded-lg border bg-card/50 animate-pulse" />}>
        <CabangPicker
          cabangList={cabangList}
          periodeList={periodeList}
          selectedCabangId={cabang.id}
          selectedPeriodeId={periodeAktif.id}
        />
      </Suspense>

      {/* Header formal instrumen audit kepatuhan */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight uppercase">
          TABEL MATRIKS INSTRUMEN AUDIT KEPATUHAN INTEGRATIF LAZNAS BMH
        </h1>
        <p className="text-sm font-medium text-foreground">
          Periode : {periodeAktif.nama}
        </p>
        <p className="text-xs text-muted-foreground">
          Satuan Internal Audit BMH
        </p>
        <p className="text-sm font-semibold text-foreground">
          BMH Perwakilan {cabang.nama}
        </p>
      </div>

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
            Periode ini berstatus ditutup untuk cabang. Auditor tetap dapat melakukan penilaian.
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
          title: `Penilaian: ${cabang.nama}`,
          subtitle: `Periode: ${periodeAktif.nama}`,
          cabangNama: cabang.nama,
          periodeNama: periodeAktif.nama,
        }}
      />
    </main>
  );
}
