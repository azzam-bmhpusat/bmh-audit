"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { CheckCircle2Icon, CircleDashedIcon, XCircleIcon } from "lucide-react";

interface ValidasiControlProps {
  itemNomor: number;
  value: boolean | null | undefined;
  disabled?: boolean;
  onChange: (value: boolean | null) => void;
}

/**
 * Kontrol 3 keadaan untuk validasi auditor SIA:
 * - Belum (null)
 * - Benar (true)
 * - Tidak benar (false)
 * Menggunakan Select dengan ikon Lucide + teks, tanpa kelas warna palet khusus.
 */
export function ValidasiControl({
  itemNomor,
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
        className="h-7 w-28 px-2 text-xs justify-center mx-auto font-medium gap-1.5"
        aria-label={`Validasi item ${itemNomor}`}
      >
        {value === true ? (
          <span className="inline-flex items-center gap-1.5 truncate">
            <CheckCircle2Icon className="size-3.5 shrink-0" />
            <span>Benar</span>
          </span>
        ) : value === false ? (
          <span className="inline-flex items-center gap-1.5 truncate">
            <XCircleIcon className="size-3.5 shrink-0" />
            <span>Tidak benar</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground truncate">
            <CircleDashedIcon className="size-3.5 shrink-0" />
            <span>Belum</span>
          </span>
        )}
      </SelectTrigger>
      <SelectContent align="center">
        <SelectItem value="none" className="text-xs">
          <span className="inline-flex items-center gap-1.5">
            <CircleDashedIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span>Belum</span>
          </span>
        </SelectItem>
        <SelectItem value="true" className="text-xs">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2Icon className="size-3.5 shrink-0" />
            <span>Benar</span>
          </span>
        </SelectItem>
        <SelectItem value="false" className="text-xs">
          <span className="inline-flex items-center gap-1.5">
            <XCircleIcon className="size-3.5 shrink-0" />
            <span>Tidak benar</span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
