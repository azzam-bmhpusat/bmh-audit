"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheetIcon, Loader2Icon } from "lucide-react";
import { exportMatrixToExcel, type ExportExcelMetadata } from "@/lib/export-excel";
import type { MatrixRowAdmin, MatrixRowCabang, MatrixTree } from "@/types/audit";
import { toast } from "sonner";
import { cn } from "cn";

export interface ExportExcelButtonProps {
  tree: MatrixTree<MatrixRowCabang | MatrixRowAdmin>;
  mode: "cabang" | "admin";
  headerInfo?: {
    title?: string;
    subtitle?: string;
    cabangNama?: string;
    periodeNama?: string;
  };
  className?: string;
}

export function ExportExcelButton({
  tree,
  mode,
  headerInfo,
  className,
}: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = React.useCallback(() => {
    if (isExporting) return;
    try {
      setIsExporting(true);

      const metadata: ExportExcelMetadata = {
        title: headerInfo?.title,
        subtitle: headerInfo?.subtitle,
        cabangNama:
          headerInfo?.cabangNama ??
          (headerInfo?.title?.replace(/^(BMH Perwakilan|Penilaian:)\s*/i, "") || ""),
        periodeNama:
          headerInfo?.periodeNama ??
          (headerInfo?.subtitle?.replace(/^Periode:\s*/i, "") || ""),
      };

      const filename = exportMatrixToExcel(tree, mode, metadata);
      toast.success(`Matriks instrumen audit berhasil diekspor (${filename})`);
    } catch (err) {
      console.error("Gagal mengekspor berkas Excel:", err);
      toast.error("Terjadi kesalahan saat mengekspor berkas Excel.");
    } finally {
      setIsExporting(false);
    }
  }, [tree, mode, headerInfo, isExporting]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className={cn("h-8 text-xs gap-1.5 transition-all duration-150 active:scale-95", className)}
      aria-label="Export tabel matriks instrumen audit ke Excel (.xlsx)"
      title="Export tabel matriks instrumen audit ke Excel (.xlsx)"
    >
      {isExporting ? (
        <Loader2Icon className="size-3.5 animate-spin" />
      ) : (
        <FileSpreadsheetIcon className="size-3.5" />
      )}
      <span>{isExporting ? "Mengekspor..." : "Export Excel"}</span>
    </Button>
  );
}
