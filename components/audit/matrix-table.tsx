"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getColumns } from "./columns";
import { PilarGroup } from "./pilar-group";
import { CardList } from "./card-list";
import { PrintButton } from "./print-button";
import { TotalsFooter, TotalsSummaryCard, TotalsAdminSummaryCard } from "./totals-bar";
import { useMatrixJawaban } from "./use-matrix-jawaban";
import { useMatrixAdmin } from "./use-matrix-admin";
import { PortalContainerContext } from "@/components/ui/portal-context";
import { Toaster } from "@/components/ui/sonner";
import type {
  ItemPoin,
  MatrixRowAdmin,
  MatrixRowCabang,
  MatrixTree,
} from "@/types/audit";
import type { SaveStatus } from "./save-indicator";
import { cn } from "cn";
import {
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  LayoutGridIcon,
  Maximize2Icon,
  Minimize2Icon,
  TablePropertiesIcon,
} from "lucide-react";

interface MatrixTableProps {
  mode: "cabang" | "admin";
  data: MatrixTree<MatrixRowCabang | MatrixRowAdmin>;
  readOnly?: boolean;
  periodeId?: number;
  cabangId?: number;
  poinList?: ItemPoin[];
  showSummaryCard?: boolean;
  headerInfo?: {
    title?: string;
    subtitle?: string;
  };
}

interface MatrixTableViewProps {
  mode: "cabang" | "admin";
  activeTree: MatrixTree<MatrixRowCabang | MatrixRowAdmin>;
  readOnly: boolean;
  showSummaryCard: boolean;
  headerInfo?: {
    title?: string;
    subtitle?: string;
  };
  onSaveField?: (
    itemNomor: number,
    field: "skor_audite" | "lampiran_link",
    value: number | string | null,
    urutan?: number
  ) => void;
  onSaveAdminField?: (
    itemNomor: number,
    field: "validasi" | "skor_auditor" | "catatan",
    value: boolean | number | string | null,
    urutan?: number
  ) => void;
  onSaveBobot?: (itemNomor: number, newBobot: number) => void;
  saveStatuses: Record<number, { status: SaveStatus; error?: string }>;
  onRetry: (itemNomor: number) => void;
}

