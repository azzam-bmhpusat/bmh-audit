"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarRadioGroup,
  MenubarRadioItem,
} from "@/components/ui/menubar";
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
  ChevronDownIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
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
  const [activeTab, setActiveTab] = React.useState<"siap" | "belum" | "selesai" | "semua">("siap");
  const [sortSiap, setSortSiap] = React.useState("default");
  const [filterBelum, setFilterBelum] = React.useState("all");
  const [filterSelesaiPredikat, setFilterSelesaiPredikat] = React.useState("all");
  const [filterSemuaStatus, setFilterSemuaStatus] = React.useState("all");

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
  const baseSiapDiauditList = React.useMemo(() => {
    return filteredList.filter(
      (c) =>
        c.jumlah_butir_terisi === (c.jumlah_indikator || 72) &&
        c.status_audit !== "Sudah Diaudit"
    );
  }, [filteredList]);

  const displayedSiapList = React.useMemo(() => {
    const list = [...baseSiapDiauditList];
    if (sortSiap === "skor-desc") {
      return list.sort((a, b) => (b.nilai_akhir_audite || 0) - (a.nilai_akhir_audite || 0));
    }
    if (sortSiap === "skor-asc") {
      return list.sort((a, b) => (a.nilai_akhir_audite || 0) - (b.nilai_akhir_audite || 0));
    }
    return list;
  }, [baseSiapDiauditList, sortSiap]);

  // 2. Belum Lengkap: butir mandiri masih < 72 butir
  const baseBelumLengkapList = React.useMemo(() => {
    return filteredList.filter(
      (c) => c.jumlah_butir_terisi < (c.jumlah_indikator || 72)
    );
  }, [filteredList]);

  const displayedBelumList = React.useMemo(() => {
    if (filterBelum === "under50") {
      return baseBelumLengkapList.filter((c) => {
        const total = c.jumlah_indikator || 72;
        return c.jumlah_butir_terisi / total < 0.5;
      });
    }
    if (filterBelum === "over50") {
      return baseBelumLengkapList.filter((c) => {
        const total = c.jumlah_indikator || 72;
        return c.jumlah_butir_terisi / total >= 0.5;
      });
    }
    return baseBelumLengkapList;
  }, [baseBelumLengkapList, filterBelum]);

  // 3. Selesai Dinilai: verifikasi auditor SIA sudah tuntas ("Sudah Diaudit")
  const baseSelesaiDiauditList = React.useMemo(() => {
    return filteredList.filter((c) => c.status_audit === "Sudah Diaudit");
  }, [filteredList]);

  const displayedSelesaiList = React.useMemo(() => {
    if (filterSelesaiPredikat !== "all") {
      return baseSelesaiDiauditList.filter(
        (c) => (c.nilai_kepatuhan_auditor || "").toUpperCase() === filterSelesaiPredikat
      );
    }
    return baseSelesaiDiauditList;
  }, [baseSelesaiDiauditList, filterSelesaiPredikat]);

  // 4. Semua Cabang
  const displayedSemuaList = React.useMemo(() => {
    if (filterSemuaStatus !== "all") {
      return filteredList.filter((c) => c.status_audit === filterSemuaStatus);
    }
    return filteredList;
  }, [filteredList, filterSemuaStatus]);

  const isSubFilterActive = React.useMemo(() => {
    if (activeTab === "siap") return sortSiap !== "default";
    if (activeTab === "belum") return filterBelum !== "all";
    if (activeTab === "selesai") return filterSelesaiPredikat !== "all";
    if (activeTab === "semua") return filterSemuaStatus !== "all";
    return false;
  }, [activeTab, sortSiap, filterBelum, filterSelesaiPredikat, filterSemuaStatus]);

  const resetCurrentSubFilter = () => {
    if (activeTab === "siap") setSortSiap("default");
    if (activeTab === "belum") setFilterBelum("all");
    if (activeTab === "selesai") setFilterSelesaiPredikat("all");
    if (activeTab === "semua") setFilterSemuaStatus("all");
  };

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
        {/* =========================================================================
            MENU BAR SHADCN: 4 KATEGORI ANTREAN KERJA AUDITOR SIA
            Komponen resmi: Menubar, MenubarMenu, MenubarTrigger, MenubarContent
            Responsif: 2 kolom di mobile (< 640px), 4 kolom sejajar di desktop (>= 640px)
            ========================================================================= */}
        <div className="w-full">
          <Menubar className="h-auto w-full p-1.5 bg-muted/60 border border-border/60 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-1.5 shadow-xs">
            {/* 1. Menu Bar: Siap Diaudit */}
            <MenubarMenu>
              <MenubarTrigger
                onClick={() => setActiveTab("siap")}
                className={cn(
                  "w-full flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 py-2 px-2.5 sm:px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all min-w-0",
                  activeTab === "siap"
                    ? "bg-background text-foreground shadow-xs font-bold ring-1 ring-border/50"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <ClockIcon className="size-3.5 text-warning-text shrink-0" />
                  <span className="truncate">Siap Diaudit</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant={activeTab === "siap" ? "default" : "secondary"}
                    className="h-5 px-1.5 text-[10px] tabular-nums font-bold min-w-5 justify-center"
                  >
                    {displayedSiapList.length}
                  </Badge>
                  <ChevronDownIcon className="size-3 text-muted-foreground opacity-60 hidden sm:inline-block" />
                </div>
              </MenubarTrigger>
              <MenubarContent align="start">
                <MenubarRadioGroup
                  value={sortSiap}
                  onValueChange={(val) => {
                    setActiveTab("siap");
                    setSortSiap(val);
                  }}
                >
                  <MenubarLabel>Urutan Siap Diaudit</MenubarLabel>
                  <MenubarSeparator />
                  <MenubarRadioItem value="default">Urutan Default</MenubarRadioItem>
                  <MenubarRadioItem value="skor-desc">Skor Mandiri Tertinggi</MenubarRadioItem>
                  <MenubarRadioItem value="skor-asc">Skor Mandiri Terendah</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>

            {/* 2. Menu Bar: Belum Lengkap */}
            <MenubarMenu>
              <MenubarTrigger
                onClick={() => setActiveTab("belum")}
                className={cn(
                  "w-full flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 py-2 px-2.5 sm:px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all min-w-0",
                  activeTab === "belum"
                    ? "bg-background text-foreground shadow-xs font-bold ring-1 ring-border/50"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <AlertCircleIcon className="size-3.5 text-danger-text shrink-0" />
                  <span className="truncate">Belum Lengkap</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant={activeTab === "belum" ? "default" : "secondary"}
                    className="h-5 px-1.5 text-[10px] tabular-nums font-bold min-w-5 justify-center"
                  >
                    {displayedBelumList.length}
                  </Badge>
                  <ChevronDownIcon className="size-3 text-muted-foreground opacity-60 hidden sm:inline-block" />
                </div>
              </MenubarTrigger>
              <MenubarContent align="start">
                <MenubarRadioGroup
                  value={filterBelum}
                  onValueChange={(val) => {
                    setActiveTab("belum");
                    setFilterBelum(val);
                  }}
                >
                  <MenubarLabel>Filter Progres Pengisian</MenubarLabel>
                  <MenubarSeparator />
                  <MenubarRadioItem value="all">Semua Belum Lengkap</MenubarRadioItem>
                  <MenubarRadioItem value="under50">Progres Rendah (&lt; 50%)</MenubarRadioItem>
                  <MenubarRadioItem value="over50">Progres Lanjutan (≥ 50%)</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>

            {/* 3. Menu Bar: Selesai Dinilai */}
            <MenubarMenu>
              <MenubarTrigger
                onClick={() => setActiveTab("selesai")}
                className={cn(
                  "w-full flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 py-2 px-2.5 sm:px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all min-w-0",
                  activeTab === "selesai"
                    ? "bg-background text-foreground shadow-xs font-bold ring-1 ring-border/50"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <CheckCircle2Icon className="size-3.5 text-success-text shrink-0" />
                  <span className="truncate">Selesai Dinilai</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant={activeTab === "selesai" ? "default" : "secondary"}
                    className="h-5 px-1.5 text-[10px] tabular-nums font-bold min-w-5 justify-center"
                  >
                    {displayedSelesaiList.length}
                  </Badge>
                  <ChevronDownIcon className="size-3 text-muted-foreground opacity-60 hidden sm:inline-block" />
                </div>
              </MenubarTrigger>
              <MenubarContent align="start">
                <MenubarRadioGroup
                  value={filterSelesaiPredikat}
                  onValueChange={(val) => {
                    setActiveTab("selesai");
                    setFilterSelesaiPredikat(val);
                  }}
                >
                  <MenubarLabel>Filter Predikat Kepatuhan</MenubarLabel>
                  <MenubarSeparator />
                  <MenubarRadioItem value="all">Semua Predikat</MenubarRadioItem>
                  <MenubarRadioItem value="A">Predikat A (Sangat Baik)</MenubarRadioItem>
                  <MenubarRadioItem value="B">Predikat B (Baik)</MenubarRadioItem>
                  <MenubarRadioItem value="C">Predikat C (Cukup)</MenubarRadioItem>
                  <MenubarRadioItem value="D">Predikat D (Kurang)</MenubarRadioItem>
                  <MenubarRadioItem value="E">Predikat E (Tidak Patuh)</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>

            {/* 4. Menu Bar: Semua Cabang */}
            <MenubarMenu>
              <MenubarTrigger
                onClick={() => setActiveTab("semua")}
                className={cn(
                  "w-full flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 py-2 px-2.5 sm:px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all min-w-0",
                  activeTab === "semua"
                    ? "bg-background text-foreground shadow-xs font-bold ring-1 ring-border/50"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <Building2Icon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">Semua Cabang</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant={activeTab === "semua" ? "default" : "secondary"}
                    className="h-5 px-1.5 text-[10px] tabular-nums font-bold min-w-5 justify-center"
                  >
                    {displayedSemuaList.length}
                  </Badge>
                  <ChevronDownIcon className="size-3 text-muted-foreground opacity-60 hidden sm:inline-block" />
                </div>
              </MenubarTrigger>
              <MenubarContent align="end">
                <MenubarRadioGroup
                  value={filterSemuaStatus}
                  onValueChange={(val) => {
                    setActiveTab("semua");
                    setFilterSemuaStatus(val);
                  }}
                >
                  <MenubarLabel>Filter Status Audit SIA</MenubarLabel>
                  <MenubarSeparator />
                  <MenubarRadioItem value="all">Semua Status</MenubarRadioItem>
                  <MenubarRadioItem value="Belum Diaudit">Belum Diaudit</MenubarRadioItem>
                  <MenubarRadioItem value="Sedang Diaudit">Sedang Diaudit</MenubarRadioItem>
                  <MenubarRadioItem value="Sudah Diaudit">Sudah Diaudit</MenubarRadioItem>
                </MenubarRadioGroup>
                <MenubarSeparator />
                <MenubarGroup>
                  <MenubarItem
                    onClick={() => {
                      setSortSiap("default");
                      setFilterBelum("all");
                      setFilterSelesaiPredikat("all");
                      setFilterSemuaStatus("all");
                      setSearch("");
                    }}
                  >
                    Reset Semua Filter
                  </MenubarItem>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>

        {/* Konteks Keterangan Tab Aktif & Filter Cepat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              {activeTab === "siap" &&
                "Cabang yang telah mengisi lengkap 72 butir mandiri dan siap diverifikasi auditor SIA."}
              {activeTab === "belum" &&
                "Cabang yang pengisian butir mandirinya belum tuntas (< 72 butir instrumen)."}
              {activeTab === "selesai" &&
                "Cabang yang seluruh proses audit kepatuhannya telah selesai diverifikasi auditor SIA."}
              {activeTab === "semua" &&
                "Menampilkan seluruh perwakilan cabang terdaftar dalam siklus audit."}
            </span>
            {isSubFilterActive && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-medium">
                <SlidersHorizontalIcon className="size-3" />
                <span>Filter Aktif</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={resetCurrentSubFilter}
                  className="size-4 p-0 ml-0.5 hover:bg-transparent text-muted-foreground hover:text-foreground"
                  title="Reset filter kategori ini"
                >
                  <RotateCcwIcon className="size-2.5" />
                </Button>
              </div>
            )}
          </div>
          {search && (
            <span className="shrink-0 font-medium text-foreground">
              Hasil: {filteredList.length} cabang
            </span>
          )}
        </div>

        {/* Konten Antrean Kerja Terpilih */}
        <div className="border rounded-lg overflow-hidden bg-card">
          {activeTab === "siap" &&
            renderTable(
              displayedSiapList,
              displayedSiapList.length === 0 && baseSiapDiauditList.length > 0
                ? "Tidak ada cabang yang memenuhi kriteria filter urutan ini"
                : "Tidak ada cabang yang menunggu verifikasi saat ini"
            )}
          {activeTab === "belum" &&
            renderTable(
              displayedBelumList,
              displayedBelumList.length === 0 && baseBelumLengkapList.length > 0
                ? "Tidak ada cabang dengan tingkat progres tersebut"
                : "Seluruh cabang telah melengkapi 72 butir pengisian mandiri"
            )}
          {activeTab === "selesai" &&
            renderTable(
              displayedSelesaiList,
              displayedSelesaiList.length === 0 && baseSelesaiDiauditList.length > 0
                ? `Tidak ada cabang dengan ${filterSelesaiPredikat !== "all" ? `Predikat ${filterSelesaiPredikat}` : "kriteria filter ini"}`
                : "Belum ada cabang yang selesai dinilai pada siklus ini"
            )}
          {activeTab === "semua" &&
            renderTable(
              displayedSemuaList,
              "Tidak ada data perwakilan cabang yang cocok dengan filter atau pencarian"
            )}
        </div>
      </CardContent>
    </Card>
  );
}
