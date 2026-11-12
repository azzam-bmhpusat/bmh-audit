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
import { StatusBadge } from "@/components/ui/status-badge";
import type { PenilaianAdmin } from "@/types/audit";
import {
  ClipboardCheckIcon,
  SearchIcon,
  FileCheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  Building2Icon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminWorkQueueProps {
  penilaianList: PenilaianAdmin[];
  selectedPeriodeId: number;
  className?: string;
}

const idDecimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function AdminWorkQueue({
  penilaianList,
  selectedPeriodeId,
  className,
}: AdminWorkQueueProps) {
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("siap");

  // Filter berdasarkan pencarian nama cabang / entitas
  const filteredList = React.useMemo(() => {
    if (!search.trim()) return penilaianList;
    const q = search.toLowerCase();
    return penilaianList.filter(
      (c) =>
        c.entitas_audit.toLowerCase().includes(q) ||
        c.nama_lembaga.toLowerCase().includes(q)
    );
  }, [penilaianList, search]);

  // 1. Siap Diaudit: butir mandiri 72/72 lengkap tapi belum berstatus "Sudah Diaudit"
  const siapDiauditList = React.useMemo(() => {
    return filteredList.filter(
      (c) =>
        c.jumlah_butir_terisi === (c.jumlah_indikator || 72) &&
        c.status_audit !== "Sudah Diaudit"
    );
  }, [filteredList]);

  // 2. Belum Lengkap: butir mandiri masih < 72 butir
  const belumLengkapList = React.useMemo(() => {
    return filteredList.filter(
      (c) => c.jumlah_butir_terisi < (c.jumlah_indikator || 72)
    );
  }, [filteredList]);

  // 3. Selesai Dinilai: verifikasi auditor SIA sudah tuntas ("Sudah Diaudit")
  const selesaiDiauditList = React.useMemo(() => {
    return filteredList.filter((c) => c.status_audit === "Sudah Diaudit");
  }, [filteredList]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Sudah Diaudit":
        return <StatusBadge status="success" label="Sudah Diaudit" icon={true} size="sm" />;
      case "Sedang Diaudit":
        return <StatusBadge status="warning" label="Sedang Diaudit" icon={true} size="sm" />;
      default:
        return <StatusBadge status="danger" label="Belum Diaudit" icon={true} size="sm" />;
    }
  };

  const renderGradeBadge = (grade: string | null | undefined) => {
    if (!grade || grade === "—") return <span className="text-muted-foreground">—</span>;
    switch (grade.toUpperCase()) {
      case "A":
        return <Badge variant="default" className="font-bold">{grade}</Badge>;
      case "B":
        return <Badge variant="secondary" className="font-bold">{grade}</Badge>;
      case "C":
      case "D":
        return <Badge variant="outline" className="font-bold">{grade}</Badge>;
      case "E":
        return <Badge variant="destructive" className="font-bold">{grade}</Badge>;
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
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12 text-center text-xs">No</TableHead>
              <TableHead className="text-xs min-w-[200px]">Cabang / Perwakilan</TableHead>
              <TableHead className="w-48 text-xs min-w-[160px]">Progres Mandiri</TableHead>
              <TableHead className="w-36 text-xs min-w-[130px]">Status Audit SIA</TableHead>
              <TableHead className="w-28 text-right text-xs">Skor Mandiri</TableHead>
              <TableHead className="w-36 text-right text-xs">Skor & Predikat SIA</TableHead>
              <TableHead className="w-36 text-center text-xs">Aksi</TableHead>
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
                      <span className="text-[11px] text-muted-foreground line-clamp-1">
                        {c.nama_lembaga}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] tabular-nums">
                        <span className={cn(
                          isAuditeComplete ? "text-success-text font-semibold" : "text-muted-foreground"
                        )}>
                          {c.jumlah_butir_terisi}/{total} butir
                        </span>
                        <span className="font-medium text-foreground">{percentAudite}%</span>
                      </div>
                      <Progress value={c.jumlah_butir_terisi} max={total} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(c.status_audit)}</TableCell>
                  <TableCell className="text-right font-medium text-xs tabular-nums">
                    {c.jumlah_butir_terisi > 0 ? (
                      <div>
                        <span className="font-semibold text-foreground">
                          {idDecimalFormatter.format(c.nilai_akhir_audite)}
                        </span>
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
                        <span className="font-semibold text-foreground">
                          {idDecimalFormatter.format(c.nilai_akhir_auditor)}
                        </span>
                        {renderGradeBadge(c.nilai_kepatuhan_auditor)}
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
      </div>
    );
  };

  return (
    <Card className={cn("border shadow-xs", className)}>
      <CardHeader className="p-4 pb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardCheckIcon className="size-4 text-primary" />
              <span>Pusat Kendali & Antrean Audit Perwakilan</span>
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal hidden sm:inline-flex">
              {penilaianList.length} Cabang
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Kelola verifikasi instrumen, validasi bukti evidence, dan penetapan predikat kepatuhan cabang.
          </CardDescription>
        </div>

        {/* Input Pencarian Cabang Responsif */}
        <div className="relative w-full md:w-72">
          <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari perwakilan cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8 h-8 text-xs bg-background"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearch("")}
              className="absolute right-1 top-1 size-6 text-muted-foreground hover:text-foreground"
              title="Bersihkan pencarian"
            >
              <XIcon className="size-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          {/* =========================================================================
              4 MENU BAR TABS: RAPI, MODERN, & RESPONSIF DI SELURUH DEVICE
              - Mobile (< 640px): 2 kolom grid proporsional dengan tata letak internal seimbang
              - Tablet & Desktop (>= 640px): 4 kolom satu baris yang seragam
              ========================================================================= */}
          <div className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1.5 bg-muted/70 border border-border/60 rounded-xl gap-1.5">
              {/* Tab 1: Siap Diaudit */}
              <TabsTrigger
                value="siap"
                className={cn(
                  "flex items-center justify-between sm:justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-lg transition-all min-w-0",
                  "data-active:bg-background data-active:text-foreground data-active:shadow-xs",
                  "hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <ClockIcon className="size-3.5 text-warning-text shrink-0" />
                  <span className="truncate">Siap Diaudit</span>
                </div>
                <Badge
                  variant={activeTab === "siap" ? "default" : "secondary"}
                  className="h-5 px-1.5 text-[10px] tabular-nums font-bold min-w-5 justify-center shrink-0"
                >
                  {siapDiauditList.length}
                </Badge>
              </TabsTrigger>

              {/* Tab 2: Belum Lengkap */}
              <TabsTrigger
                value="belum"
                className={cn(
                  "flex items-center justify-between sm:justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-lg transition-all min-w-0",
                  "data-active:bg-background data-active:text-foreground data-active:shadow-xs",
                  "hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <AlertCircleIcon className="size-3.5 text-danger-text shrink-0" />
                  <span className="truncate">Belum Lengkap</span>
                </div>
                <Badge
                  variant={activeTab === "belum" ? "default" : "secondary"}
                  className="h-5 px-1.5 text-[10px] tabular-nums font-bold min-w-5 justify-center shrink-0"
                >
                  {belumLengkapList.length}
                </Badge>
              </TabsTrigger>

              {/* Tab 3: Selesai Dinilai */}
              <TabsTrigger
                value="selesai"
                className={cn(
                  "flex items-center justify-between sm:justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-lg transition-all min-w-0",
                  "data-active:bg-background data-active:text-foreground data-active:shadow-xs",
                  "hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <CheckCircle2Icon className="size-3.5 text-success-text shrink-0" />
                  <span className="truncate">Selesai Dinilai</span>
                </div>
                <Badge
                  variant={activeTab === "selesai" ? "default" : "secondary"}
                  className="h-5 px-1.5 text-[10px] tabular-nums font-bold min-w-5 justify-center shrink-0"
                >
                  {selesaiDiauditList.length}
                </Badge>
              </TabsTrigger>

              {/* Tab 4: Semua Cabang */}
              <TabsTrigger
                value="semua"
                className={cn(
                  "flex items-center justify-between sm:justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-lg transition-all min-w-0",
                  "data-active:bg-background data-active:text-foreground data-active:shadow-xs",
                  "hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <Building2Icon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">Semua Cabang</span>
                </div>
                <Badge
                  variant={activeTab === "semua" ? "default" : "secondary"}
                  className="h-5 px-1.5 text-[10px] tabular-nums font-bold min-w-5 justify-center shrink-0"
                >
                  {filteredList.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Konteks Keterangan Tab Aktif */}
          <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
            <div>
              {activeTab === "siap" && "Cabang yang telah mengisi lengkap 72 butir mandiri dan siap diverifikasi auditor SIA."}
              {activeTab === "belum" && "Cabang yang pengisian butir mandirinya belum tuntas (< 72 butir instrumen)."}
              {activeTab === "selesai" && "Cabang yang seluruh proses audit kepatuhannya telah selesai diverifikasi auditor SIA."}
              {activeTab === "semua" && "Menampilkan seluruh perwakilan cabang terdaftar dalam siklus audit."}
            </div>
            {search && (
              <span className="shrink-0 ml-2 font-medium text-foreground">
                Hasil: {filteredList.length} cabang
              </span>
            )}
          </div>

          {/* Konten Setiap Tab Antrean */}
          <TabsContent value="siap" className="p-0 border rounded-lg overflow-hidden bg-card">
            {renderTable(siapDiauditList, "Tidak ada cabang yang menunggu verifikasi saat ini")}
          </TabsContent>

          <TabsContent value="belum" className="p-0 border rounded-lg overflow-hidden bg-card">
            {renderTable(belumLengkapList, "Seluruh cabang telah melengkapi 72 butir pengisian mandiri")}
          </TabsContent>

          <TabsContent value="selesai" className="p-0 border rounded-lg overflow-hidden bg-card">
            {renderTable(selesaiDiauditList, "Belum ada cabang yang selesai dinilai pada siklus ini")}
          </TabsContent>

          <TabsContent value="semua" className="p-0 border rounded-lg overflow-hidden bg-card">
            {renderTable(filteredList, "Tidak ada data perwakilan cabang yang cocok dengan pencarian")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
