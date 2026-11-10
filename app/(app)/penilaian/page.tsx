import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getPredikat, getPenilaianCabang } from "@/lib/penilaian/queries";
import { PredikatTable } from "@/components/penilaian/predikat-table";
import { RekapTableCabang } from "@/components/penilaian/rekap-table-cabang";
import { PeriodePicker } from "@/components/penilaian/periode-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { searchParamsSchema } from "@/lib/schemas";
import type { Periode } from "@/types/audit";
import { AlertCircleIcon, InfoIcon } from "lucide-react";

export const instant = false;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PreviewPenilaianUserPage(props: PageProps) {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Jika admin membuka halaman ini, alihkan ke review admin
  if (session.profile.role !== "user") {
    redirect("/admin/penilaian");
  }

  const { profile } = session;

  if (!profile.cabang_id) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Akun Belum Ditautkan</AlertTitle>
          <AlertDescription>
            Akun Anda belum ditautkan ke cabang mana pun. Silakan hubungi
            auditor SIA BMH.
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
  const isOpen = periodeAktif?.is_open ?? true;

  // 2. Query paralel tabel standar predikat & rekap penilaian cabang
  const [predikatList, penilaianCabang] = await Promise.all([
    getPredikat(),
    getPenilaianCabang(periodeId),
  ]);

  const activeNilai =
    penilaianCabang && penilaianCabang.jumlah_butir_terisi > 0
      ? penilaianCabang.nilai_kepatuhan
      : null;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-8">
      {/* Header Halaman & Pemilih Periode */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight uppercase">
            Preview Penilaian & Rekapitulasi Kepatuhan
          </h1>
          <p className="text-xs text-muted-foreground">
            Laporan hasil evaluasi audit kepatuhan integratif LAZNAS BMH
          </p>
        </div>

        <PeriodePicker
          periodeList={periodeList}
          selectedPeriodeId={periodeId}
        />
      </div>

      {/* Bagian 1: Tabel Standar Predikat (Highlight Hasil Cabang) */}
      <section>
        <PredikatTable
          predikatList={predikatList}
          activeNilai={activeNilai}
        />
      </section>

      {/* Bagian 2: Tabel Rekapitulasi & Indikator Kelengkapan */}
      <section>
        {penilaianCabang ? (
          <RekapTableCabang
            penilaian={penilaianCabang}
            isOpen={isOpen}
          />
        ) : (
          <Alert>
            <InfoIcon className="size-4" />
            <AlertTitle>Belum Ada Data Penilaian</AlertTitle>
            <AlertDescription>
              Data rekapitulasi untuk periode ini belum tersedia di database.
            </AlertDescription>
          </Alert>
        )}
      </section>
    </main>
  );
}
