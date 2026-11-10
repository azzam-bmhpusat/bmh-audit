"use client";

import * as React from "react";
import Link from "next/link";
import { SearchIcon, ArrowRightIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAngka, formatPersen } from "@/lib/format";

export interface CabangSummaryItem {
  cabangId: number;
  cabangNama: string;
  cabangKode: string | null;
  totalBobot: number;
  skorMaksimumIdeal: number;
  totalNilaiSkorAudite: number;
  totalNilaiSkorAuditor: number;
  persenAuditor: number;
  persenAudite: number;
  itemTerisiAudite: number;
  itemDinilaiAuditor: number;
  totalItem: number;
}

interface RingkasanCabangTableProps {
  data: CabangSummaryItem[];
  periodeId: number;
}

export function RingkasanCabangTable({ data, periodeId }: RingkasanCabangTableProps) {
  const [search, setSearch] = React.useState("");

  const filteredData = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (item) =>
        item.cabangNama.toLowerCase().includes(q) ||
        (item.cabangKode && item.cabangKode.toLowerCase().includes(q))
    );
  }, [data, search]);

  return (
    <div className="space-y-4">
      {/* Kolom pencarian */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Cari nama perwakilan atau kode cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
            aria-label="Cari nama perwakilan cabang"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{filteredData.length}</span> dari{" "}
          <span className="font-semibold text-foreground">{data.length}</span> cabang
        </div>
      </div>

      {/* Tampilan Desktop: Tabel Lengkap */}
      <div className="hidden md:block rounded-md border bg-card overflow-hidden">
        <Table className="text-xs">
          <TableHeader className="bg-muted/50 border-b">
            <TableRow>
              <TableHead className="w-12 text-center font-bold">No</TableHead>
              <TableHead className="font-bold min-w-[200px]">Nama Perwakilan / Cabang</TableHead>
              <TableHead className="font-bold text-center w-36">Progres Isian Cabang</TableHead>
              <TableHead className="font-bold text-right w-28">Nilai Audite</TableHead>
              <TableHead className="font-bold text-center w-36">Penilaian SIA</TableHead>
              <TableHead className="font-bold text-right w-36">Nilai & Capaian SIA</TableHead>
              <TableHead className="w-28 text-center font-bold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Tidak ada cabang yang cocok dengan pencarian &quot;{search}&quot;.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, idx) => {
                const isAuditeLengkap = item.itemTerisiAudite === item.totalItem && item.totalItem > 0;
                const isAuditorLengkap = item.itemDinilaiAuditor === item.totalItem && item.totalItem > 0;

                return (
                  <TableRow key={item.cabangId} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-center tabular-nums font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>

                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{item.cabangNama}</span>
                        {item.cabangKode && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                            {item.cabangKode}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center tabular-nums">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-medium">
                          {item.itemTerisiAudite} / {item.totalItem} item
                        </span>
                        <Badge
                          variant={isAuditeLengkap ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {formatPersen(item.persenAudite)}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-right tabular-nums font-medium">
                      {formatAngka(item.totalNilaiSkorAudite)}
                    </TableCell>

                    <TableCell className="text-center tabular-nums">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-medium">
                          {item.itemDinilaiAuditor} / {item.totalItem} item
                        </span>
                        <Badge
                          variant={isAuditorLengkap ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {formatPersen(item.persenAuditor)}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-right tabular-nums font-semibold">
                      <div>
                        {formatAngka(item.totalNilaiSkorAuditor)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          / {formatAngka(item.skorMaksimumIdeal)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        render={
                          <Link href={`/nilai-audit?cabang=${item.cabangId}&periode=${periodeId}`} />
                        }
                      >
                        <span>Nilai</span>
                        <ArrowRightIcon className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Tampilan Mobile: Kartu per Cabang */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredData.length === 0 ? (
          <div className="rounded-md border p-6 text-center text-xs text-muted-foreground">
            Tidak ada cabang yang cocok dengan pencarian &quot;{search}&quot;.
          </div>
        ) : (
          filteredData.map((item, idx) => (
            <Card key={item.cabangId} className="shadow-xs border">
              <CardHeader className="p-3.5 pb-2 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">
                    #{idx + 1}
                  </Badge>
                  <CardTitle className="text-sm font-semibold">
                    {item.cabangNama}
                  </CardTitle>
                </div>
                {item.cabangKode && (
                  <Badge variant="secondary" className="text-[10px]">
                    {item.cabangKode}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-3.5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Progres Cabang:</span>
                    <div className="font-semibold tabular-nums">
                      {item.itemTerisiAudite} / {item.totalItem} ({formatPersen(item.persenAudite)})
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Penilaian SIA:</span>
                    <div className="font-semibold tabular-nums">
                      {item.itemDinilaiAuditor} / {item.totalItem} ({formatPersen(item.persenAuditor)})
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-2.5">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Skor SIA:</span>
                    <div className="font-bold text-sm tabular-nums">
                      {formatAngka(item.totalNilaiSkorAuditor)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        / {formatAngka(item.skorMaksimumIdeal)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    render={
                      <Link href={`/nilai-audit?cabang=${item.cabangId}&periode=${periodeId}`} />
                    }
                  >
                    <span>Buka Penilaian</span>
                    <ArrowRightIcon className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
