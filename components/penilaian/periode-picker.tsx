"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import type { Periode } from "@/types/audit";
import { CalendarIcon, ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodePickerProps {
  periodeList: Periode[];
  selectedPeriodeId?: number;
  className?: string;
  showLabel?: boolean;
}

export function PeriodePicker({
  periodeList,
  selectedPeriodeId,
  className,
  showLabel = true,
}: PeriodePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelectPeriode = (id: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("periode", String(id));
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  if (periodeList.length === 0) return null;

  const currentPeriode =
    periodeList.find((p) => p.id === selectedPeriodeId) ||
    periodeList.find((p) => p.is_open) ||
    periodeList[0];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <CalendarIcon className="size-3.5" />
          <span className="font-medium">Periode Audit:</span>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-9 min-w-[210px] justify-between text-xs font-medium gap-2 px-3 bg-card hover:bg-accent/50"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="truncate">{currentPeriode?.nama ?? "Pilih Periode"}</span>
                {currentPeriode && (
                  <Badge
                    variant={currentPeriode.is_open ? "default" : "secondary"}
                    className="text-[10px] px-1 py-0 h-4 font-normal shrink-0"
                  >
                    {currentPeriode.is_open ? "Aktif" : "Tutup"}
                  </Badge>
                )}
              </div>
              <ChevronDownIcon className="size-3.5 opacity-60 shrink-0" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-[260px] p-1">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5">
              Siklus Periode Audit
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {periodeList.map((p) => {
              const isSelected = p.id === currentPeriode?.id;
              return (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => handleSelectPeriode(p.id)}
                  className={cn(
                    "flex items-center justify-between text-xs cursor-pointer py-2 px-2.5 rounded-md transition-colors",
                    isSelected && "bg-accent font-medium text-accent-foreground"
                  )}
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
  );
}
