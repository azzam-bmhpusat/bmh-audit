import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RekapComparison } from "@/components/penilaian/admin-rekap-comparison";
import type { PenilaianAdmin } from "@/types/audit";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ClipboardListIcon,
  InfoIcon,
} from "lucide-react";

interface RekapTableCabangProps {
  penilaian: PenilaianAdmin;
  isOpen?: boolean;
}

const idDecimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const idIntegerFormatter = new Intl.NumberFormat("id-ID");

export function RekapTableCabang({
  penilaian,
  isOpen = true,
}: RekapTableCabangProps) {
  const isZeroFilled = penilaian.jumlah_butir_terisi === 0;

  const displayKeterangan = isZeroFilled
    ? "Cabang belum mengisi instrumen audit kepatuhan. Lengkapi isian untuk memunculkan evaluasi kepatuhan."
    : penilaian.keterangan_tindak_lanjut;

  const getAuditStatusBadge = (status: string) => {
    switch (status) {
      case "Sudah Diaudit":
        return <Badge variant="default">{status}</Badge>;
      case "Sedang Diaudit":
        return <Badge variant="secondary">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasWajibPtk = Boolean(
    penilaian.wajib_ptk_auditor ?? (penilaian as unknown as { wajib_ptk?: boolean }).wajib_ptk
  );

  return (
    <div className="space-y-6">
      {/* 1. Status Periode Tutup (Jika Berlaku) */}
      {!isOpen && (
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Periode Audit Telah Ditutup</AlertTitle>
          <AlertDescription>
            Periode audit ini telah ditutup oleh Satuan Internal Audit (SIA). Halaman
            berada dalam mode baca saja.
          </AlertDescription>
        </Alert>
      )}

      {/* 2. Indikator Kelengkapan Pengisian */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Indikator Kelengkapan Audit Mandiri
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Progres pengisian instrumen dan kelengkapan bukti lampiran cabang
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold tracking-tight tabular-nums">
                {idDecimalFormatter.format(penilaian.persen_kelengkapan)}%
              </span>
              <span className="text-xs text-muted-foreground block">
                Tingkat Kelengkapan
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={penilaian.persen_kelengkapan} className="h-2.5" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-md border p-3 bg-muted/30">
              <span className="text-muted-foreground block mb-0.5">
                Butir Soal Terisi
              </span>
              <span className="font-semibold text-sm">
                {penilaian.jumlah_butir_terisi_teks}
              </span>
            </div>
            <div className="rounded-md border p-3 bg-muted/30">
              <span className="text-muted-foreground block mb-0.5">
                Belum Terisi
              </span>
              <span className="font-semibold text-sm">
                {idIntegerFormatter.format(penilaian.jumlah_butir_belum_terisi)}{" "}
                Butir
              </span>
            </div>
            <div className="rounded-md border p-3 bg-muted/30">
              <span className="text-muted-foreground block mb-0.5">
                Butir Berlampiran Bukti
              </span>
              <span className="font-semibold text-sm">
                {idIntegerFormatter.format(penilaian.jumlah_butir_berlampiran)}{" "}
                Butir
              </span>
            </div>
          </div>

          {penilaian.jumlah_butir_belum_terisi > 0 && isOpen && (
            <Alert className="border-warning/40 bg-warning/10 text-warning-foreground">
              <AlertTriangleIcon className="size-4 text-warning-foreground" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                <div>
                  <AlertTitle className="text-xs font-semibold">
                    Instrumen Belum Lengkap
                  </AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground">
                    Masih ada {penilaian.jumlah_butir_belum_terisi} butir belum
                    terisi, nilai akhir dapat berubah setelah dilengkapi.
                  </AlertDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/audit" />}
                  nativeButton={false}
                >
                  <ClipboardListIcon className="size-3.5 mr-1.5" />
                  <span>Lengkapi Isian</span>
                </Button>
              </div>
            </Alert>
          )}

          {hasWajibPtk && !isZeroFilled && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertTitle className="font-semibold text-xs">
                Wajib Menerbitkan PTK
              </AlertTitle>
              <AlertDescription className="text-xs">
                Hasil evaluasi kepatuhan mewajibkan penerbitan Permintaan
                Tindakan Korektif (PTK) terikat waktu atas catatan operasional.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 3. Rekapitulasi Penilaian & Perbandingan Skor (Isian Cabang vs Sudah Di Audit) */}
      <RekapComparison penilaian={penilaian} />

      {/* 4. Tabel Informasi Entitas & Parameter Audit (Tanpa Duplikasi Skor) */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">
            Informasi Entitas & Parameter Audit
          </h3>
          <p className="text-xs text-muted-foreground">
            Parameter audit kepatuhan resmi berdasarkan data perwakilan lembaga
          </p>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-1/3 font-semibold">Komponen</TableHead>
                <TableHead className="font-semibold">Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  Nama Lembaga Pengelola
                </TableCell>
                <TableCell>{penilaian.nama_lembaga}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">
                  Entitas / Unit Audit
                </TableCell>
                <TableCell className="font-semibold">
                  {penilaian.entitas_audit}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Periode Audit</TableCell>
                <TableCell>{penilaian.periode_audit}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Status Audit</TableCell>
                <TableCell>
                  {getAuditStatusBadge(penilaian.status_audit || "Belum Diaudit")}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">
                  Jumlah Indikator Pertanyaan
                </TableCell>
                <TableCell className="tabular-nums">
                  {idIntegerFormatter.format(penilaian.jumlah_indikator)} Butir
                  Pertanyaan
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">
                  Total Bobot Penilaian
                </TableCell>
                <TableCell className="tabular-nums font-semibold">
                  {idIntegerFormatter.format(penilaian.total_bobot)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">
                  Skor Maksimum Ideal (100%)
                </TableCell>
                <TableCell className="tabular-nums font-semibold">
                  {idIntegerFormatter.format(penilaian.skor_maksimum_ideal)}
                </TableCell>
              </TableRow>

              <TableRow className="bg-muted/10">
                <TableCell className="font-bold uppercase tracking-wider text-xs">
                  KETERANGAN & TINDAK LANJUT
                </TableCell>
                <TableCell className="text-sm leading-relaxed text-muted-foreground">
                  {displayKeterangan}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
