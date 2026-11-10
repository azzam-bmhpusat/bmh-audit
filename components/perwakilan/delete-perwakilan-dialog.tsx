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
import { deleteCabangAction } from "@/app/actions/cabang";
import { AlertCircleIcon } from "lucide-react";
import type { CabangDetailListItem } from "@/types/audit";

interface DeletePerwakilanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabang: CabangDetailListItem | null;
  onSuccess?: () => void;
}

export function DeletePerwakilanDialog({
  open,
  onOpenChange,
  cabang,
  onSuccess,
}: DeletePerwakilanDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  if (!cabang) return null;

  const hasUsers = (cabang.userCount ?? 0) > 0;
  const hasJawaban = (cabang.jawabanCount ?? 0) > 0;

  const handleDelete = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await deleteCabangAction({ id: cabang.id });
      if (!res.ok) {
        toast.error("Gagal menghapus perwakilan", { description: res.error });
        return;
      }

      toast.success(res.message || "Perwakilan berhasil dihapus");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghapus perwakilan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Perwakilan Cabang?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus perwakilan{" "}
            <span className="font-semibold text-foreground">{cabang.nama}</span>
            {cabang.kode ? ` (${cabang.kode})` : ""}?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {(hasUsers || hasJawaban) && (
          <div className="rounded-lg border border-border p-3 space-y-1.5 bg-muted/40 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <AlertCircleIcon className="size-4 text-foreground shrink-0" />
              <span>Perhatian Dampak Relasi Data:</span>
            </div>
            {hasUsers && (
              <p>
                • Terdapat <span className="font-medium text-foreground">{cabang.userCount} akun pengguna</span> tertaut ke cabang ini. Tautan cabang pada akun tersebut akan dilepas.
              </p>
            )}
            {hasJawaban && (
              <p>
                • Terdapat <span className="font-medium text-foreground">{cabang.jawabanCount} data isian jawaban audit</span>. Seluruh rekaman jawaban dan penilaian terkait cabang ini akan ikut terhapus secara permanen.
              </p>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Menghapus..." : "Hapus Perwakilan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
