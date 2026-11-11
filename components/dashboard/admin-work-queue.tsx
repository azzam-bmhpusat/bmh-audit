"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PenilaianAdmin } from "@/types/audit";
import {
  ClipboardCheckIcon,
  SearchIcon,
  FileCheckIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
} from "lucide-react";

interface AdminWorkQueueProps {
  penilaianList: PenilaianAdmin[];
  selectedPeriodeId: number;
}

const idDecimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function AdminWorkQueue({
  penilaianList,
  selectedPeriodeId,
}: AdminWorkQueueProps) {
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("siap");

  // Filter berdasarkan pencarian
  const filteredList = React.useMemo(() => {
    if (!search.trim()) return penilaianList;
    const q = search.toLowerCase();
    return penilaianList.filter(
      (c) =>
        c.entitas_audit.toLowerCase().includes(q) ||
        c.nama_lembaga.toLowerCase().includes(q)
    );
  }, [penilaianList, search]);

  // Kategorisasi ke dalam tabs
  const siapDiauditList = React.useMemo(() => {
    return filteredList.filter(
      (c) =>
        c.jumlah_butir_terisi === (c.jumlah_indikator || 72) &&
        c.status_audit !== "Sudah Diaudit"
    );
  }, [filteredList]);

  const belumLengkapList = React.useMemo(() => {
    return filteredList.filter(
      (c) => c.jumlah_butir_terisi < (c.jumlah_indikator || 72)
    );
  }, [filteredList]);

  const selesaiDiauditList = React.useMemo(() => {
    return filteredList.filter((c) => c.status_audit === "Sudah Diaudit");
  }, [filteredList]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Sudah Diaudit":
        return <Badge variant="success">Sudah Diaudit</Badge>;
      case "Sedang Diaudit":
        return <Badge variant="secondary">Sedang Diaudit</Badge>;
      default:
        return <Badge variant="outline">Belum Diaudit</Badge>;
    }
  };

  const getGradeBadge = (grade: string | null | undefined) => {
    if (!grade || grade === "—") return <span className="text-muted-foreground">—</span>;
    switch (grade.toUpperCase()) {
      case "A":
        return <Badge variant="default">{grade}</Badge>;
      case "B":
        return <Badge variant="secondary">{grade}</Badge>;
      case "C":
      case "D":
        return <Badge variant="outline">{grade}</Badge>;
      case "E":
        return <Badge variant="destructive">{grade}</Badge>;
      default:
        return <Badge variant="outline">{grade}</Badge>;
    }
  };

  const renderTable = (items: PenilaianAdmin[], emptyMessage: string) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
          <CheckCircle2Icon className="size-8 text-muted-foreground/60" />
          <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Tidak ada perwakilan cabang dalam kategori ini saat ini.
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">No</TableHead>
            <TableHead>Cabang / Perwakilan</TableHead>
            <TableHead className="w-48">Progres Audite</TableHead>
            <TableHead className="w-36">Status Audit SIA</TableHead>
            <TableHead className="w-28 text-right">Skor Mandiri</TableHead>
            <TableHead className="w-32 text-right">Skor & Predikat SIA</TableHead>
            <TableHead className="w-36 text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c, index) => {
            const total = c.jumlah_indikator || 72;
            const isAuditeComplete = c.jumlah_butir_terisi === total;
            const percentAudite = Math.round((c.jumlah_butir_terisi / total) * 100);

            return (
              <TableRow key={c.cabang_id} className="hover:bg-muted/30">
                <TableCell className="text-center font-medium text-xs tabular-nums">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-xs text-foreground">
                      {c.entitas_audit}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {c.nama_lembaga}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] tabular-nums">
                      <span className={isAuditeComplete ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>
                        {c.jumlah_butir_terisi}/{total} item
                      </span>
                      <span className="font-medium">{percentAudite}%</span>
                    </div>
                    <Progress value={c.jumlah_butir_terisi} max={total} className="h-1.5" />
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(c.status_audit)}</TableCell>
                <TableCell className="text-right font-medium text-xs tabular-nums">
                  {c.jumlah_butir_terisi > 0 ? (
                    <div>
                      <span>{idDecimalFormatter.format(c.nilai_akhir_audite)}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">
                        ({c.nilai_kepatuhan_audite})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium text-xs tabular-nums">
                  {c.status_audit !== "Belum Diaudit" && c.jumlah_butir_diaudit > 0 ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{idDecimalFormatter.format(c.nilai_akhir_auditor)}</span>
                      {getGradeBadge(c.nilai_kepatuhan_auditor)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">Belum Dinilai</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant={c.status_audit === "Sudah Diaudit" ? "outline" : "default"}
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      render={
                        <Link
                          href={`/nilai-audit?cabang=${c.cabang_id}&periode=${selectedPeriodeId}`}
                        />
                      }
                      nativeButton={false}
                    >
                      <ClipboardCheckIcon className="size-3" />
                      <span>{c.status_audit === "Sudah Diaudit" ? "Ubah" : "Audit"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      render={
                        <Link
                          href={`/admin/penilaian/${c.cabang_id}?periode=${selectedPeriodeId}`}
                        />
                      }
                      nativeButton={false}
                      title="Lihat Detail Penilaian"
                    >
                      <FileCheckIcon className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="text-base font-semibold">
            Pusat Kendali & Antrean Audit Perwakilan
          </CardTitle>
          <CardDescription className="text-xs">
            Kelola tahapan pengujian, verifikasi instrumen, dan penerbitan predikat kepatuhan cabang.
          </CardDescription>
        </div>

        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari nama cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Menu bar tab antrean: scroll horizontal mulus pada layar mobile, grid 4 kolom pada tablet & desktop */}
          <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-4 h-9 p-1 bg-muted/60 rounded-lg gap-1 shrink-0 min-w-full sm:min-w-0">
              <TabsTrigger
                value="siap"
                className="gap-1.5 text-xs px-3 py-1.5 shrink-0 whitespace-nowrap data-active:bg-background data-active:text-foreground data-active:shadow-xs rounded-md transition-all"
              >
                <ClockIcon className="size-3.5 text-amber-500 shrink-0" />
                <span>Siap Diaudit</span>
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-background/90 dark:bg-muted px-1.5 py-0.2 text-[10px] font-semibold tabular-nums text-foreground shadow-2xs">
                  {siapDiauditList.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="belum"
                className="gap-1.5 text-xs px-3 py-1.5 shrink-0 whitespace-nowrap data-active:bg-background data-active:text-foreground data-active:shadow-xs rounded-md transition-all"
              >
                <AlertCircleIcon className="size-3.5 text-rose-500 shrink-0" />
                <span>Belum Lengkap</span>
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-background/90 dark:bg-muted px-1.5 py-0.2 text-[10px] font-semibold tabular-nums text-foreground shadow-2xs">
                  {belumLengkapList.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="selesai"
                className="gap-1.5 text-xs px-3 py-1.5 shrink-0 whitespace-nowrap data-active:bg-background data-active:text-foreground data-active:shadow-xs rounded-md transition-all"
              >
                <CheckCircle2Icon className="size-3.5 text-emerald-500 shrink-0" />
                <span>Selesai Dinilai</span>
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-background/90 dark:bg-muted px-1.5 py-0.2 text-[10px] font-semibold tabular-nums text-foreground shadow-2xs">
                  {selesaiDiauditList.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="semua"
                className="gap-1.5 text-xs px-3 py-1.5 shrink-0 whitespace-nowrap data-active:bg-background data-active:text-foreground data-active:shadow-xs rounded-md transition-all"
              >
                <span>Semua Cabang</span>
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-background/90 dark:bg-muted px-1.5 py-0.2 text-[10px] font-semibold tabular-nums text-foreground shadow-2xs">
                  {filteredList.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="siap" className="p-0 border rounded-md overflow-x-auto">
            {renderTable(siapDiauditList, "Tidak ada cabang yang menunggu verifikasi")}
          </TabsContent>

          <TabsContent value="belum" className="p-0 border rounded-md overflow-x-auto">
            {renderTable(belumLengkapList, "Semua cabang telah melengkapi pengisian mandiri")}
          </TabsContent>

          <TabsContent value="selesai" className="p-0 border rounded-md overflow-x-auto">
            {renderTable(selesaiDiauditList, "Belum ada cabang yang selesai dinilai")}
          </TabsContent>

          <TabsContent value="semua" className="p-0 border rounded-md overflow-x-auto">
            {renderTable(filteredList, "Tidak ada data perwakilan cabang ditemukan")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
