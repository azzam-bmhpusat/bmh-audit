"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PenilaianCabang } from "@/types/audit";
import {
  AwardIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserKepatuhanHeroProps {
  penilaian: PenilaianCabang | null;
  skorMaks: number;
  totalNilaiSkor: number;
  isOpen: boolean;
}

const idDecimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function UserKepatuhanHero({
  penilaian,
  skorMaks,
  totalNilaiSkor,
  isOpen,
}: UserKepatuhanHeroProps) {
  const isZeroFilled = !penilaian || penilaian.jumlah_butir_terisi === 0;

  const displayNilai = isZeroFilled ? "—" : (penilaian?.nilai_kepatuhan || "—");
  const displayPredikat = isZeroFilled
    ? "Belum Ada Penilaian"
    : (penilaian?.predikat_kepatuhan || "Belum Ada Penilaian");
  const displayStatus = isZeroFilled
    ? "Instrumen Belum Diisi"
    : (penilaian?.status_kepatuhan || "Belum Ada Evaluasi");
  const displayKeterangan = isZeroFilled
    ? "Lengkapi seluruh item instrumen audit kepatuhan untuk mendapatkan hasil evaluasi dan predikat kepatuhan lembaga."
    : (penilaian?.keterangan_tindak_lanjut || "—");

  const nilaiAkhir = isZeroFilled ? 0 : (penilaian?.nilai_akhir ?? 0);
  const wajibPtk = Boolean(penilaian?.wajib_ptk);

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

  const gradeStyle = getGradeStyle(displayNilai);

  return (
    <Card className="relative overflow-hidden border shadow-sm bg-gradient-to-br from-card via-card to-muted/20">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
        <ShieldCheckIcon className="size-48" />
      </div>

      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Kolom Kiri: Grade Letter, Predikat, dan Keterangan */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
            {/* Box Nilai Huruf Kepatuhan Besar */}
            <div
              className={cn(
                "flex aspect-square size-20 sm:size-24 shrink-0 items-center justify-center rounded-2xl shadow-sm text-3xl sm:text-4xl font-extrabold tracking-tight transition-transform",
                gradeStyle.bg
              )}
            >
              {displayNilai}
            </div>

            {/* Keterangan Kepatuhan */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Nilai & Predikat Kepatuhan
                </span>
                {!isZeroFilled && (
                  <Badge variant={gradeStyle.badge} className="text-[11px] font-semibold">
                    {displayStatus}
                  </Badge>
                )}
                {!isZeroFilled && wajibPtk && (
                  <Badge variant="destructive" className="gap-1 text-[11px]">
                    <AlertTriangleIcon className="size-3" />
                    <span>Wajib PTK</span>
                  </Badge>
                )}
                {!isZeroFilled && !wajibPtk && (
                  <Badge variant="success" className="gap-1 text-[11px]">
                    <CheckCircle2Icon className="size-3" />
                    <span>Bebas PTK</span>
                  </Badge>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {displayPredikat}
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-xl">
                {displayKeterangan}
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Skor Akhir & Tombol Aksi Cepat */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 lg:border-l lg:pl-6 border-border/60 shrink-0">
            <div className="lg:text-right space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Nilai Akhir (Skala 100)
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-foreground">
                {idDecimalFormatter.format(nilaiAkhir)}
              </div>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {idDecimalFormatter.format(totalNilaiSkor)} dari {idDecimalFormatter.format(skorMaks)} Poin Ideal
              </p>
            </div>

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
      </CardContent>
    </Card>
  );
}
