"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayersIcon,
  BookOpenIcon,
  SlidersIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  FileCheck2Icon,
} from "lucide-react";

export interface PilarSummary {
  kode: string;
  nama: string;
  jumlahVariabel: number;
  jumlahItem: number;
  totalBobot: number;
}

interface InstrumenOverviewProps {
  pilarList: PilarSummary[];
  totalItem: number;
  totalVariabel: number;
  totalBobot: number;
  skorMaksimumIdeal: number;
}

export function InstrumenOverview({
  pilarList,
  totalItem,
  totalVariabel,
  totalBobot,
  skorMaksimumIdeal,
}: InstrumenOverviewProps) {
  return (
    <div className="space-y-6">
      {/* 1. Stat Cards Ringkasan Instrumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pilar & Variabel
            </CardTitle>
            <LayersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {pilarList.length} <span className="text-sm font-normal text-muted-foreground">Pilar</span> / {totalVariabel} <span className="text-sm font-normal text-muted-foreground">Variabel</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Struktur instrumen evaluasi terpadu
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Indikator Pertanyaan
            </CardTitle>
            <BookOpenIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {totalItem} <span className="text-sm font-normal text-muted-foreground">Item</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              5 baris fokus pemeriksaan per butir
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Bobot Global
            </CardTitle>
            <SlidersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalBobot}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Akumulasi bobot instrumen (1–10)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Skor Maksimum Ideal
            </CardTitle>
            <FileCheck2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{skorMaksimumIdeal}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Total Bobot × 5 (Target 100%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Breakdown Tabel Pilar */}
      <Card className="shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Struktur Pilar Audit Kepatuhan Integratif
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Rincian distribusi variabel, butir pertanyaan, dan kontribusi bobot per pilar.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 self-start sm:self-auto"
              render={<Link href="/nilai-audit" />}
              nativeButton={false}
            >
              <span>Kelola Bobot di Matriks</span>
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[80px] text-center text-xs">Pilar</TableHead>
                  <TableHead className="text-xs">Nama Pilar Kepatuhan</TableHead>
                  <TableHead className="w-[140px] text-right text-xs tabular-nums">Jumlah Variabel</TableHead>
                  <TableHead className="w-[140px] text-right text-xs tabular-nums">Jumlah Butir</TableHead>
                  <TableHead className="w-[140px] text-right text-xs tabular-nums">Subtotal Bobot</TableHead>
                  <TableHead className="w-[160px] text-right text-xs tabular-nums">Skor Maksimal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pilarList.map((pilar) => (
                  <TableRow key={pilar.kode} className="hover:bg-muted/20">
                    <TableCell className="text-center font-bold text-xs font-mono">
                      <Badge variant="outline" className="px-2 py-0.5">
                        {pilar.kode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {pilar.nama}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {pilar.jumlahVariabel} variabel
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {pilar.jumlahItem} butir
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums">
                      {pilar.totalBobot}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                      {pilar.totalBobot * 5}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Baris Total */}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={2} className="text-xs uppercase text-foreground">
                    Total Instrumen
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {totalVariabel} variabel
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {totalItem} butir
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold tabular-nums text-foreground">
                    {totalBobot}
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold tabular-nums text-foreground">
                    {skorMaksimumIdeal}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3.5 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircleIcon className="size-4 text-foreground" />
              <span>Petunjuk Pengubahan Bobot:</span>
            </div>
            <p className="leading-relaxed">
              Bobot tiap butir pertanyaan (skala 1–10) berlaku global untuk seluruh cabang dan seluruh periode. Anda dapat mengubah bobot secara spesifik per baris dengan mengklik sel angka bobot pada halaman <strong>Review Penilaian</strong> atau <strong>Penilaian Perwakilan</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
