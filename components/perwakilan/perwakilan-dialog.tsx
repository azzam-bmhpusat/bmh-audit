"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCabangAction, updateCabangAction } from "@/app/actions/cabang";
import { createCabangSchema, updateCabangSchema } from "@/lib/schemas";
import type { Cabang } from "@/types/audit";

interface PerwakilanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabangToEdit?: Cabang | null;
  onSuccess?: () => void;
}

export function PerwakilanDialog({
  open,
  onOpenChange,
  cabangToEdit,
  onSuccess,
}: PerwakilanDialogProps) {
  const isEditMode = Boolean(cabangToEdit);

  const [nama, setNama] = React.useState("");
  const [kode, setKode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (cabangToEdit) {
      setNama(cabangToEdit.nama || "");
      setKode(cabangToEdit.kode || "");
    } else {
      setNama("");
      setKode("");
    }
  }, [cabangToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const trimmedNama = nama.trim();
    const trimmedKode = kode.trim().toUpperCase();

    if (isEditMode && cabangToEdit) {
      const payload = {
        id: cabangToEdit.id,
        nama: trimmedNama,
        kode: trimmedKode || null,
      };

      const parsed = updateCabangSchema.safeParse(payload);
      if (!parsed.success) {
        toast.warning("Validasi gagal", {
          description: parsed.error.issues[0]?.message,
        });
        return;
      }

      setIsLoading(true);
      try {
        const res = await updateCabangAction(parsed.data);
        if (!res.ok) {
          toast.error("Gagal memperbarui perwakilan", { description: res.error });
          return;
        }
        toast.success(res.message || "Data perwakilan berhasil diperbarui");
        onOpenChange(false);
        onSuccess?.();
      } catch {
        toast.error("Terjadi kesalahan sistem");
      } finally {
        setIsLoading(false);
      }
    } else {
      const payload = {
        nama: trimmedNama,
        kode: trimmedKode || null,
      };

      const parsed = createCabangSchema.safeParse(payload);
      if (!parsed.success) {
        toast.warning("Validasi gagal", {
          description: parsed.error.issues[0]?.message,
        });
        return;
      }

      setIsLoading(true);
      try {
        const res = await createCabangAction(parsed.data);
        if (!res.ok) {
          toast.error("Gagal menambahkan perwakilan", { description: res.error });
          return;
        }
        toast.success(res.message || "Perwakilan baru berhasil ditambahkan");
        onOpenChange(false);
        onSuccess?.();
      } catch {
        toast.error("Terjadi kesalahan sistem");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Data Perwakilan" : "Tambah Perwakilan Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Perbarui nama atau kode perwakilan cabang daerah BMH."
              : "Daftarkan nama perwakilan / cabang daerah baru ke dalam sistem audit."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 1. Nama Perwakilan */}
          <div className="space-y-1.5">
            <Label htmlFor="input-nama-cabang">Nama Perwakilan / Daerah</Label>
            <Input
              id="input-nama-cabang"
              placeholder="Contoh: Jawa Timur atau Sumatera Utara"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Nama ini akan tampil pada formulir penilaian audit dan pemilih cabang.
            </p>
          </div>

          {/* 2. Kode Perwakilan */}
          <div className="space-y-1.5">
            <Label htmlFor="input-kode-cabang">Kode Perwakilan (Opsional)</Label>
            <Input
              id="input-kode-cabang"
              placeholder="Contoh: JTM, SMU, DKI"
              value={kode}
              onChange={(e) => setKode(e.target.value.toUpperCase())}
              disabled={isLoading}
              maxLength={10}
            />
            <p className="text-[11px] text-muted-foreground">
              Kode singkatan unik untuk identifikasi ringkas (maksimal 10 karakter).
            </p>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Menyimpan..."
                : isEditMode
                ? "Simpan Perubahan"
                : "Tambah Perwakilan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
