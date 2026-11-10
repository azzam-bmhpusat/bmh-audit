"use client";

import * as React from "react";
import { ExternalLinkIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { safeHref } from "@/lib/safe-link";
import { formatAngka } from "@/lib/format";
import type { ItemWithPoin, MatrixRowAdmin, MatrixRowCabang } from "@/types/audit";
import { cn } from "cn";
import { SkorSelect } from "./skor-select";
import { LampiranInput } from "./lampiran-input";
import { SaveIndicator, type SaveStatus } from "./save-indicator";
import { ValidasiControl } from "./validasi-control";
import { BobotCell } from "./bobot-cell";
import { CatatanPopover } from "./catatan-popover";

interface ItemRowsProps {
  item: ItemWithPoin<MatrixRowCabang | MatrixRowAdmin>;
  mode: "cabang" | "admin";
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
  saveStatus?: { status: SaveStatus; error?: string };
  onRetry?: (itemNomor: number) => void;
}

function isMatrixRowAdmin(row: MatrixRowCabang | MatrixRowAdmin): row is MatrixRowAdmin {
  return "validasi" in row || "skor_auditor" in row || "nilai_skor_auditor" in row;
}

export const ItemRows = React.memo(function ItemRows({
  item,
  mode,
  readOnly = false,
  onSaveField,
  onSaveAdminField,
  onSaveBobot,
  saveStatus,
  onRetry,
}: ItemRowsProps) {
  const poinList = (item.poin ?? []).length > 0 ? item.poin : [
    {
      item_nomor: item.nomor,
      urutan: 1,
      fokus_pemeriksaan: "—",
      bukti_evidence: null,
      kriteria_skor: "—",
    },
  ];
  const rowSpanCount = poinList.length;

  const adminItem = isMatrixRowAdmin(item) ? item : null;
  const href = safeHref(item.lampiran_link);
  const isEditableCabang = mode === "cabang" && !readOnly;
  const isEditableAdmin = mode === "admin" && !readOnly;

  return (
    <>
      {(poinList ?? []).map((poin, idx) => {
        const isFirst = idx === 0;

        // Highlight kriteria jika urutan kriteria cocok dengan skor terpilih
        const isMatchAudite = item.skor_audite === poin.urutan;
        const isMatchAuditor = mode === "admin" && adminItem?.skor_auditor === poin.urutan;
        const isHighlighted = isMatchAudite || isMatchAuditor;

        return (
          <TableRow
            key={`${item.nomor}-${poin.urutan}`}
            className={cn(
              "border-b transition-colors",
              isHighlighted && "bg-muted/40"
            )}
          >
            {/* 1. No (rowspan) */}
            {isFirst && (
              <TableCell
                rowSpan={rowSpanCount}
                className="sticky left-0 z-10 bg-background text-center font-medium tabular-nums align-top border-r shadow-xs w-14"
              >
                {item.nomor}
              </TableCell>
            )}

            {/* 2. Indikator Pertanyaan (rowspan) */}
            {isFirst && (
              <TableCell
                rowSpan={rowSpanCount}
                className="align-top whitespace-normal min-w-[320px] pr-4 leading-relaxed"
              >
                <div className="font-medium text-foreground">{item.pertanyaan}</div>
              </TableCell>
            )}

            {/* 3. Acuan Regulasi Utama & Tambahan (rowspan) */}
            {isFirst && (
              <TableCell
                rowSpan={rowSpanCount}
                className="align-top whitespace-normal min-w-[260px] text-xs space-y-2 pr-4 leading-relaxed"
              >
                <div>
                  <span className="font-semibold text-foreground">Utama: </span>
                  <span className="text-muted-foreground">{item.regulasi_utama || "—"}</span>
                </div>
                {item.regulasi_tambahan && (
                  <div>
                    <span className="font-semibold text-foreground">Tambahan: </span>
                    <span className="text-muted-foreground">{item.regulasi_tambahan}</span>
                  </div>
                )}
              </TableCell>
            )}

            {/* 4. Bobot (rowspan) */}
            {isFirst && (
              <TableCell
                rowSpan={rowSpanCount}
                className="align-top text-right tabular-nums font-medium w-20 px-3"
              >
                {isEditableAdmin && onSaveBobot ? (
                  <BobotCell
                    itemNomor={item.nomor}
                    bobot={item.bobot}
                    disabled={readOnly}
                    onSave={onSaveBobot}
                  />
                ) : (
                  <span>{item.bobot}</span>
                )}
              </TableCell>
            )}

            {/* 5. Fokus Pemeriksaan (sub-baris) */}
            <TableCell className="align-top whitespace-normal min-w-[280px] text-xs pr-4 leading-relaxed">
              <span className="font-medium text-muted-foreground mr-1.5">{poin.urutan}.</span>
              {poin.fokus_pemeriksaan}
            </TableCell>

            {/* 6. Bukti Evidence (sub-baris) */}
            <TableCell className="align-top whitespace-normal min-w-[280px] text-xs pr-4 leading-relaxed">
              {poin.bukti_evidence ? (
                <>
                  <span className="font-medium text-muted-foreground mr-1.5">{poin.urutan}.</span>
                  {poin.bukti_evidence}
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>

            {/* 7. Lampiran (Link Evidence) (rowspan) */}
            {isFirst && (
              <TableCell
                rowSpan={rowSpanCount}
                className="align-top min-w-[220px] text-xs px-3"
              >
                {isEditableCabang ? (
                  <div className="space-y-1.5">
                    <LampiranInput
                      itemNomor={item.nomor}
                      value={item.lampiran_link}
                      disabled={readOnly}
                      onSave={(val) => onSaveField?.(item.nomor, "lampiran_link", val)}
                    />
                  </div>
                ) : href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium underline underline-offset-4 hover:opacity-80 transition-opacity"
                    aria-label={`Buka evidence item ${item.nomor}`}
                  >
                    Buka evidence
                    <ExternalLinkIcon className="size-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            )}

            {/* 8. Validasi (hanya mode admin, rowspan) */}
            {mode === "admin" && isFirst && (
              <TableCell
                rowSpan={rowSpanCount}
                className="align-top text-center min-w-[140px] px-2"
              >
                {isEditableAdmin && onSaveAdminField ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="flex items-center gap-1">
                      <ValidasiControl
                        itemNomor={item.nomor}
                        value={adminItem?.validasi}
                        disabled={readOnly}
                        onChange={(val) => onSaveAdminField(item.nomor, "validasi", val)}
                      />
                      <CatatanPopover
                        itemNomor={item.nomor}
                        catatan={adminItem?.catatan}
                        disabled={readOnly}
                        onSave={(val) => onSaveAdminField(item.nomor, "catatan", val)}
                      />
                    </div>
                    <SaveIndicator
                      status={saveStatus?.status ?? "idle"}
                      itemNomor={item.nomor}
                      onRetry={() => onRetry?.(item.nomor)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    {adminItem?.validasi === true ? (
                      <Badge variant="default" className="text-xs">
                        Benar
                      </Badge>
                    ) : adminItem?.validasi === false ? (
                      <Badge variant="outline" className="text-xs">
                        Tidak benar
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Belum</span>
                    )}
                    {adminItem?.catatan && (
                      <CatatanPopover
                        itemNomor={item.nomor}
                        catatan={adminItem?.catatan}
                        disabled={true}
                        onSave={() => {}}
                      />
                    )}
                  </div>
                )}
              </TableCell>
            )}

            {/* 9. Kriteria Skor Penilaian (1-5) (sub-baris) */}
            <TableCell
              className={cn(
                "align-top whitespace-normal min-w-[300px] text-xs pr-4 leading-relaxed",
                isHighlighted && "font-medium"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium text-muted-foreground mr-1.5">{poin.urutan}.</span>
                  {poin.kriteria_skor}
                </div>
                {isHighlighted && (
                  <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                    {isMatchAudite && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                        Skor Audite
                      </Badge>
                    )}
                    {isMatchAuditor && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        Skor Auditor
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </TableCell>

            {/* 10. Skor Audite (rowspan) */}
            {isFirst && (
              <TableCell
                rowSpan={rowSpanCount}
                className="align-top text-center w-28 px-2"
              >
                {isEditableCabang ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <SkorSelect
                      itemNomor={item.nomor}
                      value={item.skor_audite}
                      disabled={readOnly}
                      onChange={(val) => onSaveField?.(item.nomor, "skor_audite", val)}
                    />
                    <SaveIndicator
                      status={saveStatus?.status ?? "idle"}
                      itemNomor={item.nomor}
                      onRetry={() => onRetry?.(item.nomor)}
                    />
                  </div>
                ) : item.skor_audite !== null && item.skor_audite !== undefined ? (
                  <Badge variant="default" className="font-semibold text-xs tabular-nums">
                    {item.skor_audite}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            )}

            {/* 11. Nilai Skor Audite (rowspan) */}
            {isFirst && (
              <TableCell
                rowSpan={rowSpanCount}
                className="align-top text-right tabular-nums font-semibold w-24 px-3"
              >
                {item.nilai_skor !== null && item.nilai_skor !== undefined
                  ? formatAngka(item.nilai_skor)
                  : item.skor_audite
                  ? formatAngka(item.skor_audite * item.bobot)
                  : "—"}
              </TableCell>
            )}

            {/* 12. Skor Auditor (hanya mode admin, rowspan) */}
            {mode === "admin" && isFirst && (
              <TableCell
                rowSpan={rowSpanCount}
                className="align-top text-center w-28 px-2"
              >
                {isEditableAdmin && onSaveAdminField ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <SkorSelect
                      itemNomor={item.nomor}
                      value={adminItem?.skor_auditor}
                      disabled={readOnly}
                      ariaLabel={`Skor Auditor item ${item.nomor}`}
                      onChange={(val) => onSaveAdminField(item.nomor, "skor_auditor", val)}
                    />
                    <SaveIndicator
                      status={saveStatus?.status ?? "idle"}
                      itemNomor={item.nomor}
                      onRetry={() => onRetry?.(item.nomor)}
                    />
                  </div>
                ) : adminItem?.skor_auditor !== null && adminItem?.skor_auditor !== undefined ? (
                  <Badge variant="default" className="font-semibold text-xs tabular-nums">
                    {adminItem.skor_auditor}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            )}

            {/* 13. Nilai Skor Auditor (hanya mode admin, rowspan) */}
            {mode === "admin" && isFirst && (
              <TableCell
                rowSpan={rowSpanCount}
                className="align-top text-right tabular-nums font-semibold w-28 px-3"
              >
                {adminItem?.nilai_skor_auditor !== null && adminItem?.nilai_skor_auditor !== undefined
                  ? formatAngka(adminItem.nilai_skor_auditor)
                  : adminItem?.skor_auditor
                  ? formatAngka(adminItem.skor_auditor * item.bobot)
                  : "—"}
              </TableCell>
            )}
          </TableRow>
        );
      })}
    </>
  );
});
