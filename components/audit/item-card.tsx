"use client";

import * as React from "react";
import { ExternalLinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

interface ItemCardProps {
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

export const ItemCard = React.memo(function ItemCard({
  item,
  mode,
  readOnly = false,
  onSaveField,
  onSaveAdminField,
  onSaveBobot,
  saveStatus,
  onRetry,
}: ItemCardProps) {
  const adminItem = isMatrixRowAdmin(item) ? item : null;
  const href = safeHref(item.lampiran_link);
  const isEditableCabang = mode === "cabang" && !readOnly;
  const isEditableAdmin = mode === "admin" && !readOnly;

  const nilaiSkorAudite =
    item.nilai_skor !== null && item.nilai_skor !== undefined
      ? item.nilai_skor
      : item.skor_audite
      ? item.skor_audite * item.bobot
      : null;

  const nilaiSkorAuditor =
    adminItem?.nilai_skor_auditor !== null && adminItem?.nilai_skor_auditor !== undefined
      ? adminItem.nilai_skor_auditor
      : adminItem?.skor_auditor
      ? adminItem.skor_auditor * item.bobot
      : null;

  return (
    <Card className="shadow-xs overflow-hidden border">
      {/* Header Kartu: Nomor, Bobot, Status Simpan, dan Ringkasan Nilai */}
      <CardHeader className="p-4 pb-3 bg-muted/30 border-b space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs font-semibold tabular-nums">
              No. {item.nomor}
            </Badge>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Bobot:</span>
              {isEditableAdmin && onSaveBobot ? (
                <BobotCell
                  itemNomor={item.nomor}
                  bobot={item.bobot}
                  disabled={readOnly}
                  onSave={onSaveBobot}
                />
              ) : (
                <span className="font-semibold text-foreground tabular-nums">{item.bobot}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SaveIndicator
              status={saveStatus?.status ?? "idle"}
              itemNomor={item.nomor}
              onRetry={() => onRetry?.(item.nomor)}
            />

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Nilai:</span>
              <span className="font-semibold text-foreground tabular-nums">
                {nilaiSkorAudite !== null ? formatAngka(nilaiSkorAudite) : "—"}
              </span>
              {mode === "admin" && (
                <>
                  <span className="text-muted-foreground">/ SIA:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {nilaiSkorAuditor !== null ? formatAngka(nilaiSkorAuditor) : "—"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Indikator Pertanyaan Audit */}
        <h3 className="text-sm font-semibold text-foreground leading-snug">
          {item.pertanyaan}
        </h3>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-xs">
        {/* Acuan Regulasi Utama & Tambahan */}
        <div className="rounded-md border p-2.5 bg-muted/10 space-y-1">
          <div>
            <span className="font-semibold text-foreground">Regulasi Utama: </span>
            <span className="text-muted-foreground">{item.regulasi_utama || "—"}</span>
          </div>
          {item.regulasi_tambahan && (
            <div>
              <span className="font-semibold text-foreground">Regulasi Tambahan: </span>
              <span className="text-muted-foreground">{item.regulasi_tambahan}</span>
            </div>
          )}
        </div>

        {/* Daftar 5 Poin (Fokus, Bukti, dan Kriteria Skor) */}
        <div className="space-y-2">
          <p className="font-semibold text-foreground">Fokus Pemeriksaan & Kriteria Penilaian:</p>
          <div className="space-y-2">
            {item.poin.map((poin) => {
              const isMatchAudite = item.skor_audite === poin.urutan;
              const isMatchAuditor = mode === "admin" && adminItem?.skor_auditor === poin.urutan;
              const isHighlighted = isMatchAudite || isMatchAuditor;

              return (
                <div
                  key={`${item.nomor}-${poin.urutan}`}
                  className={cn(
                    "rounded-md border p-2.5 space-y-1.5 transition-colors",
                    isHighlighted ? "bg-muted/50 border-foreground/30" : "bg-card"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold tabular-nums text-foreground">
                      Poin {poin.urutan}
                    </span>
                    {isHighlighted && (
                      <div className="flex flex-wrap gap-1">
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

                  <div>
                    <span className="font-medium text-foreground">Fokus: </span>
                    <span className="text-muted-foreground">{poin.fokus_pemeriksaan}</span>
                  </div>

                  <div>
                    <span className="font-medium text-foreground">Bukti: </span>
                    <span className="text-muted-foreground">
                      {poin.bukti_evidence || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="font-medium text-foreground">Kriteria (Skor {poin.urutan}): </span>
                    <span className={cn(isHighlighted ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {poin.kriteria_skor}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Input & Kontrol Interaktif */}
        <div className="space-y-3">
          {mode === "cabang" ? (
            <>
              {/* Kontrol Cabang: Skor Audite & Lampiran Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground">Skor Audite (1–5):</span>
                  {isEditableCabang ? (
                    <SkorSelect
                      itemNomor={item.nomor}
                      value={item.skor_audite}
                      disabled={readOnly}
                      onChange={(val) => onSaveField?.(item.nomor, "skor_audite", val)}
                    />
                  ) : item.skor_audite !== null && item.skor_audite !== undefined ? (
                    <Badge variant="default" className="font-semibold text-xs tabular-nums">
                      {item.skor_audite}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground">Nilai Skor:</span>
                  <div className="h-9 flex items-center">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {nilaiSkorAudite !== null ? formatAngka(nilaiSkorAudite) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-foreground">Lampiran (Link Evidence):</span>
                {isEditableCabang ? (
                  <LampiranInput
                    itemNomor={item.nomor}
                    value={item.lampiran_link}
                    disabled={readOnly}
                    onSave={(val) => onSaveField?.(item.nomor, "lampiran_link", val)}
                  />
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
              </div>
            </>
          ) : (
            <>
              {/* Kontrol Admin: Lampiran (baca-saja), Skor Audite (baca-saja), Validasi, Skor Auditor, Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1 border-b">
                <div>
                  <span className="font-semibold text-foreground">Evidence Cabang: </span>
                  {href ? (
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
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Skor Audite:</span>
                  <Badge variant="outline" className="tabular-nums">
                    {item.skor_audite ?? "—"}
                  </Badge>
                  <span className="text-muted-foreground">
                    (Nilai: {nilaiSkorAudite !== null ? formatAngka(nilaiSkorAudite) : "—"})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground">Validasi & Catatan:</span>
                  <div className="flex items-center gap-1.5">
                    {isEditableAdmin && onSaveAdminField ? (
                      <>
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
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground">Skor Auditor (1–5):</span>
                  {isEditableAdmin && onSaveAdminField ? (
                    <SkorSelect
                      itemNomor={item.nomor}
                      value={adminItem?.skor_auditor}
                      disabled={readOnly}
                      ariaLabel={`Skor Auditor item ${item.nomor}`}
                      onChange={(val) => onSaveAdminField(item.nomor, "skor_auditor", val)}
                    />
                  ) : adminItem?.skor_auditor !== null && adminItem?.skor_auditor !== undefined ? (
                    <Badge variant="default" className="font-semibold text-xs tabular-nums">
                      {adminItem.skor_auditor}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground">Nilai Skor Auditor:</span>
                  <div className="h-9 flex items-center">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {nilaiSkorAuditor !== null ? formatAngka(nilaiSkorAuditor) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
