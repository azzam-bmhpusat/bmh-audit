"use client";

import * as React from "react";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAngka, formatPersen, formatRasio } from "@/lib/format";
import type { MatrixTree } from "@/types/audit";

interface TotalsFooterProps {
  data: MatrixTree;
  mode: "cabang" | "admin";
}

/**
 * Baris total di bagian bawah tabel matriks (meniru footer tabel Excel).
 */
export function TotalsFooter({ data, mode }: TotalsFooterProps) {
  if (mode !== "admin") {
    return (
      <TableFooter className="border-t bg-muted/80 font-bold">
        <TableRow className="border-t">
          {/* 1. No */}
          <TableCell className="sticky left-0 z-10 bg-muted text-center border-r shadow-xs w-14 font-bold">
            Σ
          </TableCell>

          {/* 2. Indikator / Label Total */}
          <TableCell className="align-middle min-w-[320px] uppercase tracking-wide py-3">
            Total Nilai Skor Diperoleh Cabang
          </TableCell>

          {/* 3. Regulasi */}
          <TableCell className="min-w-[260px]" />

          {/* 4. Total Bobot */}
          <TableCell className="text-right tabular-nums font-bold w-20 px-3">
            {formatAngka(data.totalBobot)}
          </TableCell>

          {/* 5. Fokus */}
          <TableCell className="min-w-[280px]" />

          {/* 6. Bukti */}
          <TableCell className="min-w-[280px]" />

          {/* 7. Lampiran */}
          <TableCell className="min-w-[220px]" />

          {/* 8. Kriteria */}
          <TableCell className="min-w-[300px]" />

          {/* 9. Skor Audite */}
          <TableCell className="w-28 text-center">
            {data.itemTerisi}/{data.totalItem}
          </TableCell>

          {/* 10. Nilai Skor Audite */}
          <TableCell className="text-right tabular-nums font-bold w-24 px-3">
            {formatAngka(data.totalNilaiSkor)}
          </TableCell>
        </TableRow>
      </TableFooter>
    );
  }

  return (
    <TableFooter className="border-t bg-muted/90 font-bold">
      <TableRow className="border-t">
        {/* 1. No */}
        <TableCell className="sticky left-0 z-10 bg-muted text-center border-r shadow-xs w-14 font-bold">
          Σ
        </TableCell>

        {/* 2. Indikator / Label Total */}
        <TableCell className="align-middle min-w-[320px] uppercase tracking-wide py-3">
          Total Nilai Skor Diperoleh / Skor Maksimum Ideal (100%)
        </TableCell>

        {/* 3. Regulasi */}
        <TableCell className="min-w-[260px]" />

        {/* 4. Total Bobot */}
        <TableCell className="text-right tabular-nums font-bold w-20 px-3">
          {formatAngka(data.totalBobot)}
        </TableCell>

        {/* 5. Fokus */}
        <TableCell className="min-w-[280px]" />

        {/* 6. Bukti */}
        <TableCell className="min-w-[280px]" />

        {/* 7. Lampiran */}
        <TableCell className="min-w-[220px]" />

        {/* 8. Validasi */}
        <TableCell className="w-28" />

        {/* 9. Kriteria */}
        <TableCell className="min-w-[300px]" />

        {/* 10. Skor Audite */}
        <TableCell className="w-28 text-center">
          {data.itemTerisi}/{data.totalItem}
        </TableCell>

        {/* 11. Total Nilai Skor Audite */}
        <TableCell className="text-right tabular-nums font-bold w-24 px-3">
          {formatAngka(data.totalNilaiSkor)}
        </TableCell>

        {/* 12. Skor Auditor */}
        <TableCell className="w-24" />

        {/* 13. Total Nilai Skor Auditor & Rasio */}
        <TableCell className="text-right tabular-nums font-bold w-28 px-3 whitespace-nowrap">
          {formatRasio(
            data.totalNilaiSkorAuditor,
            data.skorMaksimumIdeal,
            data.persenAuditor
          )}
        </TableCell>
      </TableRow>
    </TableFooter>
  );
}

interface TotalsSummaryCardProps {
  data: MatrixTree;
  title?: string;
}

/**
 * Kartu ringkasan metrik penilaian (terisi, nilai, persentase) di atas tabel.
 */
export function TotalsSummaryCard({
  data,
  title = "Ringkasan Pengisian Audit",
}: TotalsSummaryCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Progres Pengisian</span>
            <div className="text-xl font-bold tabular-nums">
              {data.itemTerisi} / {data.totalItem} item
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Total Bobot</span>
            <div className="text-xl font-bold tabular-nums">
              {formatAngka(data.totalBobot)}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Nilai Skor Audite</span>
            <div className="text-xl font-bold tabular-nums">
              {formatAngka(data.totalNilaiSkor)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {formatAngka(data.skorMaksimumIdeal)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Capaian Audite</span>
            <div className="text-xl font-bold tabular-nums">
              {formatPersen(data.persenAudite)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Kartu ringkasan metrik penilaian auditor untuk mode admin (terutama pada tampilan kartu mobile).
 */
export function TotalsAdminSummaryCard({
  data,
  title = "Ringkasan Penilaian Auditor SIA",
}: TotalsSummaryCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Dinilai Auditor</span>
            <div className="text-xl font-bold tabular-nums">
              {data.itemDinilai} / {data.totalItem} item
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Total Bobot</span>
            <div className="text-xl font-bold tabular-nums">
              {formatAngka(data.totalBobot)}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Nilai Skor SIA</span>
            <div className="text-xl font-bold tabular-nums">
              {formatAngka(data.totalNilaiSkorAuditor)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {formatAngka(data.skorMaksimumIdeal)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Capaian SIA</span>
            <div className="text-xl font-bold tabular-nums">
              {formatPersen(data.persenAuditor)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

