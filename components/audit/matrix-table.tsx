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
}

interface MatrixTableViewProps {
  mode: "cabang" | "admin";
  activeTree: MatrixTree<MatrixRowCabang | MatrixRowAdmin>;
  readOnly: boolean;
  showSummaryCard: boolean;
  onSaveField?: (
    itemNomor: number,
    field: "skor_audite" | "lampiran_link",
    value: number | string | null
  ) => void;
  onSaveAdminField?: (
    itemNomor: number,
    field: "validasi" | "skor_auditor" | "catatan",
    value: boolean | number | string | null
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

  return (
    <div className="space-y-4">
      {/* Ringkasan status audite live di atas tabel (hanya mode cabang) */}
      {mode === "cabang" && showSummaryCard && (
        <TotalsSummaryCard data={activeTree} />
      )}

      {/* Toolbar kontrol atas tabel */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Total instrumen:{" "}
          <span className="font-semibold text-foreground">
            {activeTree.totalItem} item
          </span>{" "}
          ({activeTree.pilarList.length} pilar, {allVariabelCodes.length} variabel)
        </div>

        <div className="flex items-center gap-2">
          {isAllExpanded ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCollapseAll}
              className="h-8 text-xs gap-1.5"
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
              className="h-8 text-xs gap-1.5"
              aria-label="Buka semua variabel"
            >
              <ChevronsUpDownIcon className="size-3.5" />
              Buka semua
            </Button>
          )}
        </div>
      </div>

      {/* Wadah tabel dengan scroll horizontal & vertikal mandiri */}
      <div className="relative w-full overflow-auto rounded-md border max-h-[75vh] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
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
            {activeTree.pilarList.map((pilar) => (
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
    </div>
  );
}

function MatrixTableCabangContainer({
  data,
  readOnly,
  periodeId,
  poinList,
  showSummaryCard,
}: {
  data: MatrixTree<MatrixRowCabang>;
  readOnly: boolean;
  periodeId?: number;
  poinList: ItemPoin[];
  showSummaryCard: boolean;
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
}: {
  data: MatrixTree<MatrixRowAdmin>;
  readOnly: boolean;
  periodeId?: number;
  cabangId?: number;
  poinList: ItemPoin[];
  showSummaryCard: boolean;
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
    />
  );
}
