"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  downloadUserImportTemplateCsv,
  downloadUserImportTemplateExcel,
  parseUserImportFile,
  type ParsedUserRow,
} from "@/lib/csv-user-import";
import { importUsersAction, type ImportUsersResult } from "@/app/actions/user-management";
import type { Cabang } from "@/types/audit";
import { cn } from "cn";
import {
  UploadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  FileCheck2Icon,
  SearchIcon,
  RefreshCwIcon,
  AlertCircleIcon,
} from "lucide-react";

interface ImportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabangList: Cabang[];
  onSuccess?: () => void;
}

export function ImportUserDialog({
  open,
  onOpenChange,
  cabangList,
  onSuccess,
}: ImportUserDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [parsedRows, setParsedRows] = React.useState<ParsedUserRow[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<ImportUsersResult | null>(null);

  // Filter & Search untuk tabel pratinjau
  const [filterStatus, setFilterStatus] = React.useState<"all" | "valid" | "invalid">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleResetFile = React.useCallback(() => {
    setSelectedFile(null);
    setParsedRows([]);
    setImportResult(null);
    setIsParsing(false);
    setIsImporting(false);
    setFilterStatus("all");
    setSearchQuery("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      handleResetFile();
    }
    onOpenChange(newOpen);
  };

  // Handle parsing saat file dipilih
  const handleProcessFile = async (file: File) => {
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      toast.error("Format file tidak didukung", {
        description: "Harap unggah file dengan format .csv, .xlsx, atau .xls",
      });
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file terlalu besar", {
        description: "Maksimal ukuran file spreadsheet yang diizinkan adalah 5 MB.",
      });
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setImportResult(null);
    setFilterStatus("all");
    setSearchQuery("");

    try {
      const rows = await parseUserImportFile(file, cabangList);
      setParsedRows(rows);
      if (rows.length === 0) {
        toast.warning("File tidak memiliki data", {
          description: "Pastikan file memiliki baris data setelah baris header.",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal membaca isi file.";
      toast.error("Gagal membaca file", { description: message });
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validRows = React.useMemo(() => parsedRows.filter((r) => r.isValid), [parsedRows]);
  const invalidRows = React.useMemo(() => parsedRows.filter((r) => !r.isValid), [parsedRows]);

  // Baris yang ditampilkan berdasarkan filter status dan pencarian
  const displayedRows = React.useMemo(() => {
    let list = parsedRows;
    if (filterStatus === "valid") {
      list = validRows;
    } else if (filterStatus === "invalid") {
      list = invalidRows;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.nama.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.cabangNama && r.cabangNama.toLowerCase().includes(q)) ||
          r.errors.some((err) => err.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filterStatus, validRows, invalidRows, parsedRows, searchQuery]);

  const handleExecuteImport = async () => {
    if (validRows.length === 0 || isImporting) return;

    setIsImporting(true);
    try {
      const payload = validRows.map((r) => ({
        rowNumber: r.rowNumber,
        nama: r.nama,
        email: r.email,
        role: r.role,
        cabangNama: r.cabangNama,
        cabangId: r.cabangId,
        password: r.password,
        wajibGantiPassword: r.wajibGantiPassword,
      }));

      const res = await importUsersAction(payload);
      setImportResult(res);

      if (res.ok) {
        toast.success(res.message);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error("Proses import selesai dengan catatan", {
          description: res.message,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses import.";
      toast.error("Import gagal", { description: message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl border shadow-xl">
        {/* Header Modal */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/20 shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UploadIcon className="size-4" />
            </div>
            <span>Import Akun Pengguna (CSV / Excel)</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Daftarkan akun pengguna cabang dan auditor secara massal melalui berkas spreadsheet terstruktur.
          </DialogDescription>
        </DialogHeader>

        {/* Isi Modal (Scrollable Body) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
          {/* Langkah 1: Opsi Download Template */}
          <div className="rounded-lg border bg-card/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                    1
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    Format & Unduh Template Data
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Gunakan template resmi untuk memastikan format kolom data (Nama, Email, Role, Cabang, Password, Wajib Ganti Password) sesuai sistem.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadUserImportTemplateCsv}
                  className="h-8 text-xs gap-1.5 shadow-xs hover:bg-muted font-medium cursor-pointer"
                >
                  <FileTextIcon className="size-3.5 text-blue-600" />
                  <span>Template .CSV</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadUserImportTemplateExcel}
                  className="h-8 text-xs gap-1.5 shadow-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 font-medium cursor-pointer"
                >
                  <FileSpreadsheetIcon className="size-3.5 text-emerald-600" />
                  <span>Template .XLSX</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">Kolom wajib:</span>
              <code className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-foreground">nama</code>
              <code className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-foreground">email</code>
              <code className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-foreground">role (admin/user)</code>
              <code className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-foreground">cabang</code>
              <span className="font-medium text-foreground ml-1.5">Kolom opsional:</span>
              <code className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-foreground">password</code>
              <code className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-foreground">wajib_ganti_password</code>
            </div>
          </div>

          {/* Langkah 2: Area Unggah File */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                2
              </span>
              <span className="text-xs font-semibold text-foreground">
                Unggah File Data Pengguna
              </span>
            </div>

            {!selectedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 sm:p-7 text-center cursor-pointer transition-all duration-200",
                  isDragOver
                    ? "border-primary bg-primary/5 ring-4 ring-primary/10 scale-[0.99]"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-transform duration-200">
                    <UploadIcon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      Klik untuk memilih berkas atau seret & lepas file ke area ini
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>Format yang didukung:</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">CSV</Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">XLSX</Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">XLS</Badge>
                      <span>&bull; Maksimal 10MB</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "size-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs",
                      selectedFile.name.endsWith(".csv")
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    )}
                  >
                    {selectedFile.name.endsWith(".csv") ? (
                      <FileTextIcon className="size-5" />
                    ) : (
                      <FileSpreadsheetIcon className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{selectedFile.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      <span>&bull;</span>
                      <span className="font-medium text-foreground">
                        {parsedRows.length} baris data terdeteksi
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetFile}
                    disabled={isImporting}
                    className="h-8 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    Ganti File
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Loading Parsing State */}
          {isParsing && (
            <div className="flex items-center justify-center py-8 gap-2.5 text-xs text-muted-foreground border rounded-lg bg-muted/10">
              <Loader2Icon className="size-4 animate-spin text-primary" />
              <span>Menganalisis dan memvalidasi baris data file...</span>
            </div>
          )}

          {/* Langkah 3: Pratinjau & Validasi Data Table */}
          {!isParsing && parsedRows.length > 0 && !importResult && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                    3
                  </span>
                  <span className="text-xs font-semibold text-foreground">Pratinjau & Validasi Data</span>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterStatus("all")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                        filterStatus === "all"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Semua ({parsedRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus("valid")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                        filterStatus === "valid"
                          ? "bg-background text-emerald-700 dark:text-emerald-400 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span>Siap ({validRows.length})</span>
                    </button>
                    {invalidRows.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterStatus("invalid")}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                          filterStatus === "invalid"
                            ? "bg-background text-destructive shadow-xs"
                            : "text-muted-foreground hover:text-destructive"
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-destructive" />
                        <span>Bermasalah ({invalidRows.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="relative w-44 sm:w-52">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari pratinjau..."
                      className="h-7 text-xs pl-8 pr-2.5 bg-background shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Tabel Pratinjau dengan Sticky Header */}
              <div className="border rounded-lg max-h-64 overflow-auto relative shadow-xs bg-background">
                <Table className="w-full text-xs">
                  <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-xs border-b shadow-2xs">
                    <TableRow className="text-[11px] hover:bg-transparent">
                      <TableHead className="w-12 text-center font-semibold">No</TableHead>
                      <TableHead className="w-24 font-semibold">Status</TableHead>
                      <TableHead className="w-40 font-semibold">Nama Pengguna</TableHead>
                      <TableHead className="w-48 font-semibold">Email Login</TableHead>
                      <TableHead className="w-24 font-semibold">Peran</TableHead>
                      <TableHead className="w-36 font-semibold">Cabang / Wilayah</TableHead>
                      <TableHead className="font-semibold">Catatan Validasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                          Tidak ada data yang sesuai dengan filter atau pencarian.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedRows.map((row) => (
                        <TableRow
                          key={row.rowNumber}
                          className={cn(
                            "text-xs transition-colors",
                            !row.isValid
                              ? "bg-destructive/5 hover:bg-destructive/10"
                              : row.warnings.length > 0
                              ? "bg-amber-500/5 hover:bg-amber-500/10"
                              : "hover:bg-muted/40"
                          )}
                        >
                          <TableCell className="text-center font-mono text-[10px] text-muted-foreground">
                            {row.rowNumber}
                          </TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] gap-1 border-emerald-500/40 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                              >
                                <CheckCircle2Icon className="size-2.5" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-[10px] gap-1"
                              >
                                <XCircleIcon className="size-2.5" />
                                Error
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-xs">
                            {row.nama || <span className="text-muted-foreground italic">—</span>}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-muted-foreground">
                            {row.email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={row.role === "admin" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {row.role === "admin" ? "Auditor" : "Cabang"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.role === "admin" ? (
                              <span className="text-muted-foreground text-[11px]">—</span>
                            ) : (
                              row.cabangNama || <span className="text-muted-foreground italic">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-[11px]">
                            {row.errors.length > 0 ? (
                              <span className="text-destructive font-medium flex items-center gap-1">
                                <AlertCircleIcon className="size-3 shrink-0" />
                                <span>{row.errors.join(", ")}</span>
                              </span>
                            ) : row.warnings.length > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400">
                                {row.warnings.join(", ")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">Siap diimpor</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {invalidRows.length > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Ditemukan <strong>{invalidRows.length} baris</strong> yang belum valid. Baris tersebut akan otomatis dilewati saat proses import berjalan.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Langkah 4: Tampilan Hasil Import Selesai */}
          {importResult && (
            <div className="rounded-xl border p-5 space-y-4 bg-card shadow-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center",
                    importResult.ok
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  )}
                >
                  <FileCheck2Icon className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Hasil Proses Import Akun</h4>
                  <p className="text-[11px] text-muted-foreground">{importResult.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                    Total Diproses
                  </p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{importResult.total}</p>
                </div>
                <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 p-3">
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-emerald-700 dark:text-emerald-400">
                    Berhasil Didaftarkan
                  </p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {importResult.successCount}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-lg border p-3",
                    importResult.failedCount > 0
                      ? "bg-destructive/10 border-destructive/30"
                      : "bg-muted/20"
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] uppercase font-semibold tracking-wider",
                      importResult.failedCount > 0 ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    Gagal / Dilewati
                  </p>
                  <p
                    className={cn(
                      "text-xl font-bold mt-0.5",
                      importResult.failedCount > 0 ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {importResult.failedCount}
                  </p>
                </div>
              </div>

              {importResult.failedCount > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                    <XCircleIcon className="size-3.5" />
                    <span>Rincian Baris Gagal ({importResult.failedCount}):</span>
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {importResult.details
                      .filter((d) => d.status === "error")
                      .map((d) => (
                        <div
                          key={d.rowNumber}
                          className="flex items-center justify-between p-2 rounded-md bg-destructive/5 border border-destructive/20 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">
                              Baris {d.rowNumber}
                            </span>
                            <span className="font-medium text-foreground">{d.nama}</span>
                            <span className="text-muted-foreground text-[11px]">({d.email})</span>
                          </div>
                          <span className="text-destructive font-medium text-[11px]">{d.error}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <DialogFooter className="px-6 py-3.5 border-t bg-muted/20 shrink-0 flex flex-row items-center justify-between sm:justify-between">
          {importResult ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFile}
                className="gap-1.5 cursor-pointer"
              >
                <RefreshCwIcon className="size-3.5" />
                <span>Import File Lain</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleClose(false)}
                className="cursor-pointer"
              >
                Selesai
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleClose(false)}
                disabled={isImporting}
                className="cursor-pointer"
              >
                Batal
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleExecuteImport}
                disabled={validRows.length === 0 || isImporting}
                className="gap-1.5 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    <span>Memproses {validRows.length} Pengguna...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="size-3.5" />
                    <span>Import {validRows.length} Pengguna Siap</span>
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
