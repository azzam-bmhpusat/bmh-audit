"use client";

import * as React from "react";
import { CheckIcon, AlertCircleIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveIndicatorProps {
  status: SaveStatus;
  itemNomor: number;
  onRetry?: () => void;
}

/**
 * Indikator status penyimpanan langsung per item.
 * Sesuai design-system.md: Ikon + teks, tanpa kelas palet warna khusus.
 */
export function SaveIndicator({
  status,
  itemNomor,
  onRetry,
}: SaveIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  if (status === "saving") {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2Icon className="size-3 animate-spin shrink-0" />
        <span>menyimpan…</span>
      </div>
    );
  }

  if (status === "saved") {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <CheckIcon className="size-3 shrink-0" />
        <span>tersimpan</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="inline-flex flex-wrap items-center gap-1.5 text-[11px] text-foreground font-medium">
        <span className="inline-flex items-center gap-1">
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>gagal</span>
        </span>
        {onRetry && (
          <Button
            type="button"
            variant="warning"
            size="sm"
            onClick={onRetry}
            className="h-5 px-1.5 text-[10px]"
            aria-label={`Coba lagi simpan item ${itemNomor}`}
          >
            Coba lagi
          </Button>
        )}
      </div>
    );
  }

  return null;
}
