"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AwardIcon, ShieldCheckIcon, PencilIcon } from "lucide-react";
import { PredikatDialog } from "./predikat-dialog";
import type { AuditPredikat } from "@/types/audit";

interface PredikatTableViewProps {
  predikatList: AuditPredikat[];
}

export function PredikatTableView({ predikatList }: PredikatTableViewProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedPredikatForEdit, setSelectedPredikatForEdit] = React.useState<AuditPredikat | null>(null);

  const handleOpenEdit = (item: AuditPredikat) => {
    setSelectedPredikatForEdit(item);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <AwardIcon className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Standar Predikat Hasil Audit Kepatuhan
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Konfigurasi acuan penilaian otomatis skala 100 dan penentuan kewajiban penerbitan PTK (Permintaan Tindakan Koreksi).
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[80px] text-center text-xs">Nilai</TableHead>
                  <TableHead className="w-[140px] text-xs">Rentang Skor</TableHead>
                  <TableHead className="w-[220px] text-xs">Predikat</TableHead>
                  <TableHead className="w-[180px] text-xs">Status Kepatuhan</TableHead>
                  <TableHead className="w-[120px] text-center text-xs">Wajib PTK</TableHead>
                  <TableHead className="text-xs">Keterangan & Tindak Lanjut</TableHead>
                  <TableHead className="w-[90px] text-center text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predikatList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-xs text-muted-foreground"
                    >
                      Data standar predikat belum tersedia di database.
                    </TableCell>
                  </TableRow>
                ) : (
                  predikatList.map((item) => (
                    <TableRow key={item.nilai} className="hover:bg-muted/20">
                      <TableCell className="text-center font-bold text-sm">
                        <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
                          {item.nilai}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium text-foreground">
                        {item.rentang_teks}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {item.predikat}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-foreground">
                          {item.status_kepatuhan}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.wajib_ptk ? (
                          <Badge variant="default" className="text-[10px] px-2 py-0.5">
                            Wajib PTK
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                            Tidak Wajib
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground leading-relaxed">
                        {item.keterangan}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 px-2.5 text-xs font-medium"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <PencilIcon className="size-3.5" />
                          <span>Edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3.5 text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-4 shrink-0 text-foreground mt-0.5" />
            <div className="space-y-1">
              <span className="font-medium text-foreground">
                Integritas Kalkulasi Predikat:
              </span>
              <p className="leading-relaxed">
                Kalkulasi predikat dihitung secara langsung di tingkat basis data (PostgreSQL Database View). Hasil akhir persentase kepatuhan dihitung dari:
                <code className="mx-1 px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground">
                  (Total Nilai Skor Auditor ÷ Skor Maksimum Ideal 360) × 100%
                </code>.
                Perubahan pada ambang batas atau kriteria di atas akan otomatis memperbarui nilai kepatuhan seluruh perwakilan cabang.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PredikatDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        predikat={selectedPredikatForEdit}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