function MatrixTableView({
  mode,
  activeTree,
  readOnly,
  showSummaryCard,
  headerInfo,
  onSaveField,
  onSaveAdminField,
  onSaveBobot,
  saveStatuses,
  onRetry,
}: MatrixTableViewProps) {
  const columns = React.useMemo(() => getColumns(mode), [mode]);

  // Kumpulkan seluruh kode variabel untuk kontrol buka/tutup semua
  const allVariabelCodes = React.useMemo(() => {
    const codes: string[] = [];
    for (const p of activeTree.pilarList) {
      for (const v of p.variabelList) {
        codes.push(v.kode);
      }
    }
    return codes;
  }, [activeTree.pilarList]);

  // Default: semua variabel dalam keadaan terbuka (expanded)
  const [expandedVariabel, setExpandedVariabel] = React.useState<Set<string>>(
    () => new Set(allVariabelCodes)
  );

  const toggleVariabel = React.useCallback((kode: string) => {
    setExpandedVariabel((prev) => {
      const next = new Set(prev);
      if (next.has(kode)) {
        next.delete(kode);
      } else {
        next.add(kode);
      }
      return next;
    });
  }, []);

  const handleExpandAll = React.useCallback(() => {
    setExpandedVariabel(new Set(allVariabelCodes));
  }, [allVariabelCodes]);

  const handleCollapseAll = React.useCallback(() => {
    setExpandedVariabel(new Set());
  }, []);

  const isAllExpanded = expandedVariabel.size === allVariabelCodes.length;

  // Mode tampilan: auto (tabel di desktop >=1024px, kartu di mobile <1024px), atau paksa tabel/kartu
  const [viewMode, setViewMode] = React.useState<"auto" | "table" | "card">("auto");

  const toggleViewMode = React.useCallback(() => {
    setViewMode((prev) => {
      if (prev === "auto") return "card";
      if (prev === "card") return "table";
      return "auto";
    });
  }, []);

  const viewModeLabel =
    viewMode === "auto" ? "Tampilan: Otomatis" : viewMode === "card" ? "Tampilan: Kartu" : "Tampilan: Tabel";

  // Fitur Layar Penuh (Full Screen) & Animasi Perkecil Halaman
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  const exitTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Bersihkan timeout jika unmount
  React.useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []);

  const handleEnterFullscreen = React.useCallback(() => {
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
    setIsExiting(false);
    setIsFullscreen(true);
  }, []);

  const handleExitFullscreen = React.useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    // Jalankan durasi animasi perkecil (200ms) sebelum melepaskan mode fullscreen
    exitTimeoutRef.current = setTimeout(() => {
      setIsFullscreen(false);
      setIsExiting(false);
      exitTimeoutRef.current = null;
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }, 200);
  }, [isExiting]);

  const handleToggleFullscreen = React.useCallback(() => {
    if (isFullscreen || isExiting) {
      handleExitFullscreen();
    } else {
      handleEnterFullscreen();
    }
  }, [isFullscreen, isExiting, handleEnterFullscreen, handleExitFullscreen]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen && !isExiting) {
        e.preventDefault();
        handleExitFullscreen();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen, isExiting, handleExitFullscreen]);

  const isOverlayOpen = isFullscreen || isExiting;

  // Kunci scroll body saat overlay fullscreen aktif
  React.useEffect(() => {
    if (isOverlayOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOverlayOpen]);

  return (
    <PortalContainerContext.Provider value={isOverlayOpen ? containerRef : null}>
      <div
        ref={containerRef}
        className={cn(
          "space-y-4",
          isOverlayOpen &&
            "fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-xs p-4 sm:p-6 overflow-hidden space-y-3",
          isFullscreen && !isExiting && "animate-in fade-in-0 zoom-in-95 duration-250 ease-out",
          isExiting && "animate-out fade-out-0 zoom-out-95 duration-200 ease-in fill-mode-forwards"
        )}
      >
        {/* Notifikasi toast lokal saat fullscreen aktif */}
        {isOverlayOpen && <Toaster richColors position="top-right" />}

        {/* Header konteks instrumen saat mode Layar Penuh aktif */}
        {isOverlayOpen && headerInfo && (
          <div className="flex items-center justify-between border-b pb-2 px-1 text-xs no-print shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold uppercase tracking-wider text-foreground truncate">
                {headerInfo.title || "Instrumen Audit"}
              </span>
              {headerInfo.subtitle && (
                <span className="text-muted-foreground border-l pl-2 truncate">
                  {headerInfo.subtitle}
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline shrink-0">
              Mode Layar Penuh &bull; Tekan{" "}
              <kbd className="px-1 py-0.5 font-mono text-[10px] bg-muted rounded border border-border">
                Esc
              </kbd>{" "}
              untuk perkecil
            </span>
          </div>
        )}

        {/* Ringkasan status audite live di atas tabel (hanya mode cabang) */}
        {mode === "cabang" && showSummaryCard && (
          <div className="shrink-0">
            <TotalsSummaryCard data={activeTree} />
          </div>
        )}

        {/* Toolbar kontrol atas tabel */}
        <div className="flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
          <div className="text-xs text-muted-foreground">
            Total instrumen:{" "}
            <span className="font-semibold text-foreground">
              {activeTree.totalItem} item
            </span>{" "}
            ({activeTree.pilarList.length} pilar, {allVariabelCodes.length} variabel)
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Full Screen / Perkecil Halaman dengan transisi & micro-interaction */}
            <Button
              type="button"
              variant={isFullscreen ? "secondary" : "default"}
              size="sm"
              onClick={handleToggleFullscreen}
              className={cn(
                "h-8 text-xs gap-1.5 font-medium shadow-xs transition-all duration-200 active:scale-95 cursor-pointer",
                isFullscreen &&
                  "border-border/80 bg-secondary/80 hover:bg-secondary text-secondary-foreground"
              )}
              aria-label={
                isFullscreen
                  ? "Perkecil tampilan halaman (keluar dari layar penuh) [Esc]"
                  : "Tampilkan halaman dalam layar penuh (Full Screen)"
              }
            >
              <span
                className={cn(
                  "inline-flex transition-transform duration-300",
                  isFullscreen && "rotate-180"
                )}
              >
                {isFullscreen ? (
                  <Minimize2Icon className="size-3.5" />
                ) : (
                  <Maximize2Icon className="size-3.5" />
                )}
              </span>
              <span className="transition-opacity duration-200">
                {isFullscreen ? "Perkecil Halaman" : "Full Screen"}
              </span>
              {isFullscreen && (
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background/80 rounded border border-border/80 leading-none">
                  Esc
                </kbd>
              )}
            </Button>

            {/* Tombol pengalih tampilan tabel / kartu */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleViewMode}
              className="h-8 text-xs gap-1.5 transition-all duration-150 active:scale-95"
              aria-label={`Ubah mode tampilan (saat ini ${viewModeLabel})`}
            >
              {viewMode === "card" ? (
                <LayoutGridIcon className="size-3.5" />
              ) : (
                <TablePropertiesIcon className="size-3.5" />
              )}
              <span>{viewModeLabel}</span>
            </Button>

            {/* Tombol cetak */}
            <PrintButton />

            {isAllExpanded ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                className="h-8 text-xs gap-1.5 transition-all duration-150 active:scale-95"
                aria-label="Tutup semua variabel"
              >
                <ChevronsDownUpIcon className="size-3.5" />
                Tutup semua
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="h-8 text-xs gap-1.5 transition-all duration-150 active:scale-95"
                aria-label="Buka semua variabel"
              >
                <ChevronsUpDownIcon className="size-3.5" />
                Buka semua
              </Button>
            )}
          </div>
        </div>

        {/* 1. Wadah tabel matriks (desktop / saat mode tabel aktif) */}
        {(viewMode === "auto" || viewMode === "table") && (
          <div
            className={cn(
              "relative w-full overflow-auto rounded-md border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              isOverlayOpen ? "flex-1 min-h-0 h-full max-h-none shadow-sm" : "max-h-[75vh]",
              viewMode === "auto" && "hidden lg:block"
            )}
          >
          <Table className="w-full text-xs">
            {/* Header kolom sticky */}
            <TableHeader className="sticky top-0 z-20 bg-background border-b shadow-xs">
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => {
                  const isStickyLeft = col.stickyLeft;
                  return (
                    <TableHead
                      key={col.id}
                      className={cn(
                        "h-12 px-3 text-xs font-semibold uppercase tracking-wider text-foreground align-middle whitespace-normal",
                        col.width,
                        col.minWidth,
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right",
                        isStickyLeft &&
                          "sticky left-0 top-0 z-30 bg-muted border-r text-center shadow-xs"
                      )}
                    >
                      {col.label}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            {/* Isi baris grup dan item */}
            <TableBody>
              {(activeTree?.pilarList ?? []).map((pilar) => (
                <PilarGroup
                  key={pilar.kode}
                  pilar={pilar}
                  mode={mode}
                  expandedVariabel={expandedVariabel}
                  onToggleVariabel={toggleVariabel}
                  readOnly={readOnly}
                  onSaveField={onSaveField}
                  onSaveAdminField={onSaveAdminField}
                  onSaveBobot={onSaveBobot}
                  saveStatuses={saveStatuses}
                  onRetry={onRetry}
                />
              ))}
            </TableBody>

            {/* Baris Total di bagian bawah */}
            <TotalsFooter data={activeTree} mode={mode} />
          </Table>
        </div>
      )}

      {/* 2. Wadah daftar kartu responsif (mobile < 1024px / saat mode kartu aktif) */}
      {(viewMode === "auto" || viewMode === "card") && (
        <div
          className={cn(
            "space-y-6",
            isOverlayOpen && "flex-1 min-h-0 overflow-auto pr-1",
            viewMode === "auto" && "block lg:hidden"
          )}
        >
          <CardList
            tree={activeTree}
            mode={mode}
            expandedVariabel={expandedVariabel}
            onToggleVariabel={toggleVariabel}
            readOnly={readOnly}
            onSaveField={onSaveField}
            onSaveAdminField={onSaveAdminField}
            onSaveBobot={onSaveBobot}
            saveStatuses={saveStatuses}
            onRetry={onRetry}
          />

          {/* Baris total untuk tampilan kartu */}
          {mode === "admin" ? (
            <TotalsAdminSummaryCard data={activeTree} />
          ) : (
            !showSummaryCard && <TotalsSummaryCard data={activeTree} />
          )}
        </div>
      )}
    </div>
  </PortalContainerContext.Provider>
  );
}

function MatrixTableCabangContainer({
  data,
  readOnly,
  periodeId,
  poinList,
  showSummaryCard,
  headerInfo,
}: {
  data: MatrixTree<MatrixRowCabang>;
  readOnly: boolean;
  periodeId?: number;
  poinList: ItemPoin[];
  showSummaryCard: boolean;
  headerInfo?: {
    title?: string;
    subtitle?: string;
  };
}) {
  const { tree, saveStatuses, saveField, retry } = useMatrixJawaban({
    initialTree: data,
    periodeId,
    poinList,
    readOnly,
  });

  return (
    <MatrixTableView
      mode="cabang"
      activeTree={tree}
      readOnly={readOnly}
      showSummaryCard={showSummaryCard}
      headerInfo={headerInfo}
      onSaveField={saveField}
      saveStatuses={saveStatuses}
      onRetry={retry}
    />
  );
}

function MatrixTableAdminContainer({
  data,
  readOnly,
  periodeId,
  cabangId,
  poinList,
  showSummaryCard,
  headerInfo,
}: {
  data: MatrixTree<MatrixRowAdmin>;
  readOnly: boolean;
  periodeId?: number;
  cabangId?: number;
  poinList: ItemPoin[];
  showSummaryCard: boolean;
  headerInfo?: {
    title?: string;
    subtitle?: string;
  };
}) {
  const { tree, saveStatuses, saveField, saveBobot, retry } = useMatrixAdmin({
    initialTree: data,
    periodeId,
    cabangId,
    poinList,
    readOnly,
  });

  return (
    <MatrixTableView
      mode="admin"
      activeTree={tree}
      readOnly={readOnly}
      showSummaryCard={showSummaryCard}
      headerInfo={headerInfo}
      onSaveAdminField={saveField}
      onSaveBobot={saveBobot}
      saveStatuses={saveStatuses}
      onRetry={retry}
    />
  );
}

export function MatrixTable({
  mode,
  data,
  readOnly = false,
  periodeId,
  cabangId,
  poinList = [],
  showSummaryCard = true,
  headerInfo,
}: MatrixTableProps) {
  if (mode === "admin") {
    return (
      <MatrixTableAdminContainer
        key={`${cabangId}-${periodeId}`}
        data={data as MatrixTree<MatrixRowAdmin>}
        readOnly={readOnly}
        periodeId={periodeId}
        cabangId={cabangId}
        poinList={poinList}
        showSummaryCard={showSummaryCard}
        headerInfo={headerInfo}
      />
    );
  }

  return (
    <MatrixTableCabangContainer
      key={`${periodeId}`}
      data={data as MatrixTree<MatrixRowCabang>}
      readOnly={readOnly}
      periodeId={periodeId}
      poinList={poinList}
      showSummaryCard={showSummaryCard}
      headerInfo={headerInfo}
    />
  );
}
