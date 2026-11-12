"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { UploadCloudIcon } from "lucide-react";
import { ImportExcelDialog } from "./import-excel-dialog";
import type { MatrixRowAdmin, MatrixRowCabang, MatrixTree } from "@/types/audit";
import { cn } from "cn";

export interface ImportExcelButtonProps {
  mode?: "cabang" | "admin";
  periodeId?: number;
  cabangId?: number;
  tree: MatrixTree<MatrixRowCabang | MatrixRowAdmin>;
  readOnly?: boolean;
  headerInfo?: {
    title?: string;
    subtitle?: string;
    cabangNama?: string;
    periodeNama?: string;
  };
  onImportSuccess?: (importedRows: any[]) => void;
  className?: string;
}

export function ImportExcelButton({
  mode = "cabang",
  periodeId,
  cabangId,
  tree,
  readOnly = false,
  headerInfo,
  onImportSuccess,
  className,
}: ImportExcelButtonProps) {
  const [open, setOpen] = React.useState(false);

  if (!periodeId) {
    return null;
  }

  const tooltipTitle = readOnly
    ? "Form audit berstatus hanya-baca / terkunci"
    : mode === "admin"
    ? "Import data penilaian audit dari Excel (.xlsx)"
    : "Import jawaban instrumen audit dari Excel (.xlsx)";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={readOnly}
        className={cn(
          "h-8 text-xs gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer",
          readOnly && "opacity-60 cursor-not-allowed",
          className
        )}
        aria-label={tooltipTitle}
        title={tooltipTitle}
      >
        <UploadCloudIcon className="size-3.5 text-emerald-600" />
        <span>Import Excel</span>
      </Button>

      {open && (
        <ImportExcelDialog
          open={open}
          onOpenChange={setOpen}
          mode={mode}
          periodeId={periodeId}
          cabangId={cabangId}
          tree={tree}
          headerInfo={headerInfo}
          onSuccess={onImportSuccess}
        />
      )}
    </>
  );
}
