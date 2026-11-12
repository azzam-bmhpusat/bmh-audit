"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatAngka } from "@/lib/format";
import { ItemRows } from "./item-rows";
import type { MatrixRowAdmin, MatrixRowCabang, VariabelGroup as VariabelGroupType } from "@/types/audit";
import type { SaveStatus } from "./save-indicator";

interface VariabelGroupProps {
  variabel: VariabelGroupType<MatrixRowCabang | MatrixRowAdmin>;
  mode: "cabang" | "admin";
  isOpen: boolean;
  onToggle: () => void;
  readOnly?: boolean;
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
  saveStatuses?: Record<number, { status: SaveStatus; error?: string }>;
  onRetry?: (itemNomor: number) => void;
}

export function VariabelGroup({
  variabel,
  mode,
  isOpen,
  onToggle,
  readOnly,
  onSaveField,
  onSaveAdminField,
  onSaveBobot,
  saveStatuses,
  onRetry,
}: VariabelGroupProps) {
  return (
    <>
      <TableRow className="bg-muted/50 font-medium border-b hover:bg-muted/60 transition-colors">
        {/* 1. No (sticky left) dengan tombol toggle */}
        <TableCell className="sticky left-0 z-10 bg-muted text-center p-1 border-r shadow-xs w-14">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="size-8 p-0 mx-auto hover:bg-muted/80"
            aria-expanded={isOpen}
            aria-label={isOpen ? `Tutup variabel ${variabel.nama}` : `Buka variabel ${variabel.nama}`}
          >
            {isOpen ? (
              <ChevronDownIcon className="size-4 shrink-0" />
            ) : (
              <ChevronRightIcon className="size-4 shrink-0" />
            )}
          </Button>
        </TableCell>

        {/* 2. Indikator / Nama Variabel + Progres Badge */}
        <TableCell className="align-middle min-w-[320px] py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground text-sm">
              {variabel.kode}: {variabel.nama}
            </span>
            <StatusBadge
              status={
                variabel.itemTerisi === variabel.totalItem && variabel.totalItem > 0
                  ? "success"
                  : variabel.itemTerisi > 0
                  ? "warning"
                  : "neutral"
              }
              size="xs"
              icon={true}
            >
              {variabel.itemTerisi}/{variabel.totalItem} terisi
            </StatusBadge>
          </div>
        </TableCell>

        {/* 3. Regulasi */}
        <TableCell className="min-w-[260px]" />

        {/* 4. Bobot (Subtotal) */}
        <TableCell className="text-right tabular-nums font-semibold w-20 px-3">
          {formatAngka(variabel.totalBobot)}
        </TableCell>

        {/* 5. Fokus */}
        <TableCell className="min-w-[280px]" />

        {/* 6. Bukti */}
        <TableCell className="min-w-[280px]" />

        {/* 7. Lampiran */}
        <TableCell className="min-w-[220px]" />

        {/* 8. Validasi (hanya mode admin) */}
        {mode === "admin" && <TableCell className="w-28" />}

        {/* 9. Kriteria */}
        <TableCell className="min-w-[300px]" />

        {/* 10. Skor Audite */}
        <TableCell className="w-28" />

        {/* 11. Nilai Skor (Subtotal) */}
        <TableCell className="text-right tabular-nums font-semibold w-24 px-3">
          {formatAngka(variabel.totalNilaiSkor)}
        </TableCell>

        {/* 11b. Catatan Auditor (hanya mode cabang) */}
        {mode === "cabang" && <TableCell className="w-28" />}

        {/* 12. Skor Auditor (hanya mode admin) */}
        {mode === "admin" && <TableCell className="w-24" />}

        {/* 13. Nilai Skor Auditor (Subtotal, hanya mode admin) */}
        {mode === "admin" && (
          <TableCell className="text-right tabular-nums font-semibold w-28 px-3">
            {formatAngka(variabel.totalNilaiSkorAuditor)}
          </TableCell>
        )}
      </TableRow>

      {/* Tampilkan item-item di bawah variabel jika terbuka */}
      {isOpen &&
        (variabel?.items ?? []).map((item) => (
          <ItemRows
            key={item.nomor}
            item={item}
            mode={mode}
            readOnly={readOnly}
            onSaveField={onSaveField}
            onSaveAdminField={onSaveAdminField}
            onSaveBobot={onSaveBobot}
            saveStatus={saveStatuses?.[item.nomor]}
            onRetry={onRetry}
          />
        ))}
    </>
  );
}
