"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BarChart3Icon } from "lucide-react";
import type { Cabang, Periode } from "@/types/audit";

interface CabangPickerProps {
  cabangList: Cabang[];
  periodeList: Periode[];
  selectedCabangId?: number;
  selectedPeriodeId?: number;
}

interface CabangOption {
  value: string;
  label: string;
}

export function CabangPicker({
  cabangList,
  periodeList,
  selectedCabangId,
  selectedPeriodeId,
}: CabangPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Opsi cabang untuk Combobox ({ value, label })
  const cabangOptions: CabangOption[] = React.useMemo(() => {
    return cabangList.map((c) => ({
      value: String(c.id),
      label: c.nama,
    }));
  }, [cabangList]);

  // Nilai cabang yang sedang terpilih
  const selectedOption = React.useMemo(() => {
    if (!selectedCabangId) return null;
    return cabangOptions.find((opt) => opt.value === String(selectedCabangId)) ?? null;
  }, [selectedCabangId, cabangOptions]);

  const handleCabangChange = (option: CabangOption | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (option) {
      params.set("cabang", option.value);
    } else {
      params.delete("cabang");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePeriodeChange = (periodeIdStr: string | null) => {
    if (!periodeIdStr) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("periode", periodeIdStr);
    router.push(`${pathname}?${params.toString()}`);
  };

  const showPeriodeSelect = periodeList.length > 1;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border bg-card text-card-foreground">
      {/* 1. Pemilih Cabang (Combobox searchable) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-[280px]">
        <Label htmlFor="cabang-picker" className="text-xs font-semibold shrink-0">
          Cabang / Perwakilan:
        </Label>
        <div className="w-full sm:max-w-md">
          <Combobox
            items={cabangOptions}
            value={selectedOption}
            onValueChange={handleCabangChange}
          >
            <ComboboxInput
              id="cabang-picker"
              placeholder="Cari dan pilih cabang..."
              showTrigger
              showClear
              aria-label="Pilih Cabang atau Perwakilan Daerah"
              className="w-full"
            />
            <ComboboxContent align="start">
              <ComboboxEmpty>Cabang tidak ditemukan</ComboboxEmpty>
              <ComboboxList>
                {(item: CabangOption) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>

      {/* 2. Pemilih Periode (Select, hanya jika > 1 periode) */}
      {showPeriodeSelect && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <Label htmlFor="periode-select" className="text-xs font-semibold shrink-0">
            Periode Audit:
          </Label>
          <Select
            value={selectedPeriodeId ? String(selectedPeriodeId) : undefined}
            onValueChange={handlePeriodeChange}
          >
            <SelectTrigger
              id="periode-select"
              size="sm"
              className="h-9 min-w-[200px] text-xs font-medium"
              aria-label="Pilih Periode Audit"
            >
              <SelectValue placeholder="Pilih Periode..." />
            </SelectTrigger>
            <SelectContent align="end">
              {periodeList.map((p) => (
                <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                  {p.nama} {!p.is_open && "(Ditutup)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 3. Pintasan ke Halaman Ringkasan Semua Cabang */}
      <div className="shrink-0 ml-auto">
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          render={<Link href="/ringkasan" />}
        >
          <BarChart3Icon className="size-3.5" />
          <span>Ringkasan Semua Cabang</span>
        </Button>
      </div>
    </div>
  );
}
