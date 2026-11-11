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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { updatePredikatAction } from "@/app/actions/predikat";
import type { AuditPredikat } from "@/types/audit";
import { Loader2Icon, ShieldAlertIcon } from "lucide-react";

interface PredikatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  predikat: AuditPredikat | null;
  onSuccess?: () => void;
}

export function PredikatDialog({
  open,
  onOpenChange,
  predikat,
  onSuccess,
}: PredikatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Ubah Standar Predikat</DialogTitle>
            {predikat && (
              <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
                Nilai {predikat.nilai}
              </Badge>
            )}
          </div>
          <DialogDescription>
            Perbarui parameter nama predikat, status kepatuhan, rentang ambang skor,
            serta kewajiban penerbitan PTK.
          </DialogDescription>
        </DialogHeader>

        {open && predikat && (
          <PredikatFormContent
            key={predikat.nilai}
            predikat={predikat}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PredikatFormContent({
  predikat,
  onOpenChange,
  onSuccess,
}: {
  predikat: AuditPredikat;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [namaPredikat, setNamaPredikat] = React.useState(predikat.predikat);
  const [statusKepatuhan, setStatusKepatuhan] = React.useState(predikat.status_kepatuhan);
  const [batasBawah, setBatasBawah] = React.useState<number | string>(predikat.batas_bawah);
  const [batasAtas, setBatasAtas] = React.useState<number | string>(predikat.batas_atas);
  const [wajibPtk, setWajibPtk] = React.useState<boolean>(predikat.wajib_ptk);
  const [keterangan, setKeterangan] = React.useState(predikat.keterangan);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const getBadgeVariant = (grade: string) => {
    switch (grade.toUpperCase()) {
      case "A":
        return "default" as const;
      case "B":
        return "secondary" as const;
      case "C":
      case "D":
        return "outline" as const;
      case "E":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const numBatasBawah = Number(batasBawah);
    const numBatasAtas = Number(batasAtas);

    if (isNaN(numBatasBawah) || numBatasBawah < 0 || numBatasBawah > 100) {
      setErrorMsg("Batas bawah harus berupa angka antara 0 dan 100.");
      return;
    }

    if (isNaN(numBatasAtas) || numBatasAtas < 0 || numBatasAtas > 100) {
      setErrorMsg("Batas atas harus berupa angka antara 0 dan 100.");
      return;
    }

    if (numBatasAtas < numBatasBawah) {
      setErrorMsg("Batas atas harus lebih besar atau sama dengan batas bawah.");
      return;
    }

    if (!namaPredikat.trim()) {
      setErrorMsg("Nama predikat wajib diisi.");
      return;
    }

    if (!statusKepatuhan.trim()) {
      setErrorMsg("Status kepatuhan wajib diisi.");
      return;
    }

    if (!keterangan.trim()) {
      setErrorMsg("Keterangan & tindak lanjut wajib diisi.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await updatePredikatAction({
        nilai: predikat.nilai,
        predikat: namaPredikat.trim(),
        status_kepatuhan: statusKepatuhan.trim(),
        batas_bawah: numBatasBawah,
        batas_atas: numBatasAtas,
        wajib_ptk: wajibPtk,
        keterangan: keterangan.trim(),
      });

      if (!res.ok) {
        setErrorMsg(res.error);
        toast.error("Gagal memperbarui predikat", { description: res.error });
        return;
      }

      toast.success(res.message || `Standar predikat ${predikat.nilai} berhasil diperbarui`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem";
      setErrorMsg(msg);
      toast.error("Gagal menyimpan perubahan", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {errorMsg && (
        <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive flex items-start gap-2">
          <ShieldAlertIcon className="size-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Nilai Grade & Ringkasan */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-foreground">
            Tingkat Nilai Predikat:
          </span>
          <p className="text-[11px] text-muted-foreground">
            Identifier baku standar audit kepatuhan.
          </p>
        </div>
        <Badge
          variant={getBadgeVariant(predikat.nilai)}
          className="font-mono text-sm px-3 py-1 font-bold"
        >
          Nilai {predikat.nilai}
        </Badge>
      </div>

      {/* Predikat */}
      <div className="space-y-1.5">
        <Label htmlFor="predikat" className="text-xs font-medium">
          Nama Predikat <span className="text-destructive">*</span>
        </Label>
        <Input
          id="predikat"
          value={namaPredikat}
          onChange={(e) => setNamaPredikat(e.target.value)}
          placeholder="Contoh: Sangat Patuh (Excellence / Platinum)"
          className="text-xs"
          disabled={isLoading}
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Klasifikasi predikat formal yang ditampilkan pada rekapitulasi audit.
        </p>
      </div>

      {/* Status Kepatuhan */}
      <div className="space-y-1.5">
        <Label htmlFor="status_kepatuhan" className="text-xs font-medium">
          Status Kepatuhan <span className="text-destructive">*</span>
        </Label>
        <Input
          id="status_kepatuhan"
          value={statusKepatuhan}
          onChange={(e) => setStatusKepatuhan(e.target.value)}
          placeholder="Contoh: SANGAT PATUH"
          className="text-xs"
          disabled={isLoading}
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Label status kepatuhan ringkas (misal: SANGAT PATUH, CUKUP PATUH).
        </p>
      </div>

      {/* Rentang Nilai: Batas Bawah & Batas Atas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="batas_bawah" className="text-xs font-medium">
            Batas Bawah Nilai (%) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="batas_bawah"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={batasBawah}
            onChange={(e) => setBatasBawah(e.target.value)}
            className="text-xs font-mono"
            disabled={isLoading}
            required
          />
          <p className="text-[11px] text-muted-foreground">
            Ambang minimum skor kelulusan predikat.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="batas_atas" className="text-xs font-medium">
            Batas Atas Nilai (%) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="batas_atas"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={batasAtas}
            onChange={(e) => setBatasAtas(e.target.value)}
            className="text-xs font-mono"
            disabled={isLoading}
            required
          />
          <p className="text-[11px] text-muted-foreground">
            Ambang batas maksimum perolehan predikat.
          </p>
        </div>
      </div>

      {/* Wajib PTK Switch */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5 pr-4">
          <Label htmlFor="wajib_ptk" className="text-xs font-medium cursor-pointer">
            Wajib Terbitkan PTK
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Mewajibkan penerbitan Permintaan Tindakan Korektif (PTK) bagi cabang yang
            memperoleh predikat ini.
          </p>
        </div>
        <Switch
          id="wajib_ptk"
          checked={wajibPtk}
          onCheckedChange={setWajibPtk}
          disabled={isLoading}
        />
      </div>

      {/* Keterangan & Tindak Lanjut */}
      <div className="space-y-1.5">
        <Label htmlFor="keterangan" className="text-xs font-medium">
          Keterangan & Tindak Lanjut <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="keterangan"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Rincian arahan supervisi atau rekomendasi perbaikan..."
          className="text-xs min-h-[85px] leading-relaxed resize-y"
          disabled={isLoading}
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Rekomendasi serta langkah operasional tindak lanjut yang diberikan kepada cabang.
        </p>
      </div>

      {/* Catatan Integritas */}
      <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed flex items-start gap-2">
        <ShieldAlertIcon className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <span>
          <strong>Perhatian:</strong> Perubahan batas nilai persentase ini akan langsung
          memengaruhi kalkulasi predikat seluruh cabang pada basis data secara otomatis.
        </span>
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5">
          {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}
          <span>Simpan Perubahan</span>
        </Button>
      </DialogFooter>
    </form>
  );
}
