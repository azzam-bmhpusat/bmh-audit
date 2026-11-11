import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  getPredikat,
  getPenilaianCabang,
  getPenilaianAdmin,
} from "@/lib/penilaian/queries";
import { PredikatTable } from "@/components/penilaian/predikat-table";
import { RekapTableCabang } from "@/components/penilaian/rekap-table-cabang";
import { PeriodePicker } from "@/components/penilaian/periode-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { searchParamsSchema } from "@/lib/schemas";
import type { PenilaianAdmin, Periode } from "@/types/audit";
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

  // 2. Query paralel tabel standar predikat & rekap penilaian cabang + admin
  const [predikatList, penilaianCabang, rawPenilaianAdmin] = await Promise.all([
    getPredikat(),
    getPenilaianCabang(periodeId),
    getPenilaianAdmin(periodeId, profile.cabang_id),
  ]);

  const penilaianAdmin = rawPenilaianAdmin as PenilaianAdmin | null;

  // Fallback ke struktur PenilaianAdmin jika penilaianAdmin null tetapi penilaianCabang ada
  const penilaian: PenilaianAdmin | null =
    penilaianAdmin ??
    (penilaianCabang
      ? {
          periode_id: penilaianCabang.periode_id,
          cabang_id: penilaianCabang.cabang_id,
          nama_lembaga: penilaianCabang.nama_lembaga,
          entitas_audit: penilaianCabang.entitas_audit,
          periode_audit: penilaianCabang.periode_audit,
          jumlah_indikator: penilaianCabang.jumlah_indikator,
          total_bobot: penilaianCabang.total_bobot,
          skor_maksimum_ideal: penilaianCabang.skor_maksimum_ideal,
          jumlah_butir_terisi: penilaianCabang.jumlah_butir_terisi,
          jumlah_butir_belum_terisi: penilaianCabang.jumlah_butir_belum_terisi,
          jumlah_butir_terisi_teks: penilaianCabang.jumlah_butir_terisi_teks,
          persen_kelengkapan: penilaianCabang.persen_kelengkapan,
          jumlah_butir_berlampiran: penilaianCabang.jumlah_butir_berlampiran,
          jumlah_bukti_diunggah: 0,
          total_nilai_skor_audite: penilaianCabang.total_nilai_skor,
          nilai_akhir_audite: penilaianCabang.nilai_akhir,
          nilai_kepatuhan_audite: penilaianCabang.nilai_kepatuhan,
          predikat_kepatuhan_audite: penilaianCabang.predikat_kepatuhan,
          status_kepatuhan_audite: penilaianCabang.status_kepatuhan,
          status_audit: "Belum Diaudit",
          jumlah_butir_diaudit: 0,
          jumlah_butir_diaudit_teks: `0 / ${penilaianCabang.jumlah_indikator} Butir`,
          jumlah_terisi_belum_diaudit: penilaianCabang.jumlah_butir_terisi,
          jumlah_bukti_tervalidasi: 0,
          total_nilai_skor_auditor: 0,
          nilai_akhir_auditor: 0,
          nilai_kepatuhan_auditor: "—",
          predikat_kepatuhan_auditor: "Belum diaudit",
          status_kepatuhan_auditor: "Belum diaudit",
          wajib_ptk_auditor: penilaianCabang.wajib_ptk,
          keterangan_tindak_lanjut: penilaianCabang.keterangan_tindak_lanjut,
          selisih_skor: 0,
          selisih_nilai_akhir: 0,
        }
      : null);

  const activeNilai =
    penilaian && penilaian.jumlah_butir_diaudit > 0
      ? penilaian.nilai_kepatuhan_auditor
      : penilaian && penilaian.jumlah_butir_terisi > 0
      ? penilaian.nilai_kepatuhan_audite
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

      {/* Bagian 1: Tabel Standar Predikat (Highlight Hasil Audit / Mandiri) */}
      <section>
        <PredikatTable
          predikatList={predikatList}
          activeNilai={activeNilai}
        />
      </section>

      {/* Bagian 2: Tabel Rekapitulasi & Indikator Kelengkapan */}
      <section>
        {penilaian ? (
          <RekapTableCabang
            penilaian={penilaian}
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
