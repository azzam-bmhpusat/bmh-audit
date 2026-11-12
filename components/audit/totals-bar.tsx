"use client";

import * as React from "react";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { formatAngka, formatPersen, formatRasio } from "@/lib/format";
import type { MatrixTree } from "@/types/audit";

function getCapaianStatus(persen: number): "success" | "info" | "warning" | "danger" {
  if (persen >= 80) return "success";
  if (persen >= 65) return "info";
  if (persen >= 50) return "warning";
  return "danger";
}

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

          {/* 11. Catatan Auditor */}
          <TableCell className="w-28" />
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
  compact?: boolean;
}

/**
 * Kartu ringkasan metrik penilaian (terisi, nilai, persentase) di atas tabel.
 */
export function TotalsSummaryCard({
  data,
  title = "Ringkasan Pengisian Audit",
  compact = false,
}: TotalsSummaryCardProps) {
  const isLengkap = data.totalItem > 0 && data.itemTerisi === data.totalItem;
  const progresPersen = data.totalItem > 0 ? (data.itemTerisi / data.totalItem) * 100 : 0;
  const capaianStatus = getCapaianStatus(data.persenAudite);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-card text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Progres:</span>
          <span className="font-bold tabular-nums text-foreground">
            {data.itemTerisi} / {data.totalItem} item
          </span>
          <StatusBadge
            status={isLengkap ? "success" : data.itemTerisi > 0 ? "warning" : "neutral"}
            size="xs"
            icon={true}
          >
            {isLengkap ? "Lengkap" : data.itemTerisi > 0 ? "Belum Lengkap" : "Belum Diisi"}
          </StatusBadge>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Total Bobot:</span>
          <span className="font-bold tabular-nums text-foreground">
            {formatAngka(data.totalBobot)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Nilai Skor:</span>
          <span className="font-bold tabular-nums text-foreground">
            {formatAngka(data.totalNilaiSkor)}{" "}
            <span className="text-[10px] font-normal text-muted-foreground">
              / {formatAngka(data.skorMaksimumIdeal)}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Capaian:</span>
          <StatusBadge status={capaianStatus} size="xs">
            {formatPersen(data.persenAudite)}
          </StatusBadge>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight">
            {title}
          </CardTitle>
          <StatusBadge
            status={isLengkap ? "success" : data.itemTerisi > 0 ? "warning" : "neutral"}
            size="sm"
            icon={true}
          >
            {isLengkap ? "Seluruh Butir Lengkap" : `${data.itemTerisi} dari ${data.totalItem} Terisi`}
          </StatusBadge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Progres Pengisian</span>
            <div className="text-xl font-bold tabular-nums">
              {data.itemTerisi} / {data.totalItem} item
            </div>
            <Progress
              value={progresPersen}
              variant={isLengkap ? "success" : "warning"}
              className="h-1.5 w-full"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Total Bobot</span>
            <div className="text-xl font-bold tabular-nums">
              {formatAngka(data.totalBobot)}
            </div>
            <div className="text-[11px] text-muted-foreground">Bobot instrumen audit</div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Nilai Skor Audite</span>
            <div className="text-xl font-bold tabular-nums">
              {formatAngka(data.totalNilaiSkor)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {formatAngka(data.skorMaksimumIdeal)}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">Dari skor maksimum ideal</div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Capaian Audite</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tabular-nums">
                {formatPersen(data.persenAudite)}
              </span>
              <StatusBadge status={capaianStatus} size="sm">
                {data.persenAudite >= 80 ? "Sangat Baik" : data.persenAudite >= 65 ? "Baik" : data.persenAudite >= 50 ? "Cukup" : "Perlu Perbaikan"}
              </StatusBadge>
            </div>
            <div className="text-[11px] text-muted-foreground">Klasifikasi kepatuhan</div>
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
  compact = false,
}: TotalsSummaryCardProps) {
  const itemDinilai = React.useMemo(() => {
    let count = 0;
    for (const p of data?.pilarList ?? []) {
      for (const v of p?.variabelList ?? []) {
        for (const item of v?.items ?? []) {
          if (
            "skor_auditor" in item &&
            item.skor_auditor !== null &&
            item.skor_auditor !== undefined
          ) {
            count++;
          }
        }
      }
    }
    return count;
  }, [data?.pilarList]);

  const isLengkap = data.totalItem > 0 && itemDinilai === data.totalItem;
  const progresPersen = data.totalItem > 0 ? (itemDinilai / data.totalItem) * 100 : 0;
  const capaianStatus = getCapaianStatus(data.persenAuditor ?? 0);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-card text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Dinilai Auditor:</span>
          <span className="font-bold tabular-nums text-foreground">
            {itemDinilai} / {data.totalItem} item
          </span>
          <StatusBadge
            status={isLengkap ? "success" : itemDinilai > 0 ? "warning" : "neutral"}
            size="xs"
            icon={true}
          >
            {isLengkap ? "Lengkap" : itemDinilai > 0 ? "Sebagian" : "Belum"}
          </StatusBadge>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Total Bobot:</span>
          <span className="font-bold tabular-nums text-foreground">
            {formatAngka(data.totalBobot)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Nilai SIA:</span>
          <span className="font-bold tabular-nums text-foreground">
            {formatAngka(data.totalNilaiSkorAuditor ?? 0)}{" "}
            <span className="text-[10px] font-normal text-muted-foreground">
              / {formatAngka(data.skorMaksimumIdeal)}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Capaian:</span>
          <StatusBadge status={capaianStatus} size="xs">
            {formatPersen(data.persenAuditor ?? 0)}
          </StatusBadge>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight">
            {title}
          </CardTitle>
          <StatusBadge
            status={isLengkap ? "success" : itemDinilai > 0 ? "warning" : "neutral"}
            size="sm"
            icon={true}
          >
            {isLengkap ? "Lengkap Dinilai" : `${itemDinilai} dari ${data.totalItem} Dinilai`}
          </StatusBadge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Dinilai Auditor</span>
            <div className="text-xl font-bold tabular-nums">
              {itemDinilai} / {data.totalItem} item
            </div>
            <Progress
              value={progresPersen}
              variant={isLengkap ? "success" : "warning"}
              className="h-1.5 w-full"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Total Bobot</span>
            <div className="text-xl font-bold tabular-nums">
              {formatAngka(data.totalBobot)}
            </div>
            <div className="text-[11px] text-muted-foreground">Bobot instrumen audit</div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Nilai Skor SIA</span>
            <div className="text-xl font-bold tabular-nums">
              {formatAngka(data.totalNilaiSkorAuditor ?? 0)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {formatAngka(data.skorMaksimumIdeal)}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">Dari skor maksimum ideal</div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Capaian SIA</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tabular-nums">
                {formatPersen(data.persenAuditor ?? 0)}
              </span>
              <StatusBadge status={capaianStatus} size="sm">
                {(data.persenAuditor ?? 0) >= 80 ? "Sangat Baik" : (data.persenAuditor ?? 0) >= 65 ? "Baik" : (data.persenAuditor ?? 0) >= 50 ? "Cukup" : "Perlu Perbaikan"}
              </StatusBadge>
            </div>
            <div className="text-[11px] text-muted-foreground">Klasifikasi kepatuhan auditor</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

