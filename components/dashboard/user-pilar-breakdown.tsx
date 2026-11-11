"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import type { MatrixRowCabang } from "@/types/audit";
import { formatPersen } from "@/lib/format";
import {
  calculatePilarBreakdown,
  type PilarSummaryItem,
} from "@/lib/penilaian/pilar";
import { LayersIcon } from "lucide-react";

export type { PilarSummaryItem };
export { calculatePilarBreakdown };

interface UserPilarBreakdownProps {
  rows?: MatrixRowCabang[];
  pilarList?: PilarSummaryItem[];
}

export function UserPilarBreakdown({ rows = [], pilarList: initialList }: UserPilarBreakdownProps) {
  const pilarList = React.useMemo(() => {
    if (initialList && initialList.length > 0) return initialList;
    return calculatePilarBreakdown(rows);
  }, [rows, initialList]);

  if (pilarList.length === 0) return null;

  return (
    <Card className="border shadow-xs">
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <LayersIcon className="size-4 text-primary" />
            <span>Capaian 5 Pilar Kepatuhan</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Distribusi pemenuhan instrumen dan estimasi capaian nilai per pilar kepatuhan integratif.
          </CardDescription>
        </div>
        <StatusBadge status="neutral" label={`${pilarList.length} Pilar`} size="xs" />
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {pilarList.map((p) => {
            const isComplete = p.itemTerisi === p.totalItem && p.totalItem > 0;
            const itemPercent = p.totalItem > 0 ? Math.round((p.itemTerisi / p.totalItem) * 100) : 0;

            const progressVariant = isComplete
              ? "success"
              : itemPercent >= 75
              ? "info"
              : itemPercent >= 50
              ? "warning"
              : "danger";

            return (
              <div
                key={p.kode}
                className="flex flex-col justify-between rounded-lg border bg-card p-3 shadow-2xs hover:border-primary/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-primary tracking-wide">
                      {p.kode}
                    </span>
                    {isComplete ? (
                      <StatusBadge
                        status="success"
                        label="Lengkap"
                        icon={true}
                        size="xs"
                      />
                    ) : (
                      <StatusBadge
                        status={itemPercent >= 50 ? "info" : "warning"}
                        label={`${itemPercent}%`}
                        size="xs"
                      />
                    )}
                  </div>

                  <h3 className="text-xs font-semibold leading-tight line-clamp-2 min-h-[32px] text-foreground">
                    {p.nama}
                  </h3>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground">Nilai Capaian:</span>
                    <span className="font-bold tabular-nums text-foreground">
                      {formatPersen(p.persenSkor)}
                    </span>
                  </div>

                  <Progress
                    value={p.itemTerisi}
                    max={p.totalItem}
                    variant={progressVariant}
                    className="h-1.5"
                  />

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
                    <span>
                      {p.itemTerisi}/{p.totalItem} butir
                    </span>
                    <span>
                      {p.totalNilaiSkor}/{p.skorMaks} poin
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
