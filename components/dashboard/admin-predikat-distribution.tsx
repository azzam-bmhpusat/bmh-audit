"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PenilaianAdmin } from "@/types/audit";
import { AwardIcon, AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPredikatDistributionProps {
  penilaianList: PenilaianAdmin[];
  className?: string;
}

export function AdminPredikatDistribution({
  penilaianList,
  className,
}: AdminPredikatDistributionProps) {
  const stats = React.useMemo(() => {
    let countA = 0;
    let countB = 0;
    let countC = 0;
    let countDE = 0;
    let countBelumDiaudit = 0;
    let countWajibPTK = 0;

    for (const c of penilaianList) {
      if (c.wajib_ptk_auditor) {
        countWajibPTK += 1;
      }

      if (c.status_audit === "Belum Diaudit" || c.jumlah_butir_diaudit === 0) {
        countBelumDiaudit += 1;
        continue;
      }

      const grade = (c.nilai_kepatuhan_auditor || "").toUpperCase();
      if (grade === "A") countA += 1;
      else if (grade === "B") countB += 1;
      else if (grade === "C") countC += 1;
      else if (grade === "D" || grade === "E") countDE += 1;
      else countBelumDiaudit += 1;
    }

    const total = penilaianList.length || 1;

    return {
      countA,
      countB,
      countC,
      countDE,
      countBelumDiaudit,
      countWajibPTK,
      total,
      percentA: Math.round((countA / total) * 100),
      percentB: Math.round((countB / total) * 100),
      percentC: Math.round((countC / total) * 100),
      percentDE: Math.round((countDE / total) * 100),
      percentBelum: Math.round((countBelumDiaudit / total) * 100),
    };
  }, [penilaianList]);

  return (
    <Card className={cn("border shadow-xs", className)}>
      <CardHeader className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AwardIcon className="size-4 text-primary" />
            <span>Distribusi Predikat Kepatuhan Nasional</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Sebaran perolehan predikat kepatuhan seluruh perwakilan cabang berdasarkan hasil verifikasi Auditor SIA.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {stats.countWajibPTK > 0 ? (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangleIcon className="size-3" />
              <span>{stats.countWajibPTK} Cabang Wajib PTK</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-xs text-success-text bg-success-bg border-success-border">
              <CheckCircle2Icon className="size-3" />
              <span>0 Cabang Wajib PTK</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4 space-y-4">
        {/* Bar visualisasi proporsi sebaran nasional */}
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted/70 p-0.5 gap-0.5">
          {stats.countA > 0 && (
            <div
              style={{
                width: `${stats.percentA}%`,
                backgroundColor: "var(--color-chart-success)",
              }}
              className="h-full rounded-l-full transition-all"
              title={`Predikat A: ${stats.countA} cabang (${stats.percentA}%)`}
            />
          )}
          {stats.countB > 0 && (
            <div
              style={{
                width: `${stats.percentB}%`,
                backgroundColor: "var(--color-chart-info)",
              }}
              className="h-full transition-all"
              title={`Predikat B: ${stats.countB} cabang (${stats.percentB}%)`}
            />
          )}
          {stats.countC > 0 && (
            <div
              style={{
                width: `${stats.percentC}%`,
                backgroundColor: "var(--color-chart-warning)",
              }}
              className="h-full transition-all"
              title={`Predikat C: ${stats.countC} cabang (${stats.percentC}%)`}
            />
          )}
          {stats.countDE > 0 && (
            <div
              style={{
                width: `${stats.percentDE}%`,
                backgroundColor: "var(--color-chart-danger)",
              }}
              className="h-full transition-all"
              title={`Predikat D/E: ${stats.countDE} cabang (${stats.percentDE}%)`}
            />
          )}
          {stats.countBelumDiaudit > 0 && (
            <div
              style={{
                width: `${stats.percentBelum}%`,
                backgroundColor: "var(--color-chart-neutral)",
              }}
              className="h-full rounded-r-full transition-all"
              title={`Belum Selesai: ${stats.countBelumDiaudit} cabang (${stats.percentBelum}%)`}
            />
          )}
        </div>

        {/* Kartu Grid 5 Kategori Predikat (Responsif: 2 kolom mobile, 3 tablet, 5 desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Predikat A */}
          <div className="rounded-lg border border-success-border bg-success-bg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-success-text">
                Predikat A
              </span>
              <span className="text-[10px] text-muted-foreground">90 - 100</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-foreground tabular-nums">
                {stats.countA}
              </span>
              <span className="text-xs text-muted-foreground">cabang ({stats.percentA}%)</span>
            </div>
            <span className="text-[11px] font-medium text-success-text mt-1">
              Sangat Baik (Patuh)
            </span>
          </div>

          {/* Predikat B */}
          <div className="rounded-lg border border-info-border bg-info-bg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-info-text">
                Predikat B
              </span>
              <span className="text-[10px] text-muted-foreground">80 - 89.99</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-foreground tabular-nums">
                {stats.countB}
              </span>
              <span className="text-xs text-muted-foreground">cabang ({stats.percentB}%)</span>
            </div>
            <span className="text-[11px] font-medium text-info-text mt-1">
              Baik (Cukup Patuh)
            </span>
          </div>

          {/* Predikat C */}
          <div className="rounded-lg border border-warning-border bg-warning-bg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-warning-text">
                Predikat C
              </span>
              <span className="text-[10px] text-muted-foreground">70 - 79.99</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-foreground tabular-nums">
                {stats.countC}
              </span>
              <span className="text-xs text-muted-foreground">cabang ({stats.percentC}%)</span>
            </div>
            <span className="text-[11px] font-medium text-warning-text mt-1">
              Cukup (Kurang Patuh)
            </span>
          </div>

          {/* Predikat D & E */}
          <div className="rounded-lg border border-danger-border bg-danger-bg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-danger-text">
                Predikat D & E
              </span>
              <span className="text-[10px] text-muted-foreground">&lt; 70</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-foreground tabular-nums">
                {stats.countDE}
              </span>
              <span className="text-xs text-muted-foreground">cabang ({stats.percentDE}%)</span>
            </div>
            <span className="text-[11px] font-medium text-danger-text mt-1">
              Kurang (Wajib PTK)
            </span>
          </div>

          {/* Belum Selesai / Proses Audit */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-muted-foreground">
                Proses Audit
              </span>
              <span className="text-[10px] text-muted-foreground">Antrean</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-foreground tabular-nums">
                {stats.countBelumDiaudit}
              </span>
              <span className="text-xs text-muted-foreground">cabang ({stats.percentBelum}%)</span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground mt-1">
              Belum / Sedang Diaudit
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
