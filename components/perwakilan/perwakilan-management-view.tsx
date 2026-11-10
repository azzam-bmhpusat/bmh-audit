"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PerwakilanStatsCards } from "./perwakilan-stats-cards";
import { PerwakilanDialog } from "./perwakilan-dialog";
import { DeletePerwakilanDialog } from "./delete-perwakilan-dialog";
import {
  PlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  RotateCcwIcon,
  UsersIcon,
  FileSpreadsheetIcon,
} from "lucide-react";
import type { CabangDetailListItem } from "@/types/audit";

interface PerwakilanManagementViewProps {
  initialCabangList: CabangDetailListItem[];
}

export function PerwakilanManagementView({
  initialCabangList,
}: PerwakilanManagementViewProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");

  // State dialog
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedCabangForEdit, setSelectedCabangForEdit] = React.useState<CabangDetailListItem | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCabangForDelete, setSelectedCabangForDelete] = React.useState<CabangDetailListItem | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleOpenCreateDialog = () => {
    setSelectedCabangForEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (cabang: CabangDetailListItem) => {
    setSelectedCabangForEdit(cabang);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (cabang: CabangDetailListItem) => {
    setSelectedCabangForDelete(cabang);
    setIsDeleteDialogOpen(true);
  };

  // Metrik statistik
  const totalCabang = initialCabangList.length;
  const totalWithKode = initialCabangList.filter((c) => Boolean(c.kode)).length;
  const totalWithUser = initialCabangList.filter((c) => (c.userCount ?? 0) > 0).length;
  const totalWithJawaban = initialCabangList.filter((c) => (c.jawabanCount ?? 0) > 0).length;

  // Filter daftar cabang
  const filteredCabangList = React.useMemo(() => {
    return initialCabangList.filter((c) => {
      // 1. Pencarian teks (nama, kode)
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.nama.toLowerCase().includes(q) ||
        (c.kode && c.kode.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // 2. Filter Tipe
      if (filterType === "has-kode" && !c.kode) return false;
      if (filterType === "no-kode" && c.kode) return false;
      if (filterType === "has-user" && (c.userCount ?? 0) === 0) return false;
      if (filterType === "no-user" && (c.userCount ?? 0) > 0) return false;
      if (filterType === "has-jawaban" && (c.jawabanCount ?? 0) === 0) return false;

      return true;
    });
  }, [initialCabangList, searchQuery, filterType]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Tombol Aksi */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Manajemen Perwakilan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola master data perwakilan/cabang daerah BMH, kode singkatan, dan akun tertaut.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RotateCcwIcon className="size-3.5" />
            <span className="hidden sm:inline">Segarkan</span>
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreateDialog}
            className="gap-1.5"
          >
            <PlusIcon className="size-4" />
            <span>Tambah Perwakilan</span>
          </Button>
        </div>
      </div>

      {/* 2. Kartu Statistik */}
      <PerwakilanStatsCards
        totalCabang={totalCabang}
        totalWithKode={totalWithKode}
        totalWithUser={totalWithUser}
        totalWithJawaban={totalWithJawaban}
      />

      {/* 3. Filter & Tabel Perwakilan */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Daftar Perwakilan Daerah
              </CardTitle>
              <CardDescription className="text-xs">
                Menampilkan {filteredCabangList.length} dari {totalCabang} perwakilan cabang
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Input Pencarian */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Cari nama atau kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              {/* Filter Kategori */}
              <Select value={filterType} onValueChange={(val) => setFilterType(val ?? "all")}>
                <SelectTrigger className="h-9 w-full sm:w-[170px] text-xs">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Perwakilan</SelectItem>
                  <SelectItem value="has-kode">Memiliki Kode</SelectItem>
                  <SelectItem value="no-kode">Tanpa Kode</SelectItem>
                  <SelectItem value="has-user">Memiliki Akun</SelectItem>
                  <SelectItem value="no-user">Belum Ada Akun</SelectItem>
                  <SelectItem value="has-jawaban">Ada Isian Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Kode</TableHead>
                <TableHead className="w-[260px]">Nama Perwakilan / Daerah</TableHead>
                <TableHead className="w-[200px]">Akun Pengguna Tertaut</TableHead>
                <TableHead className="w-[160px]">Isian Jawaban</TableHead>
                <TableHead className="w-[130px]">Terdaftar</TableHead>
                <TableHead className="text-right w-[80px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCabangList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                    Tidak ada perwakilan cabang yang cocok dengan kriteria pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCabangList.map((cabang) => {
                  const userCount = cabang.userCount ?? 0;
                  const jawabanCount = cabang.jawabanCount ?? 0;

                  return (
                    <TableRow key={cabang.id}>
                      {/* Kode */}
                      <TableCell>
                        {cabang.kode ? (
                          <Badge variant="outline" className="font-mono text-[11px] px-2">
                            {cabang.kode}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>

                      {/* Nama Cabang */}
                      <TableCell className="font-medium text-xs">
                        <span className="text-foreground">{cabang.nama}</span>
                      </TableCell>

                      {/* Akun Tertaut */}
                      <TableCell className="text-xs">
                        {userCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[10px] gap-1 py-0.5">
                              <UsersIcon className="size-3 text-muted-foreground" />
                              <span>{userCount} Akun</span>
                            </Badge>
                            {cabang.userNames && cabang.userNames.length > 0 && (
                              <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                                ({cabang.userNames.join(", ")})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Belum ada akun
                          </span>
                        )}
                      </TableCell>

                      {/* Jawaban Audit */}
                      <TableCell className="text-xs">
                        {jawabanCount > 0 ? (
                          <Badge variant="outline" className="text-[10px] gap-1 py-0.5">
                            <FileSpreadsheetIcon className="size-3 text-muted-foreground" />
                            <span>{jawabanCount} Item Terisi</span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Belum ada isian
                          </span>
                        )}
                      </TableCell>

                      {/* Tanggal Terdaftar */}
                      <TableCell className="text-[11px] text-muted-foreground">
                        {formatDate(cabang.created_at)}
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Menu Aksi Perwakilan"
                              />
                            }
                          >
                            <MoreHorizontalIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => handleOpenEditDialog(cabang)}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <PencilIcon className="size-3.5" />
                              <span>Edit Data</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleOpenDeleteDialog(cabang)}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <Trash2Icon className="size-3.5" />
                              <span>Hapus Cabang</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Modals */}
      <PerwakilanDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        cabangToEdit={selectedCabangForEdit}
        onSuccess={handleRefresh}
      />

      <DeletePerwakilanDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        cabang={selectedCabangForDelete}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
