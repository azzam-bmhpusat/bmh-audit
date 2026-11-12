"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PenilaianAdmin } from "@/types/audit";
import {
  BarChart3Icon,
  PieChartIcon,
  ArrowUpDownIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  LayersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminCabangMonitoringChartProps {
  penilaianList: PenilaianAdmin[];
  className?: string;
}

const chartConfig = {
  skorAudite: {
    label: "Skor Mandiri",
    color: "var(--color-chart-info)",
  },
  skorAuditor: {
    label: "Skor Auditor SIA",
    color: "var(--color-chart-success)",
  },
  butirTerisi: {
    label: "Butir Terisi Mandiri",
    color: "var(--color-chart-1)",
  },
  butirDiaudit: {
    label: "Butir Dinilai SIA",
    color: "var(--color-chart-2)",
  },
  siapDiaudit: {
    label: "Siap Diaudit",
    color: "var(--color-chart-warning)",
  },
  belumLengkap: {
    label: "Belum Lengkap",
    color: "var(--color-chart-danger)",
  },
  selesaiDiaudit: {
    label: "Selesai Dinilai",
    color: "var(--color-chart-success)",
  },
} satisfies ChartConfig;

export function AdminCabangMonitoringChart({
  penilaianList,
  className,
}: AdminCabangMonitoringChartProps) {
  const [viewMode, setViewMode] = React.useState<"skor" | "progres" | "sebaran">("skor");
  const [sortBy, setSortBy] = React.useState<"skor_desc" | "skor_asc" | "nama" | "gap_desc">("skor_desc");

  // Format dan sort data untuk visualisasi
  const processedData = React.useMemo(() => {
    const list = penilaianList.map((item) => {
      // Singkatkan nama cabang untuk label sumbu X agar tidak bertumpuk
      const label = item.entitas_audit
        .replace(/^BMH\s+/i, "")
        .replace(/^PERWAKILAN\s+/i, "");

      const skorAudite = Math.round((item.nilai_akhir_audite || 0) * 100) / 100;
      const skorAuditor = Math.round((item.nilai_akhir_auditor || 0) * 100) / 100;
      const totalItem = item.jumlah_indikator || 72;
      const gap = Math.abs(skorAudite - skorAuditor);

      return {
        id: item.cabang_id,
        namaLengkap: item.entitas_audit,
        label,
        skorAudite,
        skorAuditor,
        butirTerisi: item.jumlah_butir_terisi,
        butirDiaudit: item.jumlah_butir_diaudit,
        totalItem,
        statusAudit: item.status_audit,
        predikatAuditor: item.nilai_kepatuhan_auditor || "—",
        wajibPtk: item.wajib_ptk_auditor,
        gap,
      };
    });

    // Pengurutan
    list.sort((a, b) => {
      if (sortBy === "skor_desc") return b.skorAuditor - a.skorAuditor;
      if (sortBy === "skor_asc") return a.skorAuditor - b.skorAuditor;
      if (sortBy === "gap_desc") return b.gap - a.gap;
      return a.namaLengkap.localeCompare(b.namaLengkap);
    });

    return list;
  }, [penilaianList, sortBy]);

  // Data untuk donat sebaran status kesiapan audit
  const sebaranStatusData = React.useMemo(() => {
    let siap = 0;
    let belum = 0;
    let selesai = 0;

    for (const c of penilaianList) {
      if (c.status_audit === "Sudah Diaudit") {
        selesai += 1;
      } else if (c.jumlah_butir_terisi === (c.jumlah_indikator || 72)) {
        siap += 1;
      } else {
        belum += 1;
      }
    }

    const total = penilaianList.length || 1;

    return [
      {
        name: "Selesai Dinilai",
        key: "selesaiDiaudit",
        value: selesai,
        percent: Math.round((selesai / total) * 100),
        color: "var(--color-chart-success)",
      },
      {
        name: "Siap Diaudit",
        key: "siapDiaudit",
        value: siap,
        percent: Math.round((siap / total) * 100),
        color: "var(--color-chart-warning)",
      },
      {
        name: "Belum Lengkap",
        key: "belumLengkap",
        value: belum,
        percent: Math.round((belum / total) * 100),
        color: "var(--color-chart-danger)",
      },
    ];
  }, [penilaianList]);

  // Statistik ringkasan untuk mini KPI
  const stats = React.useMemo(() => {
    const listAudited = penilaianList.filter(
      (p) => p.status_audit === "Sudah Diaudit" || (p.nilai_akhir_auditor || 0) > 0
    );

    const highest = [...listAudited].sort(
      (a, b) => (b.nilai_akhir_auditor || 0) - (a.nilai_akhir_auditor || 0)
    )[0];

    const countPtk = penilaianList.filter((p) => p.wajib_ptk_auditor).length;

    const avgAuditor =
      listAudited.length > 0
        ? Math.round(
            (listAudited.reduce((acc, curr) => acc + (curr.nilai_akhir_auditor || 0), 0) /
              listAudited.length) *
              100
          ) / 100
        : 0;

    return {
      topCabang: highest ? highest.entitas_audit : "Belum Ada",
      topSkor: highest ? Math.round(highest.nilai_akhir_auditor * 100) / 100 : 0,
      countPtk,
      avgAuditor,
      totalCabang: penilaianList.length,
    };
  }, [penilaianList]);

  return (
    <Card className={cn("border shadow-xs", className)}>
      <CardHeader className="p-4 pb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3Icon className="size-4 text-primary" />
            <span>Monitoring Performa Seluruh Cabang</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Komparasi evaluasi mandiri vs audit kepatuhan SIA seluruh perwakilan se-Indonesia.
          </CardDescription>
        </div>

        {/* Toolbar Kontrol Tampilan & Urutan */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle View Mode */}
          <div className="inline-flex rounded-lg border bg-muted/50 p-0.5 text-xs font-medium">
            <Button
              variant={viewMode === "skor" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("skor")}
              className="h-7 text-xs px-2.5 rounded-md gap-1"
            >
              <TrendingUpIcon className="size-3" />
              <span>Capaian Skor</span>
            </Button>
            <Button
              variant={viewMode === "progres" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("progres")}
              className="h-7 text-xs px-2.5 rounded-md gap-1"
            >
              <LayersIcon className="size-3" />
              <span>Progres Butir</span>
            </Button>
            <Button
              variant={viewMode === "sebaran" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("sebaran")}
              className="h-7 text-xs px-2.5 rounded-md gap-1"
            >
              <PieChartIcon className="size-3" />
              <span>Sebaran Status</span>
            </Button>
          </div>

          {/* Toggle Pengurutan (hanya saat mode bar chart) */}
          {viewMode !== "sebaran" && (
            <div className="flex items-center gap-1 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSortBy((prev) => {
                    if (prev === "skor_desc") return "skor_asc";
                    if (prev === "skor_asc") return "gap_desc";
                    if (prev === "gap_desc") return "nama";
                    return "skor_desc";
                  });
                }}
                className="h-7 text-xs px-2 gap-1"
                title="Ganti Pengurutan"
              >
                <ArrowUpDownIcon className="size-3 text-muted-foreground" />
                <span className="hidden sm:inline">Urut:</span>
                <span className="font-semibold">
                  {sortBy === "skor_desc" && "Skor Tertinggi"}
                  {sortBy === "skor_asc" && "Skor Terendah"}
                  {sortBy === "gap_desc" && "Gap Terbesar"}
                  {sortBy === "nama" && "Nama Cabang"}
                </span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4 space-y-4">
        {/* Render Chart Sesuai Mode Terpilih */}
        {viewMode === "skor" && (
          <div className="space-y-2">
            <div className="w-full overflow-x-auto pb-2">
              <div style={{ minWidth: Math.max(560, processedData.length * 36) }}>
                <ChartContainer config={chartConfig} className="h-64 sm:h-72 w-full">
                  <BarChart
                    data={processedData}
                    margin={{ top: 12, right: 12, left: -16, bottom: 24 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      fontSize={10}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      fontSize={11}
                      ticks={[0, 25, 50, 70, 85, 100]}
                    />
                    <ReferenceLine
                      y={70}
                      stroke="var(--color-chart-danger)"
                      strokeDasharray="3 3"
                      label={{
                        value: "Batas PTK (70)",
                        position: "insideTopRight",
                        fill: "var(--color-chart-danger)",
                        fontSize: 10,
                      }}
                    />
                    <ReferenceLine
                      y={85}
                      stroke="var(--color-chart-success)"
                      strokeDasharray="2 2"
                      label={{
                        value: "Target Standar A (85)",
                        position: "insideTopLeft",
                        fill: "var(--color-chart-success)",
                        fontSize: 10,
                      }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            if (!payload || payload.length === 0) return "";
                            const item = payload[0].payload;
                            return `${item.namaLengkap} (${item.statusAudit})`;
                          }}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="skorAudite"
                      fill="var(--color-chart-info)"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="skorAuditor"
                      fill="var(--color-chart-success)"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        )}

        {viewMode === "progres" && (
          <div className="space-y-2">
            <div className="w-full overflow-x-auto pb-2">
              <div style={{ minWidth: Math.max(560, processedData.length * 36) }}>
                <ChartContainer config={chartConfig} className="h-64 sm:h-72 w-full">
                  <BarChart
                    data={processedData}
                    margin={{ top: 12, right: 12, left: -16, bottom: 24 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      fontSize={10}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 72]}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      fontSize={11}
                      ticks={[0, 18, 36, 54, 72]}
                    />
                    <ReferenceLine
                      y={72}
                      stroke="var(--color-chart-neutral)"
                      strokeDasharray="3 3"
                      label={{
                        value: "Lengkap (72 butir)",
                        position: "insideTopRight",
                        fill: "var(--color-chart-neutral)",
                        fontSize: 10,
                      }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            if (!payload || payload.length === 0) return "";
                            const item = payload[0].payload;
                            return `${item.namaLengkap} — Total 72 Butir`;
                          }}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="butirTerisi"
                      fill="var(--color-chart-1)"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="butirDiaudit"
                      fill="var(--color-chart-2)"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        )}

        {viewMode === "sebaran" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center py-2">
            <ChartContainer config={chartConfig} className="h-56 sm:h-64 w-full">
              <PieChart>
                <Pie
                  data={sebaranStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {sebaranStatusData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>

            <div className="space-y-3 px-2">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Rekap Kesiapan Audit Nasional
              </div>
              <div className="space-y-2">
                {sebaranStatusData.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-medium text-foreground">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      <span className="text-sm font-bold text-foreground">
                        {item.value}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        cabang ({item.percent}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mini KPI Bar Ringkasan */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t">
          <div className="p-2 rounded-md bg-muted/40 flex flex-col justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">
              Top Skor SIA
            </span>
            <div className="mt-1 flex items-baseline gap-1 truncate">
              <span className="text-sm font-bold text-foreground tabular-nums">
                {stats.topSkor}
              </span>
              <span className="text-[10px] text-muted-foreground truncate" title={stats.topCabang}>
                {stats.topCabang}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-md bg-muted/40 flex flex-col justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">
              Rata-rata Skor SIA
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-sm font-bold text-foreground tabular-nums">
                {stats.avgAuditor}
              </span>
              <span className="text-[10px] text-muted-foreground">skor</span>
            </div>
          </div>

          <div className="p-2 rounded-md bg-muted/40 flex flex-col justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">
              Cabang Wajib PTK
            </span>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm font-bold text-foreground tabular-nums">
                {stats.countPtk}
              </span>
              {stats.countPtk > 0 ? (
                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                  Perlu Pembinaan
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                  Nihil
                </Badge>
              )}
            </div>
          </div>

          <div className="p-2 rounded-md bg-muted/40 flex flex-col justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">
              Total Perwakilan
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-sm font-bold text-foreground tabular-nums">
                {stats.totalCabang}
              </span>
              <span className="text-[10px] text-muted-foreground">cabang</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
