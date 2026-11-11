import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  getItemPoinList,
  getMatrixAdmin,
  getPenilaianAdmin,
  getPredikat,
} from "@/lib/penilaian/queries";
import { buildMatrixTree } from "@/lib/matrix";
import { AdminDetailView } from "@/components/penilaian/admin-detail-view";
import { PeriodePicker } from "@/components/penilaian/periode-picker";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { searchParamsSchema } from "@/lib/schemas";
import type { PenilaianAdmin, Periode } from "@/types/audit";
import { ChevronLeftIcon, InfoIcon } from "lucide-react";

export const instant = false;

interface PageProps {
  params: Promise<{ cabangId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReviewDetailPage(props: PageProps) {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Khusus role admin
  if (session.profile.role !== "admin") {
    redirect("/penilaian");
  }

  const { cabangId: rawCabangId } = await props.params;
  const cabangId = parseInt(rawCabangId, 10);

  if (isNaN(cabangId) || cabangId <= 0) {
    notFound();
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
            Belum ada periode audit yang tersedia di sistem.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const periodeAktif = parsedParams.periode
    ? periodeList.find((p) => p.id === parsedParams.periode) ?? periodeList[0]
    : periodeList.find((p) => p.is_open) ?? (periodeList[0] || null);

  const periodeId = periodeAktif?.id ?? periodeList[0].id;

  // 2. Query paralel: Standar predikat, Rekap admin cabang tunggal, Matriks admin 72 butir, Detail 5 poin, dan status kunci cabang
  const [predikatList, penilaianData, matrixRows, poinList, lockStatusRes] = await Promise.all([
    getPredikat(),
    getPenilaianAdmin(periodeId, cabangId),
    getMatrixAdmin(periodeId, cabangId),
    getItemPoinList(),
    supabase
      .from("audit_status_cabang")
      .select("is_locked")
      .eq("periode_id", periodeId)
      .eq("cabang_id", cabangId)
      .maybeSingle(),
  ]);

  const penilaian = penilaianData as PenilaianAdmin | null;

  if (!penilaian) {
    notFound();
  }

  const isFormLocked = lockStatusRes?.data?.is_locked ?? false;

  // 3. Susun pohon struktur matriks (Pilar -> Variabel -> Item + Poin)
  const matrixTree = buildMatrixTree(matrixRows, poinList);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-8">
      {/* Header dengan Tombol Kembali & Pemilih Periode */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              render={<Link href={`/admin/penilaian?periode=${periodeId}`} />}
              nativeButton={false}
            >
              <ChevronLeftIcon className="size-3.5 mr-1" />
              <span>Daftar Cabang</span>
            </Button>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {penilaian.entitas_audit}
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight uppercase">
            Penilaian Audit: {penilaian.entitas_audit}
          </h1>
          <p className="text-xs text-muted-foreground">
            {penilaian.nama_lembaga} • {penilaian.periode_audit}
          </p>
        </div>

        <PeriodePicker
          periodeList={periodeList}
          selectedPeriodeId={periodeId}
        />
      </div>

      {/* 3 Bagian Review: Predikat, Rekapitulasi 2 Blok, Matriks Editor */}
      <AdminDetailView
        periodeId={periodeId}
        cabangId={cabangId}
        penilaian={penilaian}
        predikatList={predikatList}
        matrixTree={matrixTree}
        poinList={poinList}
        isLocked={isFormLocked}
      />
    </main>
  );
}
