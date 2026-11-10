"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PeriodeDialog } from "./periode-dialog";
import { DeletePeriodeDialog } from "./delete-periode-dialog";
import { togglePeriodeStatusAction } from "@/app/actions/periode";
import type { PeriodeDetailListItem } from "@/types/audit";
import {
  PlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  RotateCcwIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  ClipboardCheckIcon,
  LockIcon,
  UnlockIcon,
} from "lucide-react";

interface PeriodeTableProps {
  periodeList: PeriodeDetailListItem[];
}

export function PeriodeTable({ periodeList }: PeriodeTableProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "open" | "closed">("all");

  // State dialog
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedPeriodeForEdit, setSelectedPeriodeForEdit] = React.useState<PeriodeDetailListItem | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedPeriodeForDelete, setSelectedPeriodeForDelete] = React.useState<PeriodeDetailListItem | null>(null);

  const [togglingId, setTogglingId] = React.useState<number | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleOpenCreateDialog = () => {
    setSelectedPeriodeForEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (periode: PeriodeDetailListItem) => {
    setSelectedPeriodeForEdit(periode);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (periode: PeriodeDetailListItem) => {
    setSelectedPeriodeForDelete(periode);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (periode: PeriodeDetailListItem, nextStatus: boolean) => {
    if (togglingId !== null) return;
    setTogglingId(periode.id);

    try {
      const res = await togglePeriodeStatusAction({
        id: periode.id,
        is_open: nextStatus,
        setAsOnlyActive: false,
      });

      if (!res.ok) {
        toast.error("Gagal mengubah status periode", { description: res.error });
        return;
      }

      toast.success(res.message || "Status periode berhasil diubah");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan sistem saat mengubah status periode");
    } finally {
      setTogglingId(null);
    }
  };

  // Filter list
  const filteredPeriodeList = React.useMemo(() => {
    return periodeList.filter((p) => {
      const matchesSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === "open") return p.is_open;
      if (statusFilter === "closed") return !p.is_open;
      return true;
    });
  }, [periodeList, searchQuery, statusFilter]);

  // Statistik ringkas
  const totalPeriode = periodeList.length;
  const totalOpen = periodeList.filter((p) => p.is_open).length;
  const totalJawabanSemua = periodeList.reduce((acc, p) => acc + (p.jawabanCount ?? 0), 0);
  const totalPenilaianSemua = periodeList.reduce((acc, p) => acc + (p.penilaianCount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Kartu Statistik Ringkas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Periode
            </CardTitle>
            <CalendarDaysIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalPeriode}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Siklus audit kepatuhan terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Periode Aktif (Terbuka)
            </CardTitle>
            <CheckCircle2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalOpen}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Dapat diisi oleh seluruh cabang
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Isian Cabang
            </CardTitle>
            <FileSpreadsheetIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalJawabanSemua}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Butir jawaban mandiri audite
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Catatan Auditor
            </CardTitle>
            <ClipboardCheckIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalPenilaianSemua}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Butir audit yang telah divalidasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Kontrol Filter & Tombol Tambah */}
      <Card className="shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Daftar Periode Audit</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Kelola status keterbukaan pengisian mandiri cabang dan siklus instrumen audit kepatuhan.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="h-8 gap-1.5"
              >
                <RotateCcwIcon className="size-3.5" />
                <span className="hidden sm:inline">Segarkan</span>
              </Button>
              <Button
                size="sm"
                onClick={handleOpenCreateDialog}
                className="h-8 gap-1.5"
              >
                <PlusIcon className="size-3.5" />
                Tambah Periode
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama periode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Button
                variant={statusFilter === "all" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-8 text-xs flex-1 sm:flex-none"
              >
                Semua ({totalPeriode})
              </Button>
              <Button
                variant={statusFilter === "open" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("open")}
                className="h-8 text-xs flex-1 sm:flex-none"
              >
                Terbuka ({totalOpen})
              </Button>
              <Button
                variant={statusFilter === "closed" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("closed")}
                className="h-8 text-xs flex-1 sm:flex-none"
              >
                Ditutup ({totalPeriode - totalOpen})
              </Button>
            </div>
          </div>

          {/* 3. Tabel Data Periode */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[60px] text-center text-xs">No</TableHead>
                  <TableHead className="text-xs">Nama Periode</TableHead>
                  <TableHead className="text-xs w-[140px]">Status Pengisian</TableHead>
                  <TableHead className="text-xs text-right tabular-nums w-[120px]">
                    Isian Cabang
                  </TableHead>
                  <TableHead className="text-xs text-right tabular-nums w-[130px]">
                    Penilaian Auditor
                  </TableHead>
                  <TableHead className="text-xs w-[130px]">Tanggal Dibuat</TableHead>
                  <TableHead className="w-[80px] text-center text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPeriodeList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-28 text-center text-xs text-muted-foreground"
                    >
                      {searchQuery
                        ? "Tidak ada periode yang sesuai dengan kata kunci pencarian."
                        : "Belum ada periode audit. Silakan tambahkan periode baru."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPeriodeList.map((periode, index) => {
                    const isToggling = togglingId === periode.id;
                    const formattedDate = periode.created_at
                      ? new Date(periode.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-";

                    return (
                      <TableRow key={periode.id} className="hover:bg-muted/20">
                        <TableCell className="text-center text-xs font-mono text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-foreground">
                              {periode.nama}
                            </span>
                            {periode.is_open && (
                              <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4">
                                Aktif
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={periode.is_open}
                              disabled={isToggling}
                              onCheckedChange={(checked) =>
                                handleToggleStatus(periode, Boolean(checked))
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              {periode.is_open ? "Terbuka" : "Ditutup"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          <span className="font-medium">{periode.jawabanCount ?? 0}</span>
                          <span className="text-muted-foreground text-[11px] ml-1">butir</span>
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          <span className="font-medium">{periode.penilaianCount ?? 0}</span>
                          <span className="text-muted-foreground text-[11px] ml-1">butir</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formattedDate}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                >
                                  <MoreHorizontalIcon className="size-4" />
                                  <span className="sr-only">Menu aksi</span>
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleOpenEditDialog(periode)}
                                className="text-xs gap-2"
                              >
                                <PencilIcon className="size-3.5" />
                                Ubah Periode
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleStatus(periode, !periode.is_open)
                                }
                                className="text-xs gap-2"
                              >
                                {periode.is_open ? (
                                  <>
                                    <LockIcon className="size-3.5" />
                                    Tutup Periode
                                  </>
                                ) : (
                                  <>
                                    <UnlockIcon className="size-3.5" />
                                    Buka Periode
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleOpenDeleteDialog(periode)}
                                className="text-xs gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2Icon className="size-3.5" />
                                Hapus Periode
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
          </div>
        </CardContent>
      </Card>

      {/* Dialog Modals */}
      <PeriodeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        periode={selectedPeriodeForEdit}
        onSuccess={handleRefresh}
      />

      <DeletePeriodeDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        periode={selectedPeriodeForDelete}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
