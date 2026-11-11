"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart3Icon, ChevronDownIcon, CheckIcon } from "lucide-react";
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

  // Opsi cabang untuk Combobox ({ value, label })
  const cabangOptions: CabangOption[] = React.useMemo(() => {
    return (cabangList ?? []).map((c) => ({
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
    const currentSearch = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(currentSearch);
    if (option) {
      params.set("cabang", option.value);
    } else {
      params.delete("cabang");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePeriodeChange = (periodeIdStr: string | null) => {
    if (!periodeIdStr) return;
    const currentSearch = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(currentSearch);
    params.set("periode", periodeIdStr);
    router.push(`${pathname}?${params.toString()}`);
  };

  const showPeriodeSelect = (periodeList?.length ?? 0) > 1;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border bg-card text-card-foreground">
      {/* 1. Pemilih Cabang (Combobox searchable) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0 sm:min-w-[280px]">
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

      {/* 2. Pemilih Periode (DropdownMenu, hanya jika > 1 periode) */}
      {showPeriodeSelect && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <Label htmlFor="periode-select" className="text-xs font-semibold shrink-0">
            Periode Audit:
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  id="periode-select"
                  variant="outline"
                  size="sm"
                  className="h-9 min-w-0 sm:min-w-[200px] justify-between text-xs font-medium gap-2 px-3"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">
                      {periodeList?.find((p) => p.id === selectedPeriodeId)?.nama ?? "Pilih Periode..."}
                    </span>
                    {periodeList?.find((p) => p.id === selectedPeriodeId) && (
                      <Badge
                        variant={
                          periodeList.find((p) => p.id === selectedPeriodeId)?.is_open
                            ? "default"
                            : "secondary"
                        }
                        className="text-[10px] px-1 py-0 h-4 font-normal shrink-0"
                      >
                        {periodeList.find((p) => p.id === selectedPeriodeId)?.is_open
                          ? "Aktif"
                          : "Tutup"}
                      </Badge>
                    )}
                  </div>
                  <ChevronDownIcon className="size-3.5 opacity-60 shrink-0" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-[240px] p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5">
                  Pilih Periode Audit
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {(periodeList ?? []).map((p) => {
                  const isSelected = p.id === selectedPeriodeId;
                  return (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => handlePeriodeChange(String(p.id))}
                      className={`flex items-center justify-between text-xs cursor-pointer py-2 px-2.5 rounded-md transition-colors ${
                        isSelected ? "bg-accent font-medium text-accent-foreground" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-medium text-foreground truncate">{p.nama}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {p.is_open ? "Terbuka untuk pengisian" : "Periode ditutup (hanya-baca)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge
                          variant={p.is_open ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0 h-4 font-normal"
                        >
                          {p.is_open ? "Aktif" : "Tutup"}
                        </Badge>
                        {isSelected && <CheckIcon className="size-3.5 text-primary" />}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* 3. Pintasan ke Halaman Ringkasan Semua Cabang */}
      <div className="shrink-0 ml-auto">
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          render={<Link href="/ringkasan" />}
          nativeButton={false}
        >
          <BarChart3Icon className="size-3.5" />
          <span>Ringkasan Semua Cabang</span>
        </Button>
      </div>
    </div>
  );
}
