"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PilarSummaryItem } from "@/lib/penilaian/pilar";
import { BarChart3Icon, PieChartIcon } from "lucide-react";

export type PilarChartData = PilarSummaryItem;

export interface ItemStatsData {
  totalItem: number;
  itemTerisi: number;
  itemBerlampiran: number;
  itemBelumTerisi: number;
}

interface UserDashboardChartsProps {
  pilarList: PilarChartData[];
  itemStats: ItemStatsData;
}

const barChartConfig = {
  persenSkor: {
    label: "Capaian Nilai",
    color: "var(--color-chart-info)",
  },
  target: {
    label: "Target Standar",
    color: "var(--color-chart-neutral)",
  },
} satisfies ChartConfig;

const pieChartConfig = {
  berlampiran: {
    label: "Lengkap Berlampiran",
    color: "var(--color-chart-success)",
  },
  terisiTanpaBukti: {
    label: "Terisi Tanpa Bukti",
    color: "var(--color-chart-warning)",
  },
  belumTerisi: {
    label: "Belum Diisi",
    color: "var(--color-chart-danger)",
  },
} satisfies ChartConfig;

// Helper penentu warna semantik bar chart sesuai capaian
function getBarColor(persen: number): string {
  if (persen >= 85) return "var(--color-chart-success)";
  if (persen >= 70) return "var(--color-chart-info)";
  if (persen >= 50) return "var(--color-chart-warning)";
  return "var(--color-chart-danger)";
}

export function UserDashboardCharts({
  pilarList,
  itemStats,
}: UserDashboardChartsProps) {
  // Format data bar chart pilar
  const barData = React.useMemo(() => {
    return pilarList.map((p) => {
      const shortKode = p.kode.replace("PILAR ", "P");
      return {
        pilarKey: shortKode,
        pilarFull: p.kode,
        nama: p.nama,
        persenSkor: p.persenSkor,
        totalNilaiSkor: p.totalNilaiSkor,
        skorMaks: p.skorMaks,
        itemTerisi: p.itemTerisi,
        totalItem: p.totalItem,
        fillColor: getBarColor(p.persenSkor),
      };
    });
  }, [pilarList]);

  // Format data pie chart kelengkapan butir
  const pieData = React.useMemo(() => {
    const terisiTanpaBukti = Math.max(
      0,
      itemStats.itemTerisi - itemStats.itemBerlampiran
    );

    return [
      {
        kategori: "berlampiran",
        label: "Lengkap Berlampiran",
        count: itemStats.itemBerlampiran,
        fill: "var(--color-chart-success)",
      },
      {
        kategori: "terisiTanpaBukti",
        label: "Terisi Tanpa Bukti",
        count: terisiTanpaBukti,
        fill: "var(--color-chart-warning)",
      },
      {
        kategori: "belumTerisi",
        label: "Belum Diisi",
        count: itemStats.itemBelumTerisi,
        fill: "var(--color-chart-danger)",
      },
    ].filter((item) => item.count > 0);
  }, [itemStats]);

  const totalButir = itemStats.totalItem || 72;
  const persenSelesai = Math.round(
    (itemStats.itemTerisi / totalButir) * 100
  );

  return (
    <div className="grid gap-4 lg:grid-cols-7">
      {/* =========================================================================
          GRAFIK 1: CAPAIAN 5 PILAR KEPATUHAN (BAR CHART)
          ========================================================================= */}
      <Card className="border shadow-xs lg:col-span-4">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3Icon className="size-4 text-primary" />
                <span>Grafik Capaian 5 Pilar Kepatuhan</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Performa persentase perolehan nilai instrumen per pilar audit.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground">Kriteria:</span>
              <StatusBadge status="success" size="xs" label="≥85%" />
              <StatusBadge status="info" size="xs" label="≥70%" />
              <StatusBadge status="warning" size="xs" label="≥50%" />
              <StatusBadge status="danger" size="xs" label="<50%" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          <ChartContainer
            config={barChartConfig}
            className="aspect-auto h-[230px] w-full"
          >
            <BarChart
              data={barData}
              margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="pilarKey"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
                fontSize={11}
              />
              <ChartTooltip
                cursor={{ fill: "var(--color-muted)", opacity: 0.2 }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="font-semibold text-foreground">
                          {item.payload.pilarFull}: {item.payload.nama}
                        </span>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Capaian:</span>
                          <span className="font-bold tabular-nums text-foreground">
                            {value}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[11px] text-muted-foreground">
                          <span>Poin:</span>
                          <span className="tabular-nums">
                            {item.payload.totalNilaiSkor} / {item.payload.skorMaks}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[11px] text-muted-foreground">
                          <span>Kelengkapan:</span>
                          <span className="tabular-nums">
                            {item.payload.itemTerisi} / {item.payload.totalItem} butir
                          </span>
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="persenSkor"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              >
                {barData.map((entry, index) => (
                  <Cell key={`bar-cell-${index}`} fill={entry.fillColor} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* =========================================================================
          GRAFIK 2: KOMPOSISI KELENGKAPAN DOKUMEN & BUTIR (DONUT CHART)
          ========================================================================= */}
      <Card className="border shadow-xs lg:col-span-3">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PieChartIcon className="size-4 text-primary" />
                <span>Kesiapan Bukti Pendukung</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Komposisi pengisian dan bukti lampiran {totalButir} butir.
              </CardDescription>
            </div>
            <StatusBadge
              status={
                persenSelesai === 100
                  ? "success"
                  : persenSelesai >= 60
                  ? "info"
                  : "warning"
              }
              size="xs"
              label={`${persenSelesai}% Terisi`}
            />
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-1 flex flex-col justify-between">
          <ChartContainer
            config={pieChartConfig}
            className="aspect-auto h-[160px] w-full"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-foreground">
                          {item.payload.label}:
                        </span>
                        <span className="font-bold tabular-nums">
                          {value} butir ({Math.round(((value as number) / totalButir) * 100)}%)
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={pieData}
                dataKey="count"
                nameKey="kategori"
                innerRadius={46}
                outerRadius={68}
                paddingAngle={3}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Legend Detail Kelengkapan */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-success-text flex items-center gap-1">
                <span className="size-2 rounded-full bg-success-text inline-block" />
                Berlampiran
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {itemStats.itemBerlampiran}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-warning-text flex items-center gap-1">
                <span className="size-2 rounded-full bg-warning-text inline-block" />
                Tanpa Bukti
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {Math.max(0, itemStats.itemTerisi - itemStats.itemBerlampiran)}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-danger-text flex items-center gap-1">
                <span className="size-2 rounded-full bg-danger-text inline-block" />
                Belum Diisi
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {itemStats.itemBelumTerisi}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
