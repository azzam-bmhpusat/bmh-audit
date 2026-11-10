"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { ItemCard } from "./item-card";
import { formatAngka } from "@/lib/format";
import type {
  MatrixRowAdmin,
  MatrixRowCabang,
  MatrixTree,
} from "@/types/audit";
import type { SaveStatus } from "./save-indicator";
import { cn } from "cn";

interface CardListProps {
  tree: MatrixTree<MatrixRowCabang | MatrixRowAdmin>;
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
  saveStatuses: Record<number, { status: SaveStatus; error?: string }>;
  onRetry: (itemNomor: number) => void;
}

export function CardList({
  tree,
  mode,
  expandedVariabel,
  onToggleVariabel,
  readOnly = false,
  onSaveField,
  onSaveAdminField,
  onSaveBobot,
  saveStatuses,
  onRetry,
}: CardListProps) {
  return (
    <div className="space-y-6">
      {tree.pilarList.map((pilar) => (
        <section key={pilar.kode} className="space-y-4">
          {/* Header Pilar */}
          <div className="rounded-md border bg-muted/60 p-3.5 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-tight">
                Pilar {pilar.kode} — {pilar.nama}
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Subtotal Bobot:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {pilar.subtotalBobot}
                </span>
                <span className="text-muted-foreground">| Nilai:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {pilar.subtotalNilaiSkor !== null ? formatAngka(pilar.subtotalNilaiSkor) : "—"}
                </span>
                {mode === "admin" && (
                  <>
                    <span className="text-muted-foreground">| Nilai SIA:</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {pilar.subtotalNilaiSkorAuditor !== null
                        ? formatAngka(pilar.subtotalNilaiSkorAuditor)
                        : "—"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Daftar Variabel dalam Pilar */}
          <div className="space-y-3 pl-1 sm:pl-3">
            {pilar.variabelList.map((variabel) => {
              const isExpanded = expandedVariabel.has(variabel.kode);

              return (
                <div key={variabel.kode} className="rounded-md border bg-card overflow-hidden">
                  {/* Header Variabel */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 border-b">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleVariabel(variabel.kode)}
                      className="h-auto p-0 font-semibold text-xs text-foreground flex items-center gap-1.5 hover:bg-transparent"
                      aria-expanded={isExpanded}
                      aria-label={`Buka tutup variabel ${variabel.kode}`}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span>
                        Variabel {variabel.kode} — {variabel.nama}
                      </span>
                    </Button>

                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {variabel.terisiCount}/{variabel.totalItem} terisi
                      </Badge>

                      <span className="text-muted-foreground hidden sm:inline-block">
                        Bobot: <strong className="text-foreground tabular-nums">{variabel.subtotalBobot}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Isi Item-item Variabel jika expanded */}
                  {isExpanded && (
                    <div className="p-3 space-y-3">
                      {variabel.itemList.map((item) => (
                        <ItemCard
                          key={item.nomor}
                          item={item}
                          mode={mode}
                          readOnly={readOnly}
                          onSaveField={onSaveField}
                          onSaveAdminField={onSaveAdminField}
                          onSaveBobot={onSaveBobot}
                          saveStatus={saveStatuses[item.nomor]}
                          onRetry={onRetry}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
