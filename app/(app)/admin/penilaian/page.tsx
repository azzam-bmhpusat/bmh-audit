import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getPenilaianAdmin, getPredikat } from "@/lib/penilaian/queries";
import { AdminCabangList } from "@/components/penilaian/admin-cabang-list";
import { PeriodePicker } from "@/components/penilaian/periode-picker";
import { PredikatTable } from "@/components/penilaian/predikat-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { searchParamsSchema } from "@/lib/schemas";
import type { PenilaianAdmin, Periode } from "@/types/audit";
import { InfoIcon } from "lucide-react";

export const instant = false;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReviewListPage(props: PageProps) {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Hanya untuk role admin
  if (session.profile.role !== "admin") {
    redirect("/penilaian");
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

  // 2. Query paralel daftar penilaian cabang dan standar predikat
  const [cabangListData, predikatList] = await Promise.all([
    getPenilaianAdmin(periodeId),
    getPredikat(),
  ]);

  const cabangList = (Array.isArray(cabangListData) ? cabangListData : []) as PenilaianAdmin[];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-8">
      {/* Header & Pemilih Periode */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight uppercase">
            Review Penilaian Kepatuhan Perwakilan
          </h1>
          <p className="text-xs text-muted-foreground">
            Portal Auditor SIA LAZNAS BMH — Evaluasi mandiri & verifikasi bukti audit
          </p>
        </div>

        <PeriodePicker
          periodeList={periodeList}
          selectedPeriodeId={periodeId}
        />
      </div>

      {/* Tabel Standar Predikat (Referensi Auditor) */}
      <section>
        <PredikatTable predikatList={predikatList} />
      </section>

      {/* Daftar Penilaian Cabang */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">
            Daftar Status Audit Seluruh Perwakilan
          </h2>
          <p className="text-xs text-muted-foreground">
            Pilih cabang untuk melakukan pengujian instrumen dan verifikasi bukti evidence
          </p>
        </div>

        <AdminCabangList
          cabangList={cabangList}
          selectedPeriodeId={periodeId}
        />
      </section>
    </main>
  );
}
