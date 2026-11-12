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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  downloadAuditImportTemplateExcel,
  parseAuditImportExcel,
  type ParseAuditExcelResult,
} from "@/lib/import-excel";
import { importJawabanBatch } from "@/app/actions/jawaban";
import { importPenilaianAdminBatch } from "@/app/actions/penilaian";
import type { MatrixRowAdmin, MatrixRowCabang, MatrixTree } from "@/types/audit";
import { cn } from "cn";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileSpreadsheetIcon,
  Loader2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";

export interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "cabang" | "admin";
  periodeId: number;
  cabangId?: number;
  tree: MatrixTree<MatrixRowCabang | MatrixRowAdmin>;
  headerInfo?: {
    title?: string;
    subtitle?: string;
    cabangNama?: string;
    periodeNama?: string;
  };
  onSuccess?: (importedRows: any[]) => void;
}

export function ImportExcelDialog({
  open,
  onOpenChange,
  mode = "cabang",
  periodeId,
  cabangId,
  tree,
  headerInfo,
  onSuccess,
}: ImportExcelDialogProps) {
  const isAdmin = mode === "admin";
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [parseResult, setParseResult] = React.useState<ParseAuditExcelResult | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  // Kumpulan seluruh nomor butir instrumen aktif untuk validasi pencocokan
  const knownItemNomors = React.useMemo(() => {
    const set = new Set<number>();
    for (const p of tree.pilarList) {
      for (const v of p.variabelList) {
        for (const item of v.items) {
          set.add(item.nomor);
        }
      }
    }
    return set;
  }, [tree]);

  const handleResetFile = React.useCallback(() => {
    setSelectedFile(null);
    setParseResult(null);
    setIsParsing(false);
    setIsImporting(false);
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

  const handleDownloadTemplate = () => {
    try {
      const filename = downloadAuditImportTemplateExcel(
        tree,
        {
          cabangNama: headerInfo?.cabangNama,
          periodeNama: headerInfo?.periodeNama,
          title: headerInfo?.title,
        },
        mode
      );
      toast.success(`Template berhasil diunduh (${filename})`);
    } catch (err) {
      console.error("Gagal mengunduh template Excel:", err);
      toast.error("Terjadi kesalahan saat membuat template Excel.");
    }
  };

  const handleProcessFile = async (file: File) => {
    const validExtensions = [".xlsx", ".xls"];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      toast.error("Format berkas tidak didukung", {
        description: "Harap unggah berkas spreadsheet dengan format .xlsx atau .xls",
      });
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran berkas terlalu besar", {
        description: "Maksimal ukuran berkas spreadsheet yang diizinkan adalah 5 MB.",
      });
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseResult(null);

    try {
      const result = await parseAuditImportExcel(file, knownItemNomors, mode);
      setParseResult(result);

      if (result.errors.length > 0) {
        toast.error("Format berkas tidak sesuai", {
          description: result.errors[0],
        });
      } else if (!result.canImport) {
        const msg = !isAdmin
          ? "Pastikan kolom 'Lampiran (Link Evidence)' atau 'Skor Audite' telah terisi."
          : "Pastikan kolom 'Lampiran', 'Validasi', 'Skor Audite', atau 'Skor Auditor' telah terisi.";
        toast.warning("Tidak ada data isian yang ditemukan", {
          description: msg,
        });
      } else {
        const infoMsg = !isAdmin
          ? `${result.totalItemsDetected} butir terdeteksi (${result.totalSkorFilled} skor, ${result.totalLinksFilled} tautan bukti).`
          : `${result.totalItemsDetected} butir terdeteksi (${result.totalSkorFilled} skor audite, ${result.totalSkorAuditorFilled} skor auditor, ${result.totalValidasiFilled} validasi, ${result.totalLinksFilled} tautan bukti).`;
        toast.info("Pratinjau berkas berhasil dimuat", {
          description: infoMsg,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal membaca isi berkas Excel.";
      toast.error("Gagal memproses berkas", { description: message });
      setParseResult(null);
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

  const handleExecuteImport = async () => {
    if (!parseResult || !parseResult.canImport || isImporting) return;

    setIsImporting(true);
    try {
      if (isAdmin) {
        if (!cabangId) {
          throw new Error("ID perwakilan cabang tidak valid.");
        }

        const payload = parseResult.items.map((item) => ({
          itemNomor: item.itemNomor,
          skorAudite: item.skorAudite,
          skorAuditor: item.skorAuditor,
          lampiranLinks: item.lampiranLinks,
          validasi: item.validasi,
        }));

        const res = await importPenilaianAdminBatch({
          periodeId,
          cabangId,
          items: payload,
        });

        if (!res.ok) {
          throw new Error(res.error || "Gagal mengimpor penilaian ke database.");
        }

        toast.success(res.message);

        if (onSuccess) {
          onSuccess(res.importedRows);
        }
      } else {
        const payload = parseResult.items.map((item) => ({
          itemNomor: item.itemNomor,
          skorAudite: item.skorAudite,
          lampiranLinks: item.lampiranLinks,
        }));

        const res = await importJawabanBatch({
          periodeId,
          items: payload,
        });

        if (!res.ok) {
          throw new Error(res.error || "Gagal mengimpor jawaban ke database.");
        }

        toast.success(res.message);

        if (onSuccess) {
          onSuccess(res.importedRows);
        }
      }

      handleClose(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan saat memproses impor.";
      toast.error("Impor gagal", { description: message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-3xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl border shadow-xl">
        {/* Header Modal */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/20 shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheetIcon className="size-4" />
            </div>
            <span>
              {!isAdmin
                ? "Import Jawaban Audit dari Excel"
                : "Import Penilaian Audit dari Excel (Auditor SIA)"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {!isAdmin
              ? "Unggah berkas spreadsheet Excel untuk mengimpor jawaban kolom Lampiran (Link Evidence) dan Skor Audite (1–5) secara massal."
              : "Unggah berkas spreadsheet Excel untuk mengimpor jawaban kolom Lampiran (Link Evidence), Validasi, Skor Audite, dan Skor Auditor secara massal."}
          </DialogDescription>
        </DialogHeader>

        {/* Isi Modal (Scrollable Body) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0 text-xs">
          {/* Langkah 1: Unduh Format Template */}
          <div className="rounded-lg border bg-card/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center size-5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                    1
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    Format & Unduh Template Excel
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Gunakan template resmi atau berkas hasil <em>Export Excel</em>{" "}
                  yang telah Anda isi. Sistem hanya akan membaca jawaban pada kolom:
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Badge variant="outline" className="text-[10px] bg-background">
                    1. Lampiran (Link Evidence)
                  </Badge>
                  {isAdmin && (
                    <Badge variant="outline" className="text-[10px] bg-background border-primary/40 text-primary">
                      2. Validasi (Benar / Tidak Benar)
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] bg-background">
                    {!isAdmin ? "2. Skor Audite (1–5)" : "3. Skor Audite (1–5)"}
                  </Badge>
                  {isAdmin && (
                    <Badge variant="outline" className="text-[10px] bg-background border-emerald-600/40 text-emerald-600">
                      4. Skor Auditor (1–5)
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground italic">
                    (Kolom lain seperti bobot, regulasi, dan catatan tidak akan diubah)
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="h-8 text-xs gap-1.5 shadow-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 font-medium cursor-pointer shrink-0"
              >
                <DownloadIcon className="size-3.5 text-emerald-600" />
                <span>Unduh Template .XLSX</span>
              </Button>
            </div>
          </div>

          {/* Langkah 2: Area Unggah File */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center size-5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                  2
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Pilih Berkas Excel untuk Diimpor
                </span>
              </div>
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={handleResetFile}
                  className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-3 mr-1" />
                  Ganti Berkas
                </Button>
              )}
            </div>

            {!selectedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer bg-muted/10 hover:bg-muted/20",
                  isDragOver ? "border-emerald-500 bg-emerald-500/5" : "border-border"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <UploadIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Klik untuk memilih berkas atau seret ke area ini
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Mendukung format berkas spreadsheet .xlsx dan .xls
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-3 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheetIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Berkas terpilih
                    </p>
                  </div>
                </div>

                {isParsing && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2Icon className="size-3.5 animate-spin" />
                    <span>Menganalisis...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Langkah 3: Pratinjau & Validasi Data */}
          {parseResult && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center size-5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                  3
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Hasil Analisis & Pratinjau Data
                </span>
              </div>

              {/* Kartu Ringkasan Metrik */}
              <div
                className={cn(
                  "grid gap-2.5",
                  !isAdmin ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-5"
                )}
              >
                <div className="border rounded-lg p-2.5 bg-background">
                  <p className="text-[10px] text-muted-foreground">Butir Dikenali</p>
                  <p className="text-base font-bold text-foreground mt-0.5">
                    {parseResult.totalItemsDetected}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      item
                    </span>
                  </p>
                </div>
                <div className="border rounded-lg p-2.5 bg-background">
                  <p className="text-[10px] text-muted-foreground">Skor Audite</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {parseResult.totalSkorFilled}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      item
                    </span>
                  </p>
                </div>
                {isAdmin && (
                  <div className="border rounded-lg p-2.5 bg-background">
                    <p className="text-[10px] text-muted-foreground">Skor Auditor</p>
                    <p className="text-base font-bold text-primary mt-0.5">
                      {parseResult.totalSkorAuditorFilled}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        item
                      </span>
                    </p>
                  </div>
                )}
                {isAdmin && (
                  <div className="border rounded-lg p-2.5 bg-background">
                    <p className="text-[10px] text-muted-foreground">Validasi Bukti</p>
                    <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {parseResult.totalValidasiFilled}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        poin
                      </span>
                    </p>
                  </div>
                )}
                <div className="border rounded-lg p-2.5 bg-background">
                  <p className="text-[10px] text-muted-foreground">Tautan Bukti</p>
                  <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {parseResult.totalLinksFilled}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      link
                    </span>
                  </p>
                </div>
              </div>

              {/* Alert Peringatan / Error */}
              {parseResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="size-4" />
                  <AlertTitle>Berkas Tidak Dapat Diimpor</AlertTitle>
                  <AlertDescription>
                    {parseResult.errors.join(", ")}
                  </AlertDescription>
                </Alert>
              )}

              {parseResult.warnings.length > 0 && (
                <Alert variant="warning">
                  <AlertTriangleIcon className="size-4" />
                  <AlertTitle>Perhatian ({parseResult.warnings.length} Catatan)</AlertTitle>
                  <AlertDescription className="max-h-24 overflow-y-auto space-y-0.5 text-[11px]">
                    {parseResult.warnings.slice(0, 5).map((w, idx) => (
                      <div key={idx}>&bull; {w}</div>
                    ))}
                    {parseResult.warnings.length > 5 && (
                      <div className="text-muted-foreground font-semibold">
                        ...dan {parseResult.warnings.length - 5} catatan lainnya.
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Tabel Pratinjau Butir */}
              {parseResult.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-52 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-muted/40 sticky top-0 z-10 text-[11px]">
                        <TableRow>
                          <TableHead className="w-16">No</TableHead>
                          <TableHead className="w-24 text-center">Skor Audite</TableHead>
                          {isAdmin && (
                            <TableHead className="w-24 text-center">Skor Auditor</TableHead>
                          )}
                          {isAdmin && (
                            <TableHead className="w-36">Validasi</TableHead>
                          )}
                          <TableHead>Lampiran Evidence</TableHead>
                          <TableHead className="w-20 text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-[11px]">
                        {parseResult.items.slice(0, 50).map((it) => {
                          const linkKeys = Object.keys(it.lampiranLinks);
                          const hasLinks = linkKeys.length > 0;
                          const hasSkor = it.skorAudite !== null;
                          const hasSkorAuditor = it.skorAuditor !== null && it.skorAuditor !== undefined;
                          const valKeys = it.validasi ? Object.keys(it.validasi) : [];
                          const hasValidasi = valKeys.length > 0;

                          const isReady =
                            hasSkor || hasLinks || (isAdmin && (hasSkorAuditor || hasValidasi));

                          return (
                            <TableRow key={it.itemNomor} className="hover:bg-muted/20">
                              <TableCell className="font-semibold">
                                Butir {it.itemNomor}
                              </TableCell>
                              <TableCell className="text-center">
                                {hasSkor ? (
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 text-[10px]"
                                  >
                                    Skor {it.skorAudite}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              {isAdmin && (
                                <TableCell className="text-center">
                                  {hasSkorAuditor ? (
                                    <Badge
                                      variant="outline"
                                      className="font-mono text-primary border-primary/30 bg-primary/5 text-[10px]"
                                    >
                                      Skor {it.skorAuditor}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              )}
                              {isAdmin && (
                                <TableCell>
                                  {hasValidasi ? (
                                    <div className="flex flex-wrap gap-1">
                                      {valKeys.map((k) => {
                                        const v = it.validasi?.[k];
                                        return (
                                          <span
                                            key={k}
                                            className={cn(
                                              "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium",
                                              v === true
                                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                : "bg-red-500/10 text-red-700 dark:text-red-400"
                                            )}
                                          >
                                            #{k}: {v === true ? "Benar" : "Salah"}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                {hasLinks ? (
                                  <div className="flex flex-wrap gap-1">
                                    {linkKeys.map((k) => (
                                      <span
                                        key={k}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-700 dark:text-blue-400 font-mono"
                                        title={it.lampiranLinks[k]}
                                      >
                                        #{k}: Terisi
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Tidak ada link baru
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isReady ? (
                                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                                    <CheckCircle2Icon className="size-3 mr-1" />
                                    Siap
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-[10px]">
                                    Kosong
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {parseResult.items.length > 50 && (
                    <div className="p-2 text-center text-[11px] text-muted-foreground border-t bg-muted/10">
                      Menampilkan 50 dari {parseResult.items.length} butir instrumen.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <DialogFooter className="px-6 py-3 border-t bg-muted/20 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleClose(false)}
            disabled={isImporting}
            className="h-8 text-xs cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExecuteImport}
            disabled={!parseResult?.canImport || isImporting}
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
          >
            {isImporting ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <UploadIcon className="size-3.5" />
            )}
            <span>
              {isImporting
                ? "Menyimpan Data..."
                : !isAdmin
                ? "Mulai Impor Jawaban"
                : "Mulai Impor Penilaian"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
