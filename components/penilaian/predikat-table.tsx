import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import type { AuditPredikat } from "@/types/audit";
import { cn } from "@/lib/utils";

interface PredikatTableProps {
  predikatList: AuditPredikat[];
  activeNilai?: string | null;
}

export function PredikatTable({
  predikatList,
  activeNilai,
}: PredikatTableProps) {
  const getPredikatStatus = (nilai: string): StatusType => {
    switch (nilai.toUpperCase()) {
      case "A":
        return "success";
      case "B":
        return "info";
      case "C":
        return "warning";
      case "D":
      case "E":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">
          Standar Predikat Hasil Audit Kepatuhan
        </h3>
        <p className="text-xs text-muted-foreground">
          Klasifikasi kepatuhan dan batas rentang nilai akhir audit integratif
          LAZNAS BMH
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-32 font-semibold">
                Nilai Kepatuhan
              </TableHead>
              <TableHead className="w-44 font-semibold">
                Rentang Nilai Akhir (%)
              </TableHead>
              <TableHead className="font-semibold">
                Predikat Kepatuhan
              </TableHead>
              <TableHead className="font-semibold">
                Keterangan & Tindak Lanjut
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {predikatList.map((item) => {
              const isActive =
                activeNilai &&
                activeNilai.toUpperCase() === item.nilai.toUpperCase();

              return (
                <TableRow
                  key={item.nilai}
                  className={cn(
                    "transition-colors",
                    isActive &&
                      "bg-muted/80 font-medium border-l-4 border-l-primary"
                  )}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={getPredikatStatus(item.nilai)}
                        size="sm"
                        className="font-bold px-2.5 py-0.5 text-xs"
                      >
                        {item.nilai}
                      </StatusBadge>
                      {isActive && (
                        <span className="text-[11px] font-semibold text-primary">
                          (Posisi Anda)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums text-sm font-mono">
                    {item.rentang_teks}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.predikat}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.keterangan}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
