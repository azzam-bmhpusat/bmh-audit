"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SkorSelectProps {
  itemNomor: number;
  value: number | null | undefined;
  disabled?: boolean;
  ariaLabel?: string;
  onChange: (value: number | null) => void;
}

/**
 * Dropdown pemilih Skor (1–5 atau kosong "—").
 * Menyimpan seketika saat opsi dipilih.
 */
export function SkorSelect({
  itemNomor,
  value,
  disabled = false,
  ariaLabel,
  onChange,
}: SkorSelectProps) {
  const currentValue =
    value !== null && value !== undefined ? String(value) : "none";

  const handleValueChange = (val: string | null) => {
    if (disabled) return;
    const nextValue =
      val === "none" || val === "" || val === null ? null : Number(val);
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
        className="h-7 w-20 px-2 text-xs justify-center mx-auto font-medium"
        aria-label={ariaLabel || `Skor Audite item ${itemNomor}`}
      >
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent align="center">
        <SelectItem value="none">— (Kosongkan)</SelectItem>
        <SelectItem value="1">1</SelectItem>
        <SelectItem value="2">2</SelectItem>
        <SelectItem value="3">3</SelectItem>
        <SelectItem value="4">4</SelectItem>
        <SelectItem value="5">5</SelectItem>
      </SelectContent>
    </Select>
  );
}
