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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { createPeriodeAction, updatePeriodeAction } from "@/app/actions/periode";
import type { Periode } from "@/types/audit";
import { Loader2Icon } from "lucide-react";

interface PeriodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periode: Periode | null;
  onSuccess?: () => void;
}

export function PeriodeDialog({
  open,
  onOpenChange,
  periode,
  onSuccess,
}: PeriodeDialogProps) {
  const isEdit = Boolean(periode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah Periode Audit" : "Tambah Periode Audit"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui informasi nama dan status periode audit kepatuhan BMH."
              : "Buat periode audit kepatuhan baru untuk seluruh perwakilan cabang."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <PeriodeFormContent
            key={periode ? periode.id : "new"}
            periode={periode}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PeriodeFormContent({
  periode,
  onOpenChange,
  onSuccess,
}: {
  periode: Periode | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const isEdit = Boolean(periode);

  const [nama, setNama] = React.useState(periode?.nama || "");
  const [isOpen, setIsOpen] = React.useState(periode ? periode.is_open : true);
  const [setAsOnlyActive, setSetAsOnlyActive] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!nama.trim()) {
      setErrorMsg("Nama periode wajib diisi.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isEdit && periode) {
        const res = await updatePeriodeAction({
          id: periode.id,
          nama: nama.trim(),
          is_open: isOpen,
          setAsOnlyActive,
        });

        if (!res.ok) {
          setErrorMsg(res.error);
          toast.error("Gagal memperbarui periode", { description: res.error });
          return;
        }

        toast.success(res.message || "Periode audit berhasil diperbarui");
      } else {
        const res = await createPeriodeAction({
          nama: nama.trim(),
          is_open: isOpen,
          setAsOnlyActive,
        });

        if (!res.ok) {
          setErrorMsg(res.error);
          toast.error("Gagal menambahkan periode", { description: res.error });
          return;
        }

        toast.success(res.message || "Periode audit berhasil ditambahkan");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan periode");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

          {errorMsg && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="periode-nama">Nama Periode</Label>
              <Input
                id="periode-nama"
                placeholder="Contoh: Semester-II Tahun 2026"
                value={nama}
                onChange={(e) => {
                  setNama(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                disabled={isLoading}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Gunakan format yang konsisten, misalnya: Semester-I Tahun 2026 atau Triwulan-III 2026.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="periode-status" className="text-sm font-medium cursor-pointer">
                  Status Pengisian Terbuka
                </Label>
                <p className="text-xs text-muted-foreground">
                  Jika aktif, cabang dapat melakukan pengisian instrumen dan bukti evidence.
                </p>
              </div>
              <Switch
                id="periode-status"
                checked={isOpen}
                onCheckedChange={(checked) => setIsOpen(Boolean(checked))}
                disabled={isLoading}
              />
            </div>

            {isOpen && (
              <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-3">
                <Checkbox
                  id="periode-only-active"
                  checked={setAsOnlyActive}
                  onCheckedChange={(checked) => setSetAsOnlyActive(Boolean(checked))}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor="periode-only-active"
                    className="text-xs font-medium cursor-pointer"
                  >
                    Tutup periode aktif lainnya secara otomatis
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Menjadikan periode ini sebagai satu-satunya periode yang terbuka untuk seluruh cabang.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Periode"}
            </Button>
          </DialogFooter>
        </form>
  );
}
