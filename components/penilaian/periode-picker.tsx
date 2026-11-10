"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Periode } from "@/types/audit";
import { CalendarIcon } from "lucide-react";

interface PeriodePickerProps {
  periodeList: Periode[];
  selectedPeriodeId?: number;
}

export function PeriodePicker({
  periodeList,
  selectedPeriodeId,
}: PeriodePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelectPeriode = (val: string | null) => {
    if (!val) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("periode", val);
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  if (periodeList.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarIcon className="size-3.5" />
        <span className="font-medium">Periode Audit:</span>
      </div>
      <Select
        value={selectedPeriodeId ? String(selectedPeriodeId) : String(periodeList[0]?.id)}
        onValueChange={handleSelectPeriode}
      >
        <SelectTrigger className="w-[220px] h-9 text-xs font-medium">
          <SelectValue placeholder="Pilih Periode Audit" />
        </SelectTrigger>
        <SelectContent>
          {periodeList.map((p) => (
            <SelectItem key={p.id} value={String(p.id)} className="text-xs">
              <span className="font-medium">{p.nama}</span>
              {p.is_open ? (
                <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                  (Aktif)
                </span>
              ) : (
                <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                  (Tutup)
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
