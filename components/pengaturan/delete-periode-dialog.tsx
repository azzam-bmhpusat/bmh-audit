"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deletePeriodeAction } from "@/app/actions/periode";
import { AlertCircleIcon } from "lucide-react";
import type { PeriodeDetailListItem } from "@/types/audit";

interface DeletePeriodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periode: PeriodeDetailListItem | null;
  onSuccess?: () => void;
}

export function DeletePeriodeDialog({
  open,
  onOpenChange,
  periode,
  onSuccess,
}: DeletePeriodeDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  if (!periode) return null;

  const totalTerkait = (periode.jawabanCount ?? 0) + (periode.penilaianCount ?? 0);
  const hasHistory = totalTerkait > 0;

  const handleDelete = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await deletePeriodeAction({ id: periode.id });
      if (!res.ok) {
        toast.error("Gagal menghapus periode", { description: res.error });
        return;
      }

      toast.success(res.message || "Periode berhasil dihapus");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghapus periode");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasHistory ? "Periode Tidak Dapat Dihapus" : "Hapus Periode Audit?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasHistory ? (
              <span className="flex flex-col gap-2">
                <span>
                  Periode <span className="font-semibold text-foreground">{periode.nama}</span> sudah memiliki{" "}
                  <strong className="text-foreground">{periode.jawabanCount ?? 0} data isian cabang</strong> dan{" "}
                  <strong className="text-foreground">{periode.penilaianCount ?? 0} penilaian auditor</strong>.
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 p-2.5 rounded-md">
                  <AlertCircleIcon className="size-4 shrink-0 text-foreground" />
                  Demi menjaga integritas riwayat penilaian kepatuhan, periode yang sudah berjalan tidak dapat dihapus. Anda dapat mengubah statusnya menjadi <strong>Ditutup</strong> agar tidak dapat diisi kembali.
                </span>
              </span>
            ) : (
              <span>
                Apakah Anda yakin ingin menghapus periode{" "}
                <span className="font-semibold text-foreground">{periode.nama}</span>? Periode ini belum memiliki data isian dan tindakan ini tidak dapat dibatalkan.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          {hasHistory ? (
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              Saya Mengerti
            </AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isLoading}
              >
                {isLoading ? "Menghapus..." : "Ya, Hapus Periode"}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
