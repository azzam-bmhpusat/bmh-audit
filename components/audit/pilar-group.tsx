"use client";

import * as React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatAngka } from "@/lib/format";
import { VariabelGroup } from "./variabel-group";
import type { MatrixRowAdmin, MatrixRowCabang, PilarGroup as PilarGroupType } from "@/types/audit";
import type { SaveStatus } from "./save-indicator";

interface PilarGroupProps {
  pilar: PilarGroupType<MatrixRowCabang | MatrixRowAdmin>;
  mode: "cabang" | "admin";
  expandedVariabel: Set<string>;
  onToggleVariabel: (kode: string) => void;
  readOnly?: boolean;
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
  saveStatuses?: Record<number, { status: SaveStatus; error?: string }>;
  onRetry?: (itemNomor: number) => void;
}

export function PilarGroup({
  pilar,
  mode,
  expandedVariabel,
  onToggleVariabel,
  readOnly,
  onSaveField,
  onSaveAdminField,
  onSaveBobot,
  saveStatuses,
  onRetry,
}: PilarGroupProps) {
  return (
    <>
      <TableRow className="bg-muted font-semibold border-b hover:bg-muted/80 transition-colors">
        {/* 1. No (sticky left) */}
        <TableCell className="sticky left-0 z-10 bg-muted text-center font-bold border-r shadow-xs w-14">
          {pilar.kode}
        </TableCell>

        {/* 2. Indikator / Nama Pilar */}
        <TableCell className="align-middle min-w-[320px] py-3 uppercase tracking-wide text-foreground">
          Pilar {pilar.kode}: {pilar.nama}
        </TableCell>

        {/* 3. Regulasi */}
        <TableCell className="min-w-[260px]" />

        {/* 4. Bobot (Subtotal Pilar) */}
        <TableCell className="text-right tabular-nums font-bold w-20 px-3">
          {formatAngka(pilar.totalBobot)}
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

        {/* 11. Nilai Skor (Subtotal Pilar) */}
        <TableCell className="text-right tabular-nums font-bold w-24 px-3">
          {formatAngka(pilar.totalNilaiSkor)}
        </TableCell>

        {/* 12. Skor Auditor (hanya mode admin) */}
        {mode === "admin" && <TableCell className="w-24" />}

        {/* 13. Nilai Skor Auditor (Subtotal Pilar, hanya mode admin) */}
        {mode === "admin" && (
          <TableCell className="text-right tabular-nums font-bold w-28 px-3">
            {formatAngka(pilar.totalNilaiSkorAuditor)}
          </TableCell>
        )}
      </TableRow>

      {/* Render setiap variabel di bawah pilar */}
      {(pilar?.variabelList ?? []).map((variabel) => (
        <VariabelGroup
          key={variabel.kode}
          variabel={variabel}
          mode={mode}
          isOpen={expandedVariabel.has(variabel.kode)}
          onToggle={() => onToggleVariabel(variabel.kode)}
          readOnly={readOnly}
          onSaveField={onSaveField}
          onSaveAdminField={onSaveAdminField}
          onSaveBobot={onSaveBobot}
          saveStatuses={saveStatuses}
          onRetry={onRetry}
        />
      ))}
    </>
  );
}
