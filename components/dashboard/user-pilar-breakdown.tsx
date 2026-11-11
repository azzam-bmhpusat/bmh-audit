"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { MatrixRowCabang } from "@/types/audit";
import { formatPersen } from "@/lib/format";
import { LayersIcon, CheckCircle2Icon } from "lucide-react";

interface UserPilarBreakdownProps {
  rows: MatrixRowCabang[];
}

interface PilarSummaryItem {
  kode: string;
  nama: string;
  totalBobot: number;
  totalItem: number;
  itemTerisi: number;
  totalNilaiSkor: number;
  skorMaks: number;
  persenSkor: number;
}

export function UserPilarBreakdown({ rows }: UserPilarBreakdownProps) {
  const pilarList = React.useMemo(() => {
    const map = new Map<string, PilarSummaryItem>();

    for (const r of rows) {
      const kode = r.pilar_kode || "LAINNYA";
      const nama = r.pilar_nama || "Pilar Audit";
      const existing = map.get(kode) || {
        kode,
        nama,
        totalBobot: 0,
        totalItem: 0,
        itemTerisi: 0,
        totalNilaiSkor: 0,
        skorMaks: 0,
        persenSkor: 0,
      };

      existing.totalItem += 1;
      existing.totalBobot += r.bobot;
      if (r.skor_audite !== null) {
        existing.itemTerisi += 1;
        const nilai = r.nilai_skor ?? r.skor_audite * r.bobot;
        existing.totalNilaiSkor += nilai;
      }

      map.set(kode, existing);
    }

    const result: PilarSummaryItem[] = [];
    for (const item of map.values()) {
      item.skorMaks = item.totalBobot * 5;
      item.persenSkor =
        item.skorMaks > 0
          ? Math.round((item.totalNilaiSkor * 10000) / item.skorMaks) / 100
          : 0;
      result.push(item);
    }

    return result;
  }, [rows]);

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
        <Badge variant="outline" className="text-xs font-normal">
          {pilarList.length} Pilar
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {pilarList.map((p) => {
            const isComplete = p.itemTerisi === p.totalItem && p.totalItem > 0;
            const itemPercent = p.totalItem > 0 ? Math.round((p.itemTerisi / p.totalItem) * 100) : 0;

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
                      <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                        <CheckCircle2Icon className="size-2.5" />
                        <span>Lengkap</span>
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {itemPercent}% terisi
                      </span>
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

                  <Progress value={p.itemTerisi} max={p.totalItem} className="h-1.5" />

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
