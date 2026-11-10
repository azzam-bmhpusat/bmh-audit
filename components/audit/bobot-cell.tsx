"use client";

import * as React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircleIcon } from "lucide-react";

interface BobotCellProps {
  itemNomor: number;
  bobot: number;
  disabled?: boolean;
  onSave: (itemNomor: number, newBobot: number) => void;
}

/**
 * Sel Bobot inline yang dapat diedit oleh admin SIA.
 * Memunculkan AlertDialog konfirmasi sebelum perubahan disimpan ke backend,
 * karena perubahan bobot bersifat global (semua cabang & semua periode).
 */
export function BobotCell({
  itemNomor,
  bobot,
  disabled = false,
  onSave,
}: BobotCellProps) {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [pendingBobot, setPendingBobot] = React.useState<number | null>(null);

  const handleSelectChange = (val: string | null) => {
    if (!val || disabled) return;
    const num = Number(val);
    if (num !== bobot && num >= 1 && num <= 10) {
      setPendingBobot(num);
      setOpenDialog(true);
    }
  };

  const handleConfirm = () => {
    if (pendingBobot !== null && pendingBobot !== bobot) {
      onSave(itemNomor, pendingBobot);
    }
    setOpenDialog(false);
    setPendingBobot(null);
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setPendingBobot(null);
  };

  return (
    <>
      <div className="flex items-center justify-end">
        <Select
          value={String(bobot)}
          onValueChange={handleSelectChange}
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className="h-7 w-16 px-1 text-xs text-right tabular-nums font-semibold justify-end"
            aria-label={`Ubah bobot item ${itemNomor}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((b) => (
              <SelectItem key={b} value={String(b)} className="text-xs">
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircleIcon className="size-5 shrink-0" />
              <span>Konfirmasi Perubahan Bobot</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Bobot item no. <strong>{itemNomor}</strong> akan diubah dari{" "}
              <strong>{bobot}</strong> menjadi <strong>{pendingBobot}</strong> untuk{" "}
              <strong>semua cabang dan semua periode</strong>. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
