"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PenilaianAdmin, PenilaianCabang } from "@/types/audit";
import {
  AwardIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  InfoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserKepatuhanHeroProps {
  penilaianSIA: PenilaianAdmin | null;
  penilaianMandiri: PenilaianCabang | null;
  statusAudit?: string;
  catatanAuditor?: string | null;
  isLocked?: boolean;
  skorMaks: number;
  totalNilaiSkorMandiri: number;
  isOpen: boolean;
}

const idDecimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function UserKepatuhanHero({
  penilaianSIA,
  penilaianMandiri,
  statusAudit = "Belum Diaudit",
  catatanAuditor,
  isLocked = false,
  skorMaks,
  totalNilaiSkorMandiri,
  isOpen,
}: UserKepatuhanHeroProps) {
  // Evaluasi status audit
  const isAudited =
    statusAudit === "Sudah Diaudit" ||
    Boolean(penilaianSIA?.jumlah_butir_diaudit && penilaianSIA.jumlah_butir_diaudit > 0);
  const isSedangDiaudit = statusAudit === "Sedang Diaudit";

  // Nilai Mandiri (Self-Assessment)
  const isMandiriEmpty = !penilaianMandiri || penilaianMandiri.jumlah_butir_terisi === 0;
  const nilaiAkhirMandiri = isMandiriEmpty ? 0 : (penilaianMandiri?.nilai_akhir ?? 0);
  const nilaiHurufMandiri = isMandiriEmpty ? "—" : (penilaianMandiri?.nilai_kepatuhan || "—");
  const predikatMandiri = isMandiriEmpty
    ? "Belum Ada Pengisian"
    : (penilaianMandiri?.predikat_kepatuhan || "Belum Ada Penilaian");

  // Nilai SIA (Auditor)
  const nilaiAkhirSIA = penilaianSIA?.nilai_akhir_auditor ?? 0;
  const nilaiHurufSIA = penilaianSIA?.nilai_kepatuhan_auditor || "—";
  const predikatSIA = penilaianSIA?.predikat_kepatuhan_auditor || "Belum Ada Penilaian";
  const statusKepatuhanSIA = penilaianSIA?.status_kepatuhan_auditor || "Belum Ada Evaluasi";
  const wajibPtkSIA = Boolean(penilaianSIA?.wajib_ptk_auditor);
  const totalNilaiSkorSIA = penilaianSIA?.total_nilai_skor_auditor ?? 0;
  const selisihNilai =
    penilaianSIA?.selisih_nilai_akhir ??
    (nilaiAkhirSIA > 0 ? Number((nilaiAkhirSIA - nilaiAkhirMandiri).toFixed(2)) : 0);

  // Keterangan tindak lanjut
  const keteranganSIA =
    catatanAuditor?.trim() ||
    penilaianSIA?.keterangan_tindak_lanjut ||
    "Hasil evaluasi kepatuhan resmi diterbitkan oleh Tim Auditor SIA BMH.";

  // Helper styling badge huruf nilai kepatuhan
  const getGradeStyle = (grade: string) => {
    switch (grade.toUpperCase()) {
      case "A":
        return {
          bg: "bg-emerald-600 text-white dark:bg-emerald-500",
          ring: "ring-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
          badge: "success" as const,
        };
      case "B":
        return {
          bg: "bg-blue-600 text-white dark:bg-blue-500",
          ring: "ring-blue-500/20 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-300 dark:border-blue-800",
          badge: "secondary" as const,
        };
      case "C":
        return {
          bg: "bg-amber-500 text-white dark:bg-amber-600",
          ring: "ring-amber-500/20 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800",
          badge: "outline" as const,
        };
      case "D":
      case "E":
        return {
          bg: "bg-rose-600 text-white dark:bg-rose-500",
          ring: "ring-rose-500/20 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800",
          badge: "destructive" as const,
        };
      default:
        return {
          bg: "bg-muted-foreground/40 text-muted-foreground",
          ring: "ring-muted/20 bg-muted/30 text-muted-foreground border-border",
          badge: "outline" as const,
        };
    }
  };

  const gradeStyleSIA = getGradeStyle(nilaiHurufSIA);

  return (
    <Card className="relative overflow-hidden border shadow-sm bg-gradient-to-br from-card via-card to-muted/20">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
        <ShieldCheckIcon className="size-48" />
      </div>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* ============================================================== */}
        {/* BAGIAN UTAMA: HIGHLIGHT SKOR & PREDIKAT RESMI SIA             */}
        {/* ============================================================== */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Kolom Kiri: Grade Letter / Icon, Predikat, dan Keterangan Status */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
            {/* Box Huruf / Status Besar */}
            {isAudited ? (
              <div
                className={cn(
                  "flex aspect-square size-20 sm:size-24 shrink-0 items-center justify-center rounded-2xl shadow-sm text-3xl sm:text-4xl font-extrabold tracking-tight transition-transform",
                  gradeStyleSIA.bg
                )}
              >
                {nilaiHurufSIA}
              </div>
            ) : isSedangDiaudit ? (
              <div className="flex aspect-square size-20 sm:size-24 shrink-0 items-center justify-center rounded-2xl shadow-sm text-blue-600 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ClockIcon className="size-10 sm:size-12 animate-pulse" />
              </div>
            ) : (
              <div className="flex aspect-square size-20 sm:size-24 shrink-0 items-center justify-center rounded-2xl shadow-sm text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <ClockIcon className="size-10 sm:size-12" />
              </div>
            )}

            {/* Keterangan Kepatuhan & Status Audit */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Hasil Audit Resmi SIA
                </span>

                {isAudited ? (
                  <>
                    <Badge variant="success" className="text-[11px] font-semibold gap-1">
                      <CheckCircle2Icon className="size-3" />
                      <span>Sudah Diaudit</span>
                    </Badge>
                    <Badge variant={gradeStyleSIA.badge} className="text-[11px] font-semibold">
                      {statusKepatuhanSIA}
                    </Badge>
                    {wajibPtkSIA ? (
                      <Badge variant="destructive" className="gap-1 text-[11px]">
                        <AlertTriangleIcon className="size-3" />
                        <span>Wajib PTK</span>
                      </Badge>
                    ) : (
                      <Badge variant="success" className="gap-1 text-[11px]">
                        <CheckCircle2Icon className="size-3" />
                        <span>Bebas PTK</span>
                      </Badge>
                    )}
                  </>
                ) : isSedangDiaudit ? (
                  <Badge variant="secondary" className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 gap-1">
                    <ClockIcon className="size-3" />
                    <span>Sedang Diaudit</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 gap-1">
                    <InfoIcon className="size-3" />
                    <span>Belum Diaudit</span>
                  </Badge>
                )}

                {isLocked && (
                  <Badge variant="secondary" className="text-[10px]">
                    Form Dikunci
                  </Badge>
                )}
              </div>

              {/* Judul Predikat Utama */}
              {isAudited ? (
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {predikatSIA}
                </h2>
              ) : isSedangDiaudit ? (
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  Sedang Dalam Proses Audit SIA
                </h2>
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  Menunggu Pemeriksaan Auditor SIA
                </h2>
              )}

              {/* Keterangan Narasi */}
              {isAudited ? (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-xl">
                  {keteranganSIA}
                </p>
              ) : isSedangDiaudit ? (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-xl">
                  Auditor SIA sedang memeriksa bukti pendukung dan kesesuaian instrumen cabang Anda. Skor resmi akan ditampilkan setelah audit selesai.
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-xl">
                  Hasil audit dan predikat kepatuhan resmi dari Auditor SIA belum tersedia. Tim Auditor SIA akan melakukan audit kepatuhan terhadap instrumen yang telah Anda isi.
                </p>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Skor Angka & Tombol Navigasi */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 lg:border-l lg:pl-6 border-border/60 shrink-0">
            {isAudited ? (
              <div className="lg:text-right space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Skor Akhir SIA (Skala 100)
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-foreground">
                  {idDecimalFormatter.format(nilaiAkhirSIA)}
                </div>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {idDecimalFormatter.format(totalNilaiSkorSIA)} dari {idDecimalFormatter.format(skorMaks)} Poin Ideal
                </p>
              </div>
            ) : (
              <div className="lg:text-right space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Status Penilaian Resmi
                </span>
                <div className="text-sm sm:text-base font-semibold text-amber-700 dark:text-amber-400">
                  {isSedangDiaudit ? "Pemeriksaan Berlangsung" : "Menunggu Antrean Audit"}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {penilaianMandiri?.jumlah_butir_terisi ?? 0} dari {skorMaks / 5} butir siap diperiksa
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/penilaian" />}
                nativeButton={false}
                className="gap-1 text-xs h-8"
              >
                <AwardIcon className="size-3.5" />
                <span>Rincian Predikat</span>
                <ChevronRightIcon className="size-3" />
              </Button>
              <Button
                variant="default"
                size="sm"
                render={<Link href="/audit" />}
                nativeButton={false}
                className="gap-1.5 text-xs h-8"
                disabled={!isOpen}
              >
                <FileSpreadsheetIcon className="size-3.5" />
                <span>Buka Instrumen</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN BAWAH: TAMPILAN SKOR MANDIRI (SELF-ASSESSMENT)          */}
        {/* ============================================================== */}
        {isAudited ? (
          // Kondisi 1: Sudah Diaudit -> Tampilkan komparasi Skor Mandiri vs Skor SIA
          <div className="pt-3 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-muted/40 px-3.5 py-2.5 rounded-lg">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-muted-foreground">
              <span className="font-semibold text-foreground">Skor Pengisian Mandiri (Audite):</span>
              <span className="font-bold text-foreground tabular-nums">
                {idDecimalFormatter.format(nilaiAkhirMandiri)}
              </span>
              <span>/ 100</span>
              <span className="text-[11px]">
                (Grade {nilaiHurufMandiri} • {predikatMandiri})
              </span>
              <span className="text-[11px] text-muted-foreground">
                • {idDecimalFormatter.format(totalNilaiSkorMandiri)} Poin
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Penyesuaian SIA:</span>
              <span
                className={cn(
                  "font-bold tabular-nums",
                  selisihNilai > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : selisihNilai < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-muted-foreground"
                )}
              >
                {selisihNilai > 0
                  ? `+${idDecimalFormatter.format(selisihNilai)}`
                  : idDecimalFormatter.format(selisihNilai)}{" "}
                poin
              </span>
            </div>
          </div>
        ) : (
          // Kondisi 2 & 3: Belum / Sedang Diaudit -> Highlight Skor Mandiri sebagai acuan saat ini
          <div className="pt-3 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/30 p-3.5 rounded-lg border border-border/60">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Skor Pengisian Mandiri (Self-Assessment)
                </span>
                <Badge variant="outline" className="text-[10px] h-5">
                  Sementara
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isMandiriEmpty
                  ? "Anda belum mengisi butir instrumen audit kepatuhan perwakilan."
                  : `Capaian mandiri berdasarkan ${penilaianMandiri?.jumlah_butir_terisi ?? 0} butir terisi. Belum diverifikasi oleh Auditor SIA.`}
              </p>
            </div>

            <div className="flex items-baseline gap-2 sm:text-right shrink-0">
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {isMandiriEmpty ? "0,00" : idDecimalFormatter.format(nilaiAkhirMandiri)}
              </div>
              <div className="text-xs text-muted-foreground">
                / 100{" "}
                <span className="font-semibold text-foreground">
                  ({nilaiHurufMandiri} • {predikatMandiri})
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
