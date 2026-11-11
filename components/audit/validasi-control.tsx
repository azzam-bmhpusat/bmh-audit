"use client";

import * as React from "react";
import { cn } from "cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { CheckCircle2Icon, CircleDashedIcon, XCircleIcon } from "lucide-react";

interface ValidasiControlProps {
  itemNomor: number;
  urutan?: number;
  value: boolean | null | undefined;
  disabled?: boolean;
  onChange: (value: boolean | null) => void;
}

/**
 * Kontrol 3 keadaan untuk validasi auditor SIA:
 * - Belum (null)
 * - Benar (true) -> hijau soft
 * - Tidak benar (false) -> merah soft
 */
export function ValidasiControl({
  itemNomor,
  urutan,
  value,
  disabled = false,
  onChange,
}: ValidasiControlProps) {
  const currentValue =
    value === true ? "true" : value === false ? "false" : "none";

  const handleValueChange = (val: string | null) => {
    if (disabled) return;
    let nextValue: boolean | null = null;
    if (val === "true") nextValue = true;
    else if (val === "false") nextValue = false;
    else nextValue = null;

    if (nextValue !== (value ?? null)) {
      onChange(nextValue);
    }
  };

  return (
    <Select
      value={currentValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "h-7 w-28 px-2 text-xs justify-center mx-auto font-medium gap-1.5 transition-colors border",
          value === true &&
            "bg-success-bg text-success-text border-success-border hover:bg-success-bg/80",
          value === false &&
            "bg-danger-bg text-danger-text border-danger-border hover:bg-danger-bg/80",
          (value === null || value === undefined) &&
            "bg-neutral-bg/50 text-neutral-text border-neutral-border"
        )}
        aria-label={`Validasi item ${itemNomor} bukti ${urutan ?? 1}`}
      >
        {value === true ? (
          <span className="inline-flex items-center gap-1.5 truncate">
            <CheckCircle2Icon className="size-3.5 shrink-0 text-success-text" />
            <span>Benar</span>
          </span>
        ) : value === false ? (
          <span className="inline-flex items-center gap-1.5 truncate">
            <XCircleIcon className="size-3.5 shrink-0 text-danger-text" />
            <span>Tidak benar</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-neutral-text truncate">
            <CircleDashedIcon className="size-3.5 shrink-0" />
            <span>Belum</span>
          </span>
        )}
      </SelectTrigger>
      <SelectContent align="center">
        <SelectItem value="none" className="text-xs">
          <span className="inline-flex items-center gap-1.5 text-neutral-text">
            <CircleDashedIcon className="size-3.5 shrink-0" />
            <span>Belum</span>
          </span>
        </SelectItem>
        <SelectItem value="true" className="text-xs text-success-text font-medium">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2Icon className="size-3.5 shrink-0 text-success-text" />
            <span>Benar</span>
          </span>
        </SelectItem>
        <SelectItem value="false" className="text-xs text-danger-text font-medium">
          <span className="inline-flex items-center gap-1.5">
            <XCircleIcon className="size-3.5 shrink-0 text-danger-text" />
            <span>Tidak benar</span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
