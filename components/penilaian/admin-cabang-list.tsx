"use client";

import * as React from "react";
import Link from "next/link";
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
import type { PenilaianAdmin } from "@/types/audit";
import {
  ArrowUpDownIcon,
  ChevronRightIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

interface AdminCabangListProps {
  cabangList: PenilaianAdmin[];
  selectedPeriodeId: number;
}

type SortField =
  | "entitas"
  | "terisi"
  | "diaudit"
  | "nilaiAudite"
  | "nilaiAuditor"
  | "status";
type SortOrder = "asc" | "desc";

const idDecimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function AdminCabangList({
  cabangList,
  selectedPeriodeId,
}: AdminCabangListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortField, setSortField] = React.useState<SortField>("entitas");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedList = React.useMemo(() => {
    return cabangList
      .filter((item) => {
        const matchSearch = item.entitas_audit
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchStatus =
          statusFilter === "all" || item.status_audit === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        let comp = 0;
        switch (sortField) {
          case "entitas":
            comp = a.entitas_audit.localeCompare(b.entitas_audit);
            break;
          case "terisi":
            comp = a.jumlah_butir_terisi - b.jumlah_butir_terisi;
            break;
          case "diaudit":
            comp = a.jumlah_butir_diaudit - b.jumlah_butir_diaudit;
            break;
          case "nilaiAudite":
            comp = a.nilai_akhir_audite - b.nilai_akhir_audite;
            break;
          case "nilaiAuditor":
            comp = a.nilai_akhir_auditor - b.nilai_akhir_auditor;
            break;
          case "status":
            comp = (a.status_audit || "").localeCompare(b.status_audit || "");
            break;
        }
        return sortOrder === "asc" ? comp : -comp;
      });
  }, [cabangList, searchQuery, statusFilter, sortField, sortOrder]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Sudah Diaudit":
        return <Badge variant="secondary">Sudah Diaudit</Badge>;
      case "Sedang Diaudit":
        return <Badge variant="outline">Sedang Diaudit</Badge>;
      case "Belum Diaudit":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground border-dashed">
            Belum Diaudit
          </Badge>
        );
    }
  };

  const getPredikatBadgeVariant = (nilai: string) => {
    switch (nilai.toUpperCase()) {
      case "A":
        return "default" as const;
      case "B":
        return "secondary" as const;
      case "C":
      case "D":
        return "outline" as const;
      case "E":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="space-y-4">
      {/* Kontrol Pencarian & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari entitas / cabang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontalIcon className="size-3.5" />
            <span>Status:</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={statusFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="text-xs h-8"
            >
              Semua ({cabangList.length})
            </Button>
            <Button
              variant={statusFilter === "Sudah Diaudit" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("Sudah Diaudit")}
              className="text-xs h-8"
            >
              Sudah
            </Button>
            <Button
              variant={statusFilter === "Sedang Diaudit" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("Sedang Diaudit")}
              className="text-xs h-8"
            >
              Sedang
            </Button>
            <Button
              variant={statusFilter === "Belum Diaudit" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("Belum Diaudit")}
              className="text-xs h-8"
            >
              Belum
            </Button>
          </div>
        </div>
      </div>

      {/* Tabel Ringkasan Seluruh Cabang */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead
                className="font-semibold cursor-pointer hover:text-foreground"
                onClick={() => handleSort("entitas")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Entitas / Unit Audit</span>
                  <ArrowUpDownIcon className="size-3.5" />
                </div>
              </TableHead>
              <TableHead
                className="font-semibold text-center cursor-pointer hover:text-foreground"
                onClick={() => handleSort("terisi")}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Butir Terisi</span>
                  <ArrowUpDownIcon className="size-3.5" />
                </div>
              </TableHead>
              <TableHead
                className="font-semibold text-center cursor-pointer hover:text-foreground"
                onClick={() => handleSort("diaudit")}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Butir Diaudit</span>
                  <ArrowUpDownIcon className="size-3.5" />
                </div>
              </TableHead>
              <TableHead
                className="font-semibold text-right cursor-pointer hover:text-foreground"
                onClick={() => handleSort("nilaiAudite")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Nilai Audite</span>
                  <ArrowUpDownIcon className="size-3.5" />
                </div>
              </TableHead>
              <TableHead
                className="font-semibold text-right cursor-pointer hover:text-foreground"
                onClick={() => handleSort("nilaiAuditor")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Nilai Auditor</span>
                  <ArrowUpDownIcon className="size-3.5" />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-center">
                Predikat Auditor
              </TableHead>
              <TableHead
                className="font-semibold text-center cursor-pointer hover:text-foreground"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Status Audit</span>
                  <ArrowUpDownIcon className="size-3.5" />
                </div>
              </TableHead>
              <TableHead className="w-28 text-right font-semibold">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-28 text-center text-sm text-muted-foreground"
                >
                  Tidak ada cabang yang sesuai dengan pencarian atau filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedList.map((cabang) => {
                const isAudited = cabang.jumlah_butir_diaudit > 0;
                return (
                  <TableRow key={cabang.cabang_id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold">
                      <Link
                        href={`/admin/penilaian/${cabang.cabang_id}?periode=${selectedPeriodeId}`}
                        className="hover:underline flex items-center gap-1.5 text-foreground"
                      >
                        {cabang.entitas_audit}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs">
                      {cabang.jumlah_butir_terisi_teks}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs">
                      {cabang.jumlah_butir_diaudit_teks}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {cabang.jumlah_butir_terisi === 0
                        ? "—"
                        : idDecimalFormatter.format(cabang.nilai_akhir_audite)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-bold">
                      {isAudited
                        ? idDecimalFormatter.format(cabang.nilai_akhir_auditor)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {isAudited ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Badge
                            variant={getPredikatBadgeVariant(
                              cabang.nilai_kepatuhan_auditor
                            )}
                            className="font-bold"
                          >
                            {cabang.nilai_kepatuhan_auditor}
                          </Badge>
                          <span className="text-xs text-muted-foreground hidden lg:inline">
                            {cabang.predikat_kepatuhan_auditor}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(cabang.status_audit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <Link
                            href={`/admin/penilaian/${cabang.cabang_id}?periode=${selectedPeriodeId}`}
                          />
                        }
                        nativeButton={false}
                      >
                        <span>Review</span>
                        <ChevronRightIcon className="size-3.5 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
