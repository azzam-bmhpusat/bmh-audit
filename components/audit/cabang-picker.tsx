"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  SearchIcon,
  ChevronsUpDownIcon,
  CheckIcon,
  XIcon,
  CornerDownLeftIcon,
  BarChart3Icon,
  ChevronDownIcon,
  Building2Icon,
} from "lucide-react";
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

  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const listContainerRef = React.useRef<HTMLDivElement | null>(null);

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

  // Penyaringan cabang secara real-time
  const filteredOptions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cabangOptions;
    return cabangOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [query, cabangOptions]);

  // Setiap kali query pencarian berubah, otomatis highlight item pertama (auto-highlight terdekat)
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Pastikan input otomatis terfokus saat popover dibuka
  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setHighlightedIndex(0);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Pastikan item yang ter-highlight terlihat di viewport scroll
  React.useEffect(() => {
    if (!listContainerRef.current) return;
    const items = listContainerRef.current.querySelectorAll<HTMLElement>("[data-combobox-item]");
    const activeItem = items[highlightedIndex];
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

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

  const handleSelectOption = (option: CabangOption) => {
    handleCabangChange(option);
    setIsOpen(false);
    setQuery("");
  };

  const handleClearCabang = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCabangChange(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : Math.max(filteredOptions.length - 1, 0)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
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
    <div className="flex flex-wrap items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-xs">
      {/* 1. Pemilih Cabang (Shadcn Combobox: Popover + Auto-Highlight & Enter Select) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0 sm:min-w-[320px]">
        <Label htmlFor="cabang-combobox-trigger" className="text-xs font-semibold shrink-0 text-foreground flex items-center gap-1.5">
          <Building2Icon className="size-3.5 text-primary" />
          <span>Cabang / Perwakilan:</span>
        </Label>

        <div className="w-full sm:max-w-md">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger
              render={
                <Button
                  id="cabang-combobox-trigger"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isOpen}
                  className="w-full h-9 justify-between font-normal text-xs sm:text-sm px-3 bg-background hover:bg-accent/40 border-input cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <SearchIcon className="size-3.5 text-muted-foreground shrink-0" />
                    {selectedOption ? (
                      <span className="font-semibold text-foreground truncate">
                        {selectedOption.label}
                      </span>
                    ) : (
                      <span className="text-muted-foreground truncate">
                        Pilih atau cari cabang / perwakilan...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {selectedOption && (
                      <span
                        role="button"
                        aria-label="Hapus pilihan cabang"
                        onClick={handleClearCabang}
                        className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        <XIcon className="size-3" />
                      </span>
                    )}
                    <ChevronsUpDownIcon className="size-3.5 text-muted-foreground opacity-60" />
                  </div>
                </Button>
              }
            />

            <PopoverContent
              align="start"
              sideOffset={4}
              className="w-[calc(100vw-2rem)] sm:w-[380px] p-0 shadow-lg border-border/80 rounded-xl overflow-hidden"
            >
              {/* Form Input Pencarian Siap Ketik */}
              <div className="p-2.5 border-b border-border/60 bg-muted/20">
                <div className="relative flex items-center">
                  <SearchIcon className="absolute left-2.5 size-4 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik nama cabang (misal: Jawa Timur, Aceh)..."
                    className="w-full h-8.5 pl-8 pr-8 text-xs bg-background rounded-lg border border-input outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-2 text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 px-1">
                  <span>
                    {filteredOptions.length} perwakilan ditemukan
                  </span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/50 font-mono">
                    Tekan Enter ↵
                  </span>
                </div>
              </div>

              {/* Daftar Cabang / Perwakilan */}
              <div
                ref={listContainerRef}
                className="max-h-60 overflow-y-auto p-1.5 space-y-0.5"
              >
                {filteredOptions.length === 0 ? (
                  <div className="py-6 px-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Tidak ada perwakilan dengan kata kunci &quot;{query}&quot;.
                    </p>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setQuery("")}
                      className="mt-2 text-primary"
                    >
                      Reset Pencarian
                    </Button>
                  </div>
                ) : (
                  filteredOptions.map((item, index) => {
                    const isSelected = selectedOption?.value === item.value;
                    const isHighlighted = highlightedIndex === index;

                    return (
                      <div
                        key={item.value}
                        data-combobox-item
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectOption(item)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                          isHighlighted
                            ? "bg-primary/10 text-primary font-medium"
                            : isSelected
                            ? "bg-accent/60 text-accent-foreground font-medium"
                            : "text-foreground hover:bg-muted/70"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelected ? (
                            <CheckIcon className="size-3.5 text-primary shrink-0" />
                          ) : (
                            <div className="size-3.5 shrink-0" />
                          )}
                          <span className="truncate">{item.label}</span>
                        </div>

                        {isHighlighted && (
                          <span className="text-[10px] text-primary/80 font-mono flex items-center gap-0.5 shrink-0 ml-2">
                            <CornerDownLeftIcon className="size-3" />
                            <span>Pilih</span>
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 2. Pemilih Periode (DropdownMenu, hanya jika > 1 periode) */}
      {showPeriodeSelect && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <Label htmlFor="periode-select" className="text-xs font-semibold shrink-0 text-foreground">
            Periode Audit:
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  id="periode-select"
                  variant="outline"
                  size="sm"
                  className="h-9 min-w-0 sm:min-w-[200px] justify-between text-xs font-medium gap-2 px-3 cursor-pointer bg-background hover:bg-accent/40 border-input"
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
                        className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0"
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
            <DropdownMenuContent align="end" className="w-[240px] p-1 shadow-lg border-border/80 rounded-xl">
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
          className="h-9 text-xs gap-1.5 cursor-pointer bg-background hover:bg-accent/40"
          render={<Link href="/ringkasan" />}
          nativeButton={false}
        >
          <BarChart3Icon className="size-3.5 text-primary" />
          <span>Ringkasan Semua Cabang</span>
        </Button>
      </div>
    </div>
  );
}
