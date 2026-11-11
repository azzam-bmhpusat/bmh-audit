import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import type { PenilaianAdmin } from "@/types/audit";
import { cn } from "@/lib/utils";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  MinusIcon,
} from "lucide-react";

interface AdminRekapComparisonProps {
  penilaian: PenilaianAdmin;
}

export type RekapComparisonProps = AdminRekapComparisonProps;

const idDecimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const idIntegerFormatter = new Intl.NumberFormat("id-ID");

export function AdminRekapComparison({
  penilaian,
}: AdminRekapComparisonProps) {
  const isZeroAudite = penilaian.jumlah_butir_terisi === 0;
  const isZeroAuditor = penilaian.jumlah_butir_diaudit === 0;

  const getPredikatStatus = (nilai: string): StatusType => {
    switch (nilai.toUpperCase()) {
      case "A":
        return "success";
      case "B":
        return "info";
      case "C":
        return "warning";
      case "D":
      case "E":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">
          Rekapitulasi Penilaian & Perbandingan Skor
        </h3>
        <p className="text-xs text-muted-foreground">
          Perbandingan hasil isian mandiri cabang dengan hasil audit kepatuhan
          oleh auditor SIA
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ============================================================== */}
        {/* BLOK 1: Isian Cabang (Audite) - JANGAN PAKAI LABEL (Audited)   */}
        {/* ============================================================== */}
        <Card className="border">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight uppercase">
                  Isian Cabang (Audite)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hasil penilaian mandiri (*self-assessment*) oleh cabang
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[11px]">
                Self Assessment
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="w-1/2 text-xs font-medium text-muted-foreground">
                    Jumlah Butir Terisi
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold text-xs">
                    {penilaian.jumlah_butir_terisi_teks}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    Total Nilai Skor Diperoleh
                  </TableCell>
                  <TableCell className="tabular-nums font-bold text-sm">
                    {idIntegerFormatter.format(penilaian.total_nilai_skor_audite)}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-muted/30">
                  <TableCell className="text-xs font-semibold">
                    Nilai Akhir (Skala 100)
                  </TableCell>
                  <TableCell className="tabular-nums font-bold text-base">
                    {isZeroAudite
                      ? "0,00"
                      : idDecimalFormatter.format(penilaian.nilai_akhir_audite)}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    Nilai Kepatuhan
                  </TableCell>
                  <TableCell>
                    {isZeroAudite ? (
                      <span className="text-xs text-muted-foreground font-medium">
                        Belum ada isian
                      </span>
                    ) : (
                      <StatusBadge
                        status={getPredikatStatus(penilaian.nilai_kepatuhan_audite)}
                        size="sm"
                        className="font-bold px-2.5 py-0.5 text-xs"
                      >
                        {penilaian.nilai_kepatuhan_audite}
                      </StatusBadge>
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    Predikat Kepatuhan
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {isZeroAudite
                      ? "Belum ada penilaian"
                      : penilaian.predikat_kepatuhan_audite}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    Status Kepatuhan
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {isZeroAudite
                      ? "Belum ada penilaian"
                      : penilaian.status_kepatuhan_audite}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* BLOK 2: Sudah Di Audit (Auditor)                              */}
        {/* ============================================================== */}
        <Card className="border border-primary/20">
          <CardHeader className="pb-3 border-b bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight uppercase">
                  Sudah Di Audit
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hasil pengujian & verifikasi kepatuhan auditor SIA
                </p>
              </div>
              <Badge variant="default" className="font-mono text-[11px]">
                Audited
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="w-1/2 text-xs font-medium text-muted-foreground">
                    Jumlah Butir Diaudit
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold text-xs">
                    {penilaian.jumlah_butir_diaudit_teks}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    Jumlah Bukti Tervalidasi
                  </TableCell>
                  <TableCell className="tabular-nums text-xs">
                    {idIntegerFormatter.format(penilaian.jumlah_bukti_tervalidasi)}{" "}
                    Bukti
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    Total Nilai Skor Diperoleh (Audited)
                  </TableCell>
                  <TableCell className="tabular-nums font-bold text-sm">
                    {idIntegerFormatter.format(penilaian.total_nilai_skor_auditor)}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-muted/30">
                  <TableCell className="text-xs font-semibold">
                    Nilai Akhir (Skala 100)
                  </TableCell>
                  <TableCell className="tabular-nums font-bold text-base">
                    {isZeroAuditor
                      ? "0,00"
                      : idDecimalFormatter.format(penilaian.nilai_akhir_auditor)}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    Nilai Kepatuhan
                  </TableCell>
                  <TableCell>
                    {isZeroAuditor ? (
                      <span className="text-xs text-muted-foreground font-medium">
                        Belum diaudit
                      </span>
                    ) : (
                      <StatusBadge
                        status={getPredikatStatus(penilaian.nilai_kepatuhan_auditor)}
                        size="sm"
                        className="font-bold px-2.5 py-0.5 text-xs"
                      >
                        {penilaian.nilai_kepatuhan_auditor}
                      </StatusBadge>
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    Predikat Kepatuhan
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {isZeroAuditor
                      ? "Belum diaudit"
                      : penilaian.predikat_kepatuhan_auditor}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    Status Kepatuhan
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {isZeroAuditor
                      ? "Belum diaudit"
                      : penilaian.status_kepatuhan_auditor}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Blok Selisih Nilai & Skor */}
            <div className="p-3 border-t bg-muted/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  Selisih Skor / Nilai Akhir:
                </span>
                {isZeroAuditor ? (
                  <span className="text-xs text-muted-foreground font-medium">
                    Belum diaudit
                  </span>
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center gap-1 font-semibold tabular-nums",
                        penilaian.selisih_skor < 0
                          ? "text-destructive"
                          : "text-foreground"
                      )}
                    >
                      {penilaian.selisih_skor < 0 ? (
                        <ArrowDownIcon className="size-3" />
                      ) : penilaian.selisih_skor > 0 ? (
                        <ArrowUpIcon className="size-3" />
                      ) : (
                        <MinusIcon className="size-3 text-muted-foreground" />
                      )}
                      <span>
                        {penilaian.selisih_skor > 0 ? "+" : ""}
                        {penilaian.selisih_skor} poin
                      </span>
                    </div>

                    <div
                      className={cn(
                        "flex items-center gap-1 font-bold tabular-nums text-sm",
                        penilaian.selisih_nilai_akhir < 0
                          ? "text-destructive"
                          : "text-foreground"
                      )}
                    >
                      <span>
                        ({penilaian.selisih_nilai_akhir > 0 ? "+" : ""}
                        {idDecimalFormatter.format(penilaian.selisih_nilai_akhir)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const RekapComparison = AdminRekapComparison;
